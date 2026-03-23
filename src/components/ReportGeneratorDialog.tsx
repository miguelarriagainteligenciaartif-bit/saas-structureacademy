import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { es } from "date-fns/locale";
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

interface ReportGeneratorDialogProps {
  trades: Trade[];
  label?: string;
  directGenerate?: boolean;
  filterLabel?: string;
}

type PresetPeriod = "all" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

export const ReportGeneratorDialog = ({ trades, label }: ReportGeneratorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<PresetPeriod>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const presetDates = useMemo(() => {
    const now = new Date();
    return {
      thisMonth: {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
      },
      lastMonth: {
        start: format(startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)), "yyyy-MM-dd"),
        end: format(endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)), "yyyy-MM-dd"),
      },
      thisYear: {
        start: format(startOfYear(now), "yyyy-MM-dd"),
        end: format(endOfYear(now), "yyyy-MM-dd"),
      },
    };
  }, []);

  const handlePresetChange = (newPreset: PresetPeriod) => {
    setPreset(newPreset);
    if (newPreset === "thisMonth") {
      setStartDate(presetDates.thisMonth.start);
      setEndDate(presetDates.thisMonth.end);
    } else if (newPreset === "lastMonth") {
      setStartDate(presetDates.lastMonth.start);
      setEndDate(presetDates.lastMonth.end);
    } else if (newPreset === "thisYear") {
      setStartDate(presetDates.thisYear.start);
      setEndDate(presetDates.thisYear.end);
    } else if (newPreset === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  const filteredTrades = useMemo(() => {
    if (preset === "all" || (!startDate && !endDate)) {
      return trades;
    }
    return trades.filter(trade => {
      const tradeDate = trade.date;
      if (startDate && tradeDate < startDate) return false;
      if (endDate && tradeDate > endDate) return false;
      return true;
    });
  }, [trades, preset, startDate, endDate]);

  const generateReport = async () => {
    if (filteredTrades.length === 0) {
      toast.error("No hay datos para generar el informe en el período seleccionado");
      return;
    }

    try {
      const actualTrades = filteredTrades.filter(t => !t.no_trade_day);
      const noTradeDays = filteredTrades.filter(t => t.no_trade_day);

      // Sort trades chronologically
      const sortedActualTrades = [...actualTrades].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        const timeCompare = (a.entry_time || "").localeCompare(b.entry_time || "");
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

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

      // Calculate equity curve data
      const equityCurveData: { trade: number; equity: number; date: string }[] = [];
      let cumulative = 0;
      sortedActualTrades.forEach((trade, index) => {
        cumulative += (trade.result_dollars || 0);
        equityCurveData.push({
          trade: index + 1,
          equity: cumulative,
          date: trade.date,
        });
      });

      // Build full model comparison stats
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
      const totalDays = filteredTrades.length;
      const executionRate = totalDays > 0 ? (actualTrades.length / totalDays * 100) : 0;

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const tableStyles = getBrandedTableStyles();
      
      // Period text
      let periodText = "";
      if (preset === "all") {
        periodText = "Período: Todos los datos";
      } else {
        const startFormatted = startDate ? format(parseISO(startDate), "d MMM yyyy", { locale: es }) : "";
        const endFormatted = endDate ? format(parseISO(endDate), "d MMM yyyy", { locale: es }) : "";
        periodText = `Período: ${startFormatted} - ${endFormatted}`;
      }

      // Add branded header with logo
      await addBrandedHeader(
        doc,
        "INFORME DE TRADING",
        "Quantum Trading Tracker",
        periodText
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
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX, yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("MEJOR RACHA", startX + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.success);
      doc.text(`${bestTPStreak} TPs`, startX + boxWidth/2, yPos + 20, { align: "center" });

      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("PEOR RACHA", startX + boxWidth + boxGap + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.danger);
      doc.text(`${worstSLStreak} SLs`, startX + boxWidth + boxGap + boxWidth/2, yPos + 20, { align: "center" });

      doc.setFillColor(245, 247, 250);
      doc.roundedRect(startX + 2*(boxWidth + boxGap), yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("PROM. GANANCIA", startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 8, { align: "center" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.success);
      doc.text(`$${avgWin.toFixed(2)}`, startX + 2*(boxWidth + boxGap) + boxWidth/2, yPos + 20, { align: "center" });

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

      // EQUITY CURVE CHART
      if (equityCurveData.length > 1) {
        yPos = addSectionTitle(doc, "Curva de Equity", yPos);
        yPos += 3;

        const chartX = 20;
        const chartY = yPos;
        const chartWidth = pageWidth - 40;
        const chartHeight = 50;

        // Draw chart background
        doc.setFillColor(250, 250, 252);
        doc.roundedRect(chartX - 5, chartY - 5, chartWidth + 10, chartHeight + 15, 3, 3, 'F');

        // Calculate min/max for scaling
        const values = equityCurveData.map(d => d.equity);
        const minValue = Math.min(0, ...values);
        const maxValue = Math.max(0, ...values);
        const range = maxValue - minValue || 1;
        const padding = range * 0.1;
        const scaledMin = minValue - padding;
        const scaledMax = maxValue + padding;
        const scaledRange = scaledMax - scaledMin;

        // Draw zero line if applicable
        if (minValue < 0 && maxValue > 0) {
          const zeroY = chartY + chartHeight - ((0 - scaledMin) / scaledRange) * chartHeight;
          doc.setDrawColor(180, 180, 180);
          doc.setLineDashPattern([2, 2], 0);
          doc.line(chartX, zeroY, chartX + chartWidth, zeroY);
          doc.setLineDashPattern([], 0);
        }

        // Draw the equity line
        doc.setDrawColor(...brandColors.quantumBlue);
        doc.setLineWidth(0.8);
        
        const points: { x: number; y: number }[] = equityCurveData.map((d, i) => ({
          x: chartX + (i / (equityCurveData.length - 1)) * chartWidth,
          y: chartY + chartHeight - ((d.equity - scaledMin) / scaledRange) * chartHeight,
        }));

        for (let i = 1; i < points.length; i++) {
          // Color based on whether equity is positive or negative at that point
          const isPositive = equityCurveData[i].equity >= 0;
          doc.setDrawColor(isPositive ? brandColors.success[0] : brandColors.danger[0], isPositive ? brandColors.success[1] : brandColors.danger[1], isPositive ? brandColors.success[2] : brandColors.danger[2]);
          doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
        }

        // Draw axes labels
        doc.setFontSize(7);
        doc.setTextColor(...brandColors.textMuted);
        doc.text(`$${scaledMax.toFixed(0)}`, chartX - 3, chartY + 3, { align: "right" });
        doc.text(`$${scaledMin.toFixed(0)}`, chartX - 3, chartY + chartHeight, { align: "right" });
        doc.text("1", chartX, chartY + chartHeight + 8, { align: "center" });
        doc.text(`${equityCurveData.length}`, chartX + chartWidth, chartY + chartHeight + 8, { align: "center" });
        doc.text("Operaciones", chartX + chartWidth / 2, chartY + chartHeight + 8, { align: "center" });

        // Final P&L label
        const lastPoint = points[points.length - 1];
        const lastEquity = equityCurveData[equityCurveData.length - 1].equity;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(lastEquity >= 0 ? brandColors.success[0] : brandColors.danger[0], lastEquity >= 0 ? brandColors.success[1] : brandColors.danger[1], lastEquity >= 0 ? brandColors.success[2] : brandColors.danger[2]);
        doc.text(`$${lastEquity.toFixed(2)}`, lastPoint.x + 3, lastPoint.y - 2);

        yPos += chartHeight + 20;
      }

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

      // Check if we need a new page
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

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
      } else if (aiResult.error) {
        toast.warning(`Informe generado sin análisis IA: ${aiResult.error}`);
      }

      // Add branded footer to all pages
      addBrandedFooter(doc);

      // Generate filename with date range
      let filename = "quantum-trading-report";
      if (preset !== "all" && startDate && endDate) {
        filename += `-${startDate}-a-${endDate}`;
      } else {
        filename += `-${format(new Date(), "yyyy-MM-dd")}`;
      }
      filename += ".pdf";

      doc.save(filename);
      toast.success("Informe PDF descargado exitosamente");
      setOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el informe PDF");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {label || "Descargar Informe PDF"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Informe PDF</DialogTitle>
          <DialogDescription>
            Selecciona el período para generar el informe con métricas y curva de equity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={preset === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange("all")}
                className="w-full"
              >
                Todos los datos
              </Button>
              <Button
                variant={preset === "thisMonth" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange("thisMonth")}
                className="w-full"
              >
                Este mes
              </Button>
              <Button
                variant={preset === "lastMonth" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange("lastMonth")}
                className="w-full"
              >
                Mes pasado
              </Button>
              <Button
                variant={preset === "thisYear" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange("thisYear")}
                className="w-full"
              >
                Este año
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rango personalizado</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreset("custom");
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreset("custom");
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {filteredTrades.length} operaciones en el período seleccionado
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={generateReport} disabled={filteredTrades.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Generar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
