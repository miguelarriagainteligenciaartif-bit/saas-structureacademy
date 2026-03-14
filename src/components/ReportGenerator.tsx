import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  brandColors,
  addBrandedHeader,
  addBrandedFooter,
  getBrandedTableStyles,
  addSectionTitle,
} from "@/utils/pdfBranding";
import { fetchAIAnalysis, buildJournalDataSummary } from "@/utils/aiAnalysis";
import { addAIAnalysisSection } from "@/utils/pdfAISection";

interface Trade {
  id: string;
  date: string;
  day_of_week: string;
  week_of_month: number | null;
  entry_time: string | null;
  exit_time: string | null;
  trade_type: string | null;
  result_type: string | null;
  drawdown?: number | null;
  max_rr?: number | null;
  entry_model: string | null;
  continuation_subtype?: string | null;
  result_dollars: number | null;
  had_news: boolean;
  news_description: string | null;
  custom_news_description: string | null;
  news_time: string | null;
  execution_timing: string | null;
  no_trade_day: boolean;
  image_link: string | null;
}

const formatModel = (trade: Trade) => {
  if (trade.entry_model === "Continuación" && trade.continuation_subtype) {
    return `Cont. ${trade.continuation_subtype}`;
  }
  return trade.entry_model || "N/A";
};

interface ReportGeneratorProps {
  trades: Trade[];
}

export const ReportGenerator = ({ trades }: ReportGeneratorProps) => {
  const generateReport = async () => {
    if (trades.length === 0) {
      toast.error("No hay datos para generar el informe");
      return;
    }

    try {
      // Filter out no-trade days for statistics
      const actualTrades = trades.filter(t => !t.no_trade_day);
      const noTradeDays = trades.filter(t => t.no_trade_day);

      // Calculate statistics
      const totalPnL = actualTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
      const winningTrades = actualTrades.filter(t => t.result_type === "TP");
      const losingTrades = actualTrades.filter(t => t.result_type === "SL");
      const winRate = actualTrades.length > 0 ? (winningTrades.length / actualTrades.length * 100) : 0;
      
      const avgWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0) / winningTrades.length 
        : 0;
      const avgLoss = losingTrades.length > 0 
        ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0) / losingTrades.length)
        : 0;
      const expectedValue = avgWin * (winRate / 100) - avgLoss * (1 - winRate / 100);

      // Calculate streaks
      let currentTPStreak = 0;
      let bestTPStreak = 0;
      let currentSLStreak = 0;
      let worstSLStreak = 0;

      const sortedActualTrades = [...actualTrades].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        const timeCompare = (a.entry_time || "").localeCompare(b.entry_time || "");
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      sortedActualTrades.forEach(trade => {
        if (trade.result_type === "TP") {
          currentTPStreak++;
          currentSLStreak = 0;
          if (currentTPStreak > bestTPStreak) bestTPStreak = currentTPStreak;
        } else if (trade.result_type === "SL") {
          currentSLStreak++;
          currentTPStreak = 0;
          if (currentSLStreak > worstSLStreak) worstSLStreak = currentSLStreak;
        } else {
          currentTPStreak = 0;
          currentSLStreak = 0;
        }
      });

      // Build full model comparison stats (matching dashboard)
      const buildModelRow = (label: string, trds: Trade[], isSubrow = false) => {
        const wins = trds.filter(t => t.result_type === "TP");
        const losses = trds.filter(t => t.result_type === "SL");
        const pnl = trds.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
        const decisive = trds.filter(t => t.result_type === "TP" || t.result_type === "SL");
        const wr = decisive.length > 0 ? wins.length / decisive.length : 0;
        const avgW = wins.length > 0 ? wins.reduce((s, t) => s + (t.result_dollars || 0), 0) / wins.length : 0;
        const avgL = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.result_dollars || 0), 0) / losses.length) : 0;
        const ev = decisive.length > 0 ? (wr * avgW) - ((1 - wr) * avgL) : 0;
        return { label, trades: trds.length, wins: wins.length, losses: losses.length,
          winRate: trds.length > 0 ? (wins.length / trds.length * 100) : 0, pnl, ev, isSubrow };
      };

      const comparisonRows = [
        buildModelRow("M1", actualTrades.filter(t => t.entry_model === "M1")),
        buildModelRow("M3", actualTrades.filter(t => t.entry_model === "M3")),
        buildModelRow("Continuación", actualTrades.filter(t => t.entry_model === "Continuación")),
        buildModelRow("  - Bloque", actualTrades.filter(t => t.entry_model === "Continuación" && t.continuation_subtype === "Bloque"), true),
        buildModelRow("  - FVG", actualTrades.filter(t => t.entry_model === "Continuación" && t.continuation_subtype === "FVG"), true),
        buildModelRow("Total", actualTrades),
      ];

      const modelStats = comparisonRows.filter(r => !r.isSubrow && r.label !== "Total").map(r => ({
        model: r.label, trades: r.trades, pnl: r.pnl, winRate: r.winRate,
      }));

      // By day of week
      const dayStats = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(day => {
        const dayTrades = actualTrades.filter(t => t.day_of_week?.toLowerCase() === day.toLowerCase());
        const dayWins = dayTrades.filter(t => t.result_type === "TP");
        const dayPnL = dayTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
        const dayWinRate = dayTrades.length > 0 ? (dayWins.length / dayTrades.length * 100) : 0;
        return { day, trades: dayTrades.length, pnl: dayPnL, winRate: dayWinRate };
      });

      // By week of month
      const weekStats = [1, 2, 3, 4, 5].map(week => {
        const weekTrades = actualTrades.filter(t => t.week_of_month === week);
        const weekWins = weekTrades.filter(t => t.result_type === "TP");
        const weekPnL = weekTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
        const weekWinRate = weekTrades.length > 0 ? (weekWins.length / weekTrades.length * 100) : 0;
        return { week, trades: weekTrades.length, pnl: weekPnL, winRate: weekWinRate };
      });

      // News analysis
      const tradesWithNews = actualTrades.filter(t => t.had_news);
      const tradesWithoutNews = actualTrades.filter(t => !t.had_news);
      const newsWins = tradesWithNews.filter(t => t.result_type === "TP");
      const noNewsWins = tradesWithoutNews.filter(t => t.result_type === "TP");
      const newsPnL = tradesWithNews.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
      const noNewsPnL = tradesWithoutNews.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
      const newsWinRate = tradesWithNews.length > 0 ? (newsWins.length / tradesWithNews.length * 100) : 0;
      const noNewsWinRate = tradesWithoutNews.length > 0 ? (noNewsWins.length / tradesWithoutNews.length * 100) : 0;

      // Trade type analysis
      const buyTrades = actualTrades.filter(t => t.trade_type?.toLowerCase() === "compra" || t.trade_type?.toLowerCase() === "buy" || t.trade_type?.toLowerCase() === "long");
      const sellTrades = actualTrades.filter(t => t.trade_type?.toLowerCase() === "venta" || t.trade_type?.toLowerCase() === "sell" || t.trade_type?.toLowerCase() === "short");
      const buyWins = buyTrades.filter(t => t.result_type === "TP");
      const sellWins = sellTrades.filter(t => t.result_type === "TP");
      const buyWinRate = buyTrades.length > 0 ? (buyWins.length / buyTrades.length * 100) : 0;
      const sellWinRate = sellTrades.length > 0 ? (sellWins.length / sellTrades.length * 100) : 0;

      // Execution rate
      const totalDays = trades.length;
      const executionRate = totalDays > 0 ? (actualTrades.length / totalDays * 100) : 0;

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const tableStyles = getBrandedTableStyles();
      
      // Add branded header with logo
      await addBrandedHeader(
        doc,
        "INFORME DE TRADING",
        "Quantum Trading Tracker",
        `Generado: ${new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`
      );

      let yPos = 70;

      // Summary Section
      yPos = addSectionTitle(doc, "Resumen General", yPos);
      yPos += 5;

      // Summary boxes
      const boxWidth = 42;
      const boxHeight = 28;
      const boxGap = 4;
      const startX = 14;

      // Box 1: Total P&L
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX, yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("P&L TOTAL", startX + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(totalPnL >= 0 ? brandColors.success[0] : brandColors.danger[0], totalPnL >= 0 ? brandColors.success[1] : brandColors.danger[1], totalPnL >= 0 ? brandColors.success[2] : brandColors.danger[2]);
      doc.text(`$${totalPnL.toFixed(2)}`, startX + boxWidth/2, yPos + 20, { align: "center" });

      // Box 2: Win Rate
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("WIN RATE", startX + boxWidth + boxGap + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(winRate >= 50 ? brandColors.success[0] : brandColors.danger[0], winRate >= 50 ? brandColors.success[1] : brandColors.danger[1], winRate >= 50 ? brandColors.success[2] : brandColors.danger[2]);
      doc.text(`${winRate.toFixed(1)}%`, startX + boxWidth + boxGap + boxWidth/2, yPos + 20, { align: "center" });

      // Box 3: Total Trades
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX + 2*(boxWidth + boxGap), yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("OPERACIONES", startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`${actualTrades.length}`, startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 20, { align: "center" });

      // Box 4: Expected Value
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX + 3*(boxWidth + boxGap), yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("EXPECTATIVA", startX + 3*(boxWidth + boxGap) + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(expectedValue >= 0 ? brandColors.success[0] : brandColors.danger[0], expectedValue >= 0 ? brandColors.success[1] : brandColors.danger[1], expectedValue >= 0 ? brandColors.success[2] : brandColors.danger[2]);
      doc.text(`$${expectedValue.toFixed(2)}`, startX + 3*(boxWidth + boxGap) + boxWidth/2, yPos + 20, { align: "center" });

      yPos += boxHeight + 10;

      // Second row of boxes
      // Box 5: Best Streak
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX, yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("MEJOR RACHA", startX + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.success);
      doc.text(`${bestTPStreak} TPs`, startX + boxWidth/2, yPos + 20, { align: "center" });

      // Box 6: Worst Streak
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("PEOR RACHA", startX + boxWidth + boxGap + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.danger);
      doc.text(`${worstSLStreak} SLs`, startX + boxWidth + boxGap + boxWidth/2, yPos + 20, { align: "center" });

      // Box 7: Avg Win
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX + 2*(boxWidth + boxGap), yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("PROM. GANANCIA", startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.success);
      doc.text(`$${avgWin.toFixed(2)}`, startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 20, { align: "center" });

      // Box 8: Avg Loss
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX + 3*(boxWidth + boxGap), yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("PROM. PÉRDIDA", startX + 3*(boxWidth + boxGap) + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.danger);
      doc.text(`$${avgLoss.toFixed(2)}`, startX + 3*(boxWidth + boxGap) + boxWidth/2, yPos + 20, { align: "center" });

      yPos += boxHeight + 15;

      // Comparativa por Modelo (full table with subtypes + EV)
      yPos = addSectionTitle(doc, "Comparativa por Modelo", yPos);

      autoTable(doc, {
        startY: yPos,
        head: [['Modelo', 'Trades', 'TP', 'SL', 'Win Rate', 'P&L Total', 'Expected Value']],
        body: comparisonRows.map(r => [
          r.label,
          r.trades.toString(),
          r.wins.toString(),
          r.losses.toString(),
          r.trades > 0 ? `${r.winRate.toFixed(1)}%` : '—',
          r.trades > 0 ? `$${r.pnl.toFixed(2)}` : '—',
          r.trades > 0 ? `$${r.ev.toFixed(2)}` : '—',
        ]),
        theme: 'striped',
        ...tableStyles,
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' },
          4: { halign: 'center' }, 5: { halign: 'right' }, 6: { halign: 'right' },
        },
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            const row = comparisonRows[data.row.index];
            if (row?.isSubrow) {
              data.cell.styles.fillColor = [235, 238, 242];
              if (data.column.index === 0) { data.cell.styles.textColor = [120, 120, 130]; data.cell.styles.fontStyle = 'normal'; }
            }
            if (row?.label === 'Total') data.cell.styles.fontStyle = 'bold';
            if (data.column.index === 2) data.cell.styles.textColor = brandColors.success;
            if (data.column.index === 3) data.cell.styles.textColor = brandColors.danger;
            if (row && row.trades > 0 && (data.column.index === 5 || data.column.index === 6)) {
              const val = data.column.index === 5 ? row.pnl : row.ev;
              data.cell.styles.textColor = val >= 0 ? brandColors.success : brandColors.danger;
            }
          }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Day Analysis Table
      yPos = addSectionTitle(doc, "Análisis por Día de la Semana", yPos);

      autoTable(doc, {
        startY: yPos,
        head: [['Día', 'Operaciones', 'P&L', 'Win Rate']],
        body: dayStats.map(d => [
          d.day,
          d.trades.toString(),
          `$${d.pnl.toFixed(2)}`,
          `${d.winRate.toFixed(1)}%`
        ]),
        theme: 'striped',
        ...tableStyles,
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Week Analysis Table
      yPos = addSectionTitle(doc, "Análisis por Semana del Mes", yPos);

      autoTable(doc, {
        startY: yPos,
        head: [['Semana', 'Operaciones', 'P&L', 'Win Rate']],
        body: weekStats.map(w => [
          `Semana ${w.week}`,
          w.trades.toString(),
          `$${w.pnl.toFixed(2)}`,
          `${w.winRate.toFixed(1)}%`
        ]),
        theme: 'striped',
        ...tableStyles,
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      // New page for additional analysis
      doc.addPage();
      yPos = 20;

      // Trade Type Analysis
      yPos = addSectionTitle(doc, "Análisis por Tipo de Operación", yPos);

      autoTable(doc, {
        startY: yPos,
        head: [['Tipo', 'Operaciones', 'Ganadas', 'Win Rate']],
        body: [
          ['Compra (Long)', buyTrades.length.toString(), buyWins.length.toString(), `${buyWinRate.toFixed(1)}%`],
          ['Venta (Short)', sellTrades.length.toString(), sellWins.length.toString(), `${sellWinRate.toFixed(1)}%`]
        ],
        theme: 'striped',
        ...tableStyles,
        columnStyles: {
          3: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 12;

      // News Analysis
      yPos = addSectionTitle(doc, "Análisis de Impacto de Noticias", yPos);

      autoTable(doc, {
        startY: yPos,
        head: [['Condición', 'Operaciones', 'P&L', 'Win Rate']],
        body: [
          ['Con Noticias', tradesWithNews.length.toString(), `$${newsPnL.toFixed(2)}`, `${newsWinRate.toFixed(1)}%`],
          ['Sin Noticias', tradesWithoutNews.length.toString(), `$${noNewsPnL.toFixed(2)}`, `${noNewsWinRate.toFixed(1)}%`]
        ],
        theme: 'striped',
        ...tableStyles,
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Execution Statistics
      yPos = addSectionTitle(doc, "Estadísticas de Ejecución", yPos);

      autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Valor']],
        body: [
          ['Total de Días Registrados', totalDays.toString()],
          ['Días con Operación', actualTrades.length.toString()],
          ['Días sin Entrada', noTradeDays.length.toString()],
          ['Tasa de Ejecución', `${executionRate.toFixed(1)}%`]
        ],
        theme: 'striped',
        ...tableStyles,
        columnStyles: {
          1: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Trade Details Title
      yPos = addSectionTitle(doc, "Detalle de Operaciones", yPos);

      // Trade Details Table
      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Día', 'Hora', 'Tipo', 'Modelo', 'Resultado', 'P&L']],
        body: sortedActualTrades.map(trade => [
          trade.date,
          trade.day_of_week || 'N/A',
          trade.entry_time || 'N/A',
          trade.trade_type || 'N/A',
          formatModel(trade),
          trade.result_type || 'N/A',
          `$${(trade.result_dollars || 0).toFixed(2)}`
        ]),
        theme: 'striped',
        headStyles: { 
          fillColor: brandColors.quantumBlue,
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          6: { halign: 'right' }
        },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'TP') {
              data.cell.styles.textColor = brandColors.success;
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'SL') {
              data.cell.styles.textColor = brandColors.danger;
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      // AI Analysis Section
      toast.info("Generando análisis con IA...");
      const continuationSubtypeStats = ["Bloque", "FVG"].map(subtype => {
        const subTrades = actualTrades.filter(t => t.entry_model === "Continuación" && t.continuation_subtype === subtype);
        const wins = subTrades.filter(t => t.result_type === "TP").length;
        const pnl = subTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
        const wr = subTrades.length > 0 ? (wins / subTrades.length * 100) : 0;
        return { subtype, trades: subTrades.length, pnl, winRate: wr };
      });
      const dataSummary = buildJournalDataSummary({
        totalTrades: actualTrades.length,
        totalPnL,
        winRate,
        expectedValue,
        avgWin,
        avgLoss,
        bestTPStreak,
        worstSLStreak,
        modelStats,
        dayStats,
        continuationSubtypeStats,
      });

      const aiResult = await fetchAIAnalysis("journal", dataSummary);
      if (aiResult.analysis) {
        doc.addPage();
        addAIAnalysisSection(doc, aiResult.analysis, 20);
      }

      // Add branded footer to all pages
      addBrandedFooter(doc);

      // Save PDF
      doc.save(`quantum-trading-report-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Informe PDF descargado exitosamente");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el informe PDF");
    }
  };

  return (
    <Button onClick={generateReport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Descargar Informe PDF
    </Button>
  );
};
