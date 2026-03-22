import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

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
  fvg_count?: number | null;
  entry_subtype?: string | null;
  result_dollars: number | null;
  had_news: boolean;
  news_description: string | null;
  custom_news_description: string | null;
  news_time: string | null;
  execution_timing: string | null;
  no_trade_day: boolean;
  image_link: string | null;
  notes?: string | null;
  asset?: string | null;
  risk_percentage?: number | null;
  account_id?: string | null;
}

interface CSVExportButtonProps {
  trades: Trade[];
}

export const CSVExportButton = ({ trades }: CSVExportButtonProps) => {
  const exportToCSV = () => {
    if (trades.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const actualTrades = trades.filter(t => !t.no_trade_day);
    const noTradeDays = trades.filter(t => t.no_trade_day);

    // Statistics summary
    const totalPnL = actualTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
    const winningTrades = actualTrades.filter(t => t.result_type === "TP");
    const losingTrades = actualTrades.filter(t => t.result_type === "SL");
    const breakEvenTrades = actualTrades.filter(t => t.result_type === "Break Even");
    const winRate = actualTrades.length > 0 ? (winningTrades.length / actualTrades.length * 100) : 0;
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0) / winningTrades.length
      : 0;
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0) / losingTrades.length)
      : 0;
    const expectedValue = avgWin * (winRate / 100) - avgLoss * (1 - winRate / 100);

    let csvContent = "QUANTUM TRADING TRACKER - EXPORTACIÓN DE DATOS\n\n";

    // Summary section
    csvContent += "=== RESUMEN GENERAL ===\n";
    csvContent += `P&L Total,$${totalPnL.toFixed(2)}\n`;
    csvContent += `Win Rate,${winRate.toFixed(1)}%\n`;
    csvContent += `Total Operaciones,${actualTrades.length}\n`;
    csvContent += `Trades Ganados (TP),${winningTrades.length}\n`;
    csvContent += `Trades Perdidos (SL),${losingTrades.length}\n`;
    csvContent += `Break Even,${breakEvenTrades.length}\n`;
    csvContent += `Promedio Ganancia,$${avgWin.toFixed(2)}\n`;
    csvContent += `Promedio Pérdida,$${avgLoss.toFixed(2)}\n`;
    csvContent += `Expectativa,$${expectedValue.toFixed(2)}\n`;
    csvContent += `Días Sin Entrada,${noTradeDays.length}\n`;
    csvContent += `Tasa de Ejecución,${trades.length > 0 ? (actualTrades.length / trades.length * 100).toFixed(1) : 0}%\n\n`;

    // By model
    csvContent += "=== ANÁLISIS POR MODELO ===\n";
    csvContent += "Modelo,Operaciones,P&L,Win Rate\n";
    ["M1", "M3", "Continuación"].forEach(model => {
      const modelTrades = actualTrades.filter(t => t.entry_model === model);
      const wins = modelTrades.filter(t => t.result_type === "TP").length;
      const pnl = modelTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
      const wr = modelTrades.length > 0 ? (wins / modelTrades.length * 100) : 0;
      csvContent += `${model},${modelTrades.length},$${pnl.toFixed(2)},${wr.toFixed(1)}%\n`;
    });
    csvContent += "\n";

    // By day
    csvContent += "=== ANÁLISIS POR DÍA ===\n";
    csvContent += "Día,Operaciones,P&L,Win Rate\n";
    ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].forEach(day => {
      const dayTrades = actualTrades.filter(t => t.day_of_week?.toLowerCase() === day.toLowerCase());
      const wins = dayTrades.filter(t => t.result_type === "TP").length;
      const pnl = dayTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
      const wr = dayTrades.length > 0 ? (wins / dayTrades.length * 100) : 0;
      csvContent += `${day},${dayTrades.length},$${pnl.toFixed(2)},${wr.toFixed(1)}%\n`;
    });
    csvContent += "\n";

    // By week
    csvContent += "=== ANÁLISIS POR SEMANA DEL MES ===\n";
    csvContent += "Semana,Operaciones,P&L,Win Rate\n";
    [1, 2, 3, 4, 5].forEach(week => {
      const weekTrades = actualTrades.filter(t => t.week_of_month === week);
      if (weekTrades.length > 0) {
        const wins = weekTrades.filter(t => t.result_type === "TP").length;
        const pnl = weekTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
        const wr = (wins / weekTrades.length * 100);
        csvContent += `Semana ${week},${weekTrades.length},$${pnl.toFixed(2)},${wr.toFixed(1)}%\n`;
      }
    });
    csvContent += "\n";

    // Trade details
    csvContent += "=== DETALLE DE OPERACIONES ===\n";
    csvContent += "Fecha,Día,Semana,Hora Entrada,Hora Salida,Tipo,Modelo,Resultado,P&L,Max RR,Drawdown,Noticias,Descripción Noticias,Hora Noticias,Timing Ejecución,Notas,No Trade Day\n";

    const sorted = [...trades].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.entry_time || "").localeCompare(b.entry_time || "");
    });

    sorted.forEach(trade => {
      const escapeCsv = (val: string | null | undefined) => {
        if (!val) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      csvContent += [
        trade.date,
        trade.day_of_week || "",
        trade.week_of_month ?? "",
        trade.entry_time || "",
        trade.exit_time || "",
        trade.trade_type || "",
        trade.entry_model || "",
        trade.no_trade_day ? "No Trade Day" : (trade.result_type || ""),
        trade.no_trade_day ? "" : `$${(trade.result_dollars || 0).toFixed(2)}`,
        trade.max_rr !== null && trade.max_rr !== undefined ? trade.max_rr.toFixed(2) : "",
        trade.drawdown !== null && trade.drawdown !== undefined ? trade.drawdown.toFixed(2) : "",
        trade.had_news ? "Sí" : "No",
        escapeCsv(trade.news_description || trade.custom_news_description),
        trade.news_time || "",
        trade.execution_timing || "",
        escapeCsv((trade as any).notes),
        trade.no_trade_day ? "Sí" : "No",
      ].join(",") + "\n";
    });

    // Download
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `quantum-trading-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Datos exportados a CSV exitosamente");
  };

  return (
    <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
      <FileSpreadsheet className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
};
