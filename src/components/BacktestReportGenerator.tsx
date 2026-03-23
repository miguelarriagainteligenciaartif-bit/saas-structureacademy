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
import { fetchAIAnalysis, buildBacktestDataSummary } from "@/utils/aiAnalysis";
import { addAIAnalysisSection } from "@/utils/pdfAISection";

interface BacktestTrade {
  id: string;
  date: string;
  day_of_week: string;
  week_of_month: number;
  entry_time: string;
  exit_time: string | null;
  entry_model: string;
  trade_type: string;
  result_type: string;
  result_dollars: number;
  had_news: boolean;
  news_time: string | null;
  news_description: string | null;
  custom_news_description: string | null;
  execution_timing: string | null;
  no_trade_day: boolean;
  image_link: string | null;
  strategy_id: string | null;
  max_rr: number | null;
  drawdown: number | null;
}

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  initial_capital: number;
  risk_reward_ratio: string;
}

interface BacktestReportGeneratorProps {
  trades: BacktestTrade[];
  strategy: Strategy;
}

export const BacktestReportGenerator = ({ trades, strategy }: BacktestReportGeneratorProps) => {
  const generateReport = async () => {
    if (trades.length === 0) {
      toast.error("No hay datos para generar el informe");
      return;
    }

    try {
      const actualTrades = trades.filter(t => !t.no_trade_day);
      const noTradeDays = trades.filter(t => t.no_trade_day).length;
      const totalDays = trades.length;

      const totalTrades = actualTrades.length;
      const winningTrades = actualTrades.filter(t => t.result_type === "TP").length;
      const losingTrades = actualTrades.filter(t => t.result_type === "SL").length;
      const breakEvenTrades = actualTrades.filter(t => t.result_type === "Break Even").length;

      const totalProfit = actualTrades.reduce((sum, t) => sum + Number(t.result_dollars), 0);
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      const avgWin = winningTrades > 0
        ? actualTrades.filter(t => t.result_type === "TP").reduce((sum, t) => sum + Number(t.result_dollars), 0) / winningTrades
        : 0;
      const avgLoss = losingTrades > 0
        ? Math.abs(actualTrades.filter(t => t.result_type === "SL").reduce((sum, t) => sum + Number(t.result_dollars), 0) / losingTrades)
        : 0;

      const decisiveTrades = winningTrades + losingTrades;
      const decisiveWinRate = decisiveTrades > 0 ? winningTrades / decisiveTrades : 0;
      const expectedValue = decisiveTrades > 0 ? (decisiveWinRate * avgWin) - ((1 - decisiveWinRate) * avgLoss) : 0;

      // Streaks
      let currentTPStreak = 0;
      let bestTPStreak = 0;
      let currentSLStreak = 0;
      let worstSLStreak = 0;

      const sortedTrades = [...actualTrades].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        const timeCompare = (a.entry_time || "").localeCompare(b.entry_time || "");
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      sortedTrades.forEach(trade => {
        if (trade.result_type === "TP") {
          currentTPStreak++;
          currentSLStreak = 0;
          if (currentTPStreak > bestTPStreak) bestTPStreak = currentTPStreak;
        } else if (trade.result_type === "SL") {
          currentSLStreak++;
          currentTPStreak = 0;
          if (currentSLStreak > worstSLStreak) worstSLStreak = currentSLStreak;
        } else if (trade.result_type === "Break Even") {
          currentSLStreak = 0;
        } else {
          currentTPStreak = 0;
          currentSLStreak = 0;
        }
      });

      // Max RR
      const tradesWithMaxRR = actualTrades.filter(t => t.max_rr !== null && t.max_rr !== undefined);
      const avgMaxRR = tradesWithMaxRR.length > 0
        ? tradesWithMaxRR.reduce((sum, t) => sum + (t.max_rr || 0), 0) / tradesWithMaxRR.length
        : 0;

      // By model
      const modelStats = ["M1", "M3", "Continuacion"].map(model => {
        const modelTrades = actualTrades.filter(t => t.entry_model === model);
        const wins = modelTrades.filter(t => t.result_type === "TP").length;
        const pnl = modelTrades.reduce((sum, t) => sum + Number(t.result_dollars), 0);
        const wr = modelTrades.length > 0 ? (wins / modelTrades.length * 100) : 0;
        return { model, trades: modelTrades.length, pnl, winRate: wr };
      });

      // By day
      const dayStats = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"].map(day => {
        const dayTrades = actualTrades.filter(t => t.day_of_week === day);
        const wins = dayTrades.filter(t => t.result_type === "TP").length;
        const pnl = dayTrades.reduce((sum, t) => sum + Number(t.result_dollars), 0);
        const wr = dayTrades.length > 0 ? (wins / dayTrades.length * 100) : 0;
        return { day, trades: dayTrades.length, pnl, winRate: wr };
      });

      // By trade type
      const buyTrades = actualTrades.filter(t => t.trade_type?.toLowerCase() === "compra" || t.trade_type?.toLowerCase() === "buy" || t.trade_type?.toLowerCase() === "long");
      const sellTrades = actualTrades.filter(t => t.trade_type?.toLowerCase() === "venta" || t.trade_type?.toLowerCase() === "sell" || t.trade_type?.toLowerCase() === "short");
      const buyWins = buyTrades.filter(t => t.result_type === "TP").length;
      const sellWins = sellTrades.filter(t => t.result_type === "TP").length;
      const buyWinRate = buyTrades.length > 0 ? (buyWins / buyTrades.length * 100) : 0;
      const sellWinRate = sellTrades.length > 0 ? (sellWins / sellTrades.length * 100) : 0;

      // Create PDF
      const doc = new jsPDF();
      const tableStyles = getBrandedTableStyles();

      await addBrandedHeader(
        doc,
        "INFORME DE BACKTESTING",
        `Estrategia: ${strategy.name}`,
        `R:R ${strategy.risk_reward_ratio} - Generado: ${new Date().toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}`
      );

      let yPos = 70;

      // Summary boxes
      yPos = addSectionTitle(doc, "Resumen General", yPos);
      yPos += 5;

      const boxWidth = 42;
      const boxHeight = 28;
      const boxGap = 4;
      const startX = 14;

      const drawBox = (x: number, y: number, label: string, value: string, color?: [number, number, number]) => {
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F');
        doc.setFontSize(8);
        doc.setTextColor(...brandColors.textMuted);
        doc.text(label, x + boxWidth / 2, y + 8, { align: "center" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        if (color) doc.setTextColor(...color);
        else doc.setTextColor(30, 30, 30);
        doc.text(value, x + boxWidth / 2, y + 20, { align: "center" });
        doc.setFont("helvetica", "normal");
      };

      // Row 1
      drawBox(startX, yPos, "CAPITAL INICIAL", `$${strategy.initial_capital.toFixed(2)}`);
      const currentCapital = strategy.initial_capital + totalProfit;
      drawBox(startX + boxWidth + boxGap, yPos, "CAPITAL ACTUAL", `$${currentCapital.toFixed(2)}`,
        currentCapital >= strategy.initial_capital ? brandColors.success : brandColors.danger);
      drawBox(startX + 2 * (boxWidth + boxGap), yPos, "P&L TOTAL", `$${totalProfit.toFixed(2)}`,
        totalProfit >= 0 ? brandColors.success : brandColors.danger);
      drawBox(startX + 3 * (boxWidth + boxGap), yPos, "WIN RATE", `${winRate.toFixed(1)}%`,
        winRate >= 50 ? brandColors.success : brandColors.danger);

      yPos += boxHeight + 10;

      // Row 2
      drawBox(startX, yPos, "EXPECTED VALUE", `$${expectedValue.toFixed(2)}`,
        expectedValue >= 0 ? brandColors.success : brandColors.danger);
      drawBox(startX + boxWidth + boxGap, yPos, "OPERACIONES", `${totalTrades}`);
      drawBox(startX + 2 * (boxWidth + boxGap), yPos, "MEJOR RACHA", `${bestTPStreak} TPs`, brandColors.success);
      drawBox(startX + 3 * (boxWidth + boxGap), yPos, "PEOR RACHA", `${worstSLStreak} SLs`, brandColors.danger);

      yPos += boxHeight + 10;

      // Row 3
      drawBox(startX, yPos, "PROM. GANANCIA", `$${avgWin.toFixed(2)}`, brandColors.success);
      drawBox(startX + boxWidth + boxGap, yPos, "PROM. PERDIDA", `$${avgLoss.toFixed(2)}`, brandColors.danger);
      drawBox(startX + 2 * (boxWidth + boxGap), yPos, "BREAK EVEN", `${breakEvenTrades}`);
      drawBox(startX + 3 * (boxWidth + boxGap), yPos, "RR MÁX PROM",
        avgMaxRR > 0 ? avgMaxRR.toFixed(2) : "N/A");

      yPos += boxHeight + 15;

      // Model table
      yPos = addSectionTitle(doc, "Análisis por Modelo de Entrada", yPos);
      autoTable(doc, {
        startY: yPos,
        head: [['Modelo', 'Operaciones', 'P&L', 'Win Rate']],
        body: modelStats.map(m => [m.model, m.trades.toString(), `$${m.pnl.toFixed(2)}`, `${m.winRate.toFixed(1)}%`]),
        theme: 'striped',
        ...tableStyles,
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 14, right: 14 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Day table
      yPos = addSectionTitle(doc, "Análisis por Día de la Semana", yPos);
      autoTable(doc, {
        startY: yPos,
        head: [['Día', 'Operaciones', 'P&L', 'Win Rate']],
        body: dayStats.map(d => [d.day, d.trades.toString(), `$${d.pnl.toFixed(2)}`, `${d.winRate.toFixed(1)}%`]),
        theme: 'striped',
        ...tableStyles,
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 14, right: 14 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Week table
      const weekStats = [1, 2, 3, 4, 5].map(week => {
        const weekTrades = actualTrades.filter(t => t.week_of_month === week);
        const wins = weekTrades.filter(t => t.result_type === "TP").length;
        const pnl = weekTrades.reduce((sum, t) => sum + Number(t.result_dollars), 0);
        const wr = weekTrades.length > 0 ? (wins / weekTrades.length * 100) : 0;
        return { week: `Semana ${week}`, trades: weekTrades.length, pnl, winRate: wr };
      }).filter(w => w.trades > 0);

      if (weekStats.length > 0) {
        yPos = addSectionTitle(doc, "Análisis por Semana del Mes", yPos);
        autoTable(doc, {
          startY: yPos,
          head: [['Semana', 'Operaciones', 'P&L', 'Win Rate']],
          body: weekStats.map(w => [w.week, w.trades.toString(), `$${w.pnl.toFixed(2)}`, `${w.winRate.toFixed(1)}%`]),
          theme: 'striped',
          ...tableStyles,
          columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
          margin: { left: 14, right: 14 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 12;
      }

      // New page
      doc.addPage();
      yPos = 20;

      // Trade type table
      yPos = addSectionTitle(doc, "Análisis por Tipo de Operación", yPos);
      autoTable(doc, {
        startY: yPos,
        head: [['Tipo', 'Operaciones', 'Ganadas', 'Win Rate']],
        body: [
          ['Compra (Long)', buyTrades.length.toString(), buyWins.toString(), `${buyWinRate.toFixed(1)}%`],
          ['Venta (Short)', sellTrades.length.toString(), sellWins.toString(), `${sellWinRate.toFixed(1)}%`]
        ],
        theme: 'striped',
        ...tableStyles,
        columnStyles: { 3: { halign: 'right' } },
        margin: { left: 14, right: 14 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Execution stats
      yPos = addSectionTitle(doc, "Estadísticas de Ejecución", yPos);
      autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Valor']],
        body: [
          ['Total de Días Registrados', totalDays.toString()],
          ['Días con Operación', totalTrades.toString()],
          ['Días sin Entrada', noTradeDays.toString()],
          ['Tasa de Ejecución', `${(totalDays > 0 ? (totalTrades / totalDays * 100) : 0).toFixed(1)}%`],
          ['Ops con RR Máximo', tradesWithMaxRR.length.toString()],
          ['RR Máximo Promedio', avgMaxRR > 0 ? avgMaxRR.toFixed(2) : 'N/A'],
        ],
        theme: 'striped',
        ...tableStyles,
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 14, right: 14 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Trade details
      yPos = addSectionTitle(doc, "Detalle de Operaciones", yPos);
      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Día', 'Hora', 'Tipo', 'Modelo', 'Resultado', 'P&L', 'RR Máx']],
        body: sortedTrades.map(trade => [
          trade.date,
          trade.day_of_week || 'N/A',
          trade.entry_time || 'N/A',
          trade.trade_type || 'N/A',
          trade.entry_model || 'N/A',
          trade.result_type || 'N/A',
          `$${Number(trade.result_dollars).toFixed(2)}`,
          trade.max_rr !== null ? trade.max_rr.toFixed(2) : '-'
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: brandColors.quantumBlue,
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 7 },
        columnStyles: { 6: { halign: 'right' }, 7: { halign: 'right' } },
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
      // backtest_trades does not have continuation_subtype column, so skip subtype analysis

      const dataSummary = buildBacktestDataSummary({
        strategyName: strategy.name,
        rrRatio: strategy.risk_reward_ratio,
        initialCapital: strategy.initial_capital,
        totalTrades,
        totalPnL: totalProfit,
        winRate,
        expectedValue,
        avgWin,
        avgLoss,
        bestTPStreak,
        worstSLStreak,
        modelStats,
        dayStats,
        continuationSubtypeStats: undefined,
      });

      const aiResult = await fetchAIAnalysis("backtest", dataSummary);
      if (aiResult.analysis) {
        doc.addPage();
        addAIAnalysisSection(doc, aiResult.analysis, 20);
      }

      addBrandedFooter(doc);

      const strategySlug = strategy.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      doc.save(`quantum-backtest-${strategySlug}-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Informe de backtesting descargado exitosamente");
    } catch (error) {
      console.error("Error generating backtest PDF:", error);
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
