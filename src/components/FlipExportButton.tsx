import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { SimulationResult, FlipConfig } from "@/utils/flipX5Simulator";

interface FlipExportButtonProps {
  result: SimulationResult;
  config: FlipConfig;
}

export const FlipExportButton = ({ result, config }: FlipExportButtonProps) => {
  const exportToCSV = () => {
    if (result.trades.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    let csvContent = "STRUCTURE LAB - RESULTADOS DE SIMULACIÓN\n\n";
    
    // Configuración
    csvContent += "=== CONFIGURACIÓN ===\n";
    csvContent += `Tamaño de Cuenta,$${config.accountSize.toFixed(2)}\n`;
    csvContent += `Tamaño de Ciclo,${config.cycleSize} trades\n`;
    csvContent += `Riesgo por ${config.usePercentageRisk ? 'Trade' : 'Ciclo'},${config.usePercentageRisk ? config.riskPerCycle + '%' : '$' + config.riskPerCycle.toFixed(2)}\n`;
    csvContent += `Ratio R:R,1:${config.rrRatio}\n`;
    csvContent += `% Reinversión,${config.reinvestPercent}%\n\n`;

    // Resumen
    csvContent += "=== RESUMEN ===\n";
    csvContent += `Total Operaciones,${result.trades.length}\n`;
    csvContent += `Total TP,${result.totalTP}\n`;
    csvContent += `Total SL,${result.totalSL}\n`;
    csvContent += `Win Rate,${result.winRate.toFixed(2)}%\n\n`;

    csvContent += "=== ESTRATEGIA TRADICIONAL ===\n";
    csvContent += `Balance Final,$${result.finalBalanceTraditional.toFixed(2)}\n`;
    csvContent += `Profit Total,$${result.totalProfitTraditional.toFixed(2)}\n`;
    csvContent += `ROI,${result.roiTraditional.toFixed(2)}%\n\n`;

    csvContent += "=== ESTRATEGIA APALANCADA ===\n";
    csvContent += `Balance Final,$${result.finalBalanceLeveraged.toFixed(2)}\n`;
    csvContent += `Profit Total,$${result.totalProfitLeveraged.toFixed(2)}\n`;
    csvContent += `ROI,${result.roiLeveraged.toFixed(2)}%\n\n`;

    // Detalle de trades
    csvContent += "=== DETALLE DE OPERACIONES ===\n";
    csvContent += "Trade,Ciclo,Resultado,Riesgo Trad.,P&L Trad.,Balance Trad.,Riesgo Apal.,P&L Apal.,Balance Apal.\n";
    
    result.trades.forEach(trade => {
      csvContent += `${trade.tradeNumber},${trade.cycle},${trade.result},$${trade.riskTraditional.toFixed(2)},$${trade.pnlTraditional.toFixed(2)},$${trade.balanceTraditional.toFixed(2)},$${trade.riskLeveraged.toFixed(2)},$${trade.pnlLeveraged.toFixed(2)},$${trade.balanceLeveraged.toFixed(2)}\n`;
    });

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `structure-lab-simulacion-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Resultados exportados exitosamente");
  };

  return (
    <Button onClick={exportToCSV} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  );
};
