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
import { fetchAIAnalysis, buildOptimizationDataSummary } from "@/utils/aiAnalysis";
import { addAIAnalysisSection } from "@/utils/pdfAISection";

interface LevelAnalysis {
  level: number;
  label: string;
  tpsReach: number;
  tpsDontReach: number;
  totalTPs: number;
  totalSLs: number;
  reachPercent: number;
  avgOriginalRR: number;
  avgNewRR: number;
  originalWinRate: number;
  newWinRate: number;
  originalEV: number;
  newEV: number;
  evDelta: number;
  originalTotalR: number;
  newTotalR: number;
  totalRDelta: number;
  survivingTrades: { date: string; asset: string; entry_model: string; originalRR: number; newRR: number; rrIncrease: number; drawdown: number }[];
}

interface AllTrade {
  id: string;
  date: string;
  drawdown: number | null;
  result_type: string;
}

interface OptimizationReportProps {
  presetAnalysis: LevelAnalysis[];
  bestLevel: LevelAnalysis | null;
  baseRR: number;
  source: string;
  strategyName?: string;
  allTrades: AllTrade[];
  modelFilter?: string;
}

export const OptimizationReportGenerator = ({
  presetAnalysis,
  bestLevel,
  baseRR,
  source,
  strategyName,
  allTrades,
  modelFilter,
}: OptimizationReportProps) => {
  const generateReport = async () => {
    if (presetAnalysis.length === 0) {
      toast.error("No hay datos para generar el informe");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      const sourceName = source === "journal" ? "Journal (Trades Reales)" : `Backtesting: ${strategyName || "Estrategia"}`;
      const modelLabel = modelFilter && modelFilter !== "all" ? ` · Modelo: ${modelFilter}` : "";

      // Branded Header
      await addBrandedHeader(
        doc,
        "OPTIMIZACIÓN DE ENTRADA",
        "Análisis de Punto de Entrada Óptimo",
        `Fuente: ${sourceName}${modelLabel} · RR Base: 1:${baseRR} · ${new Date().toLocaleDateString("es-ES")}`
      );

      let y = 68;

      // --- Summary Stats ---
      y = addSectionTitle(doc, "Resumen General", y);
      y += 4;

      const first = presetAnalysis[0];
      const totalTrades = first.totalTPs + first.totalSLs;

      const statsData = [
        ["Total Trades (TP+SL)", totalTrades.toString()],
        ["TPs con Drawdown", first.totalTPs.toString()],
        ["SLs Totales", first.totalSLs.toString()],
        ["Win Rate Original", `${first.originalWinRate.toFixed(1)}%`],
        ["RR Base", `1:${baseRR}`],
        ["EV Original", first.originalEV.toFixed(3)],
        ["P&L Original", `${first.originalTotalR.toFixed(2)}R`],
      ];

      autoTable(doc, {
        startY: y,
        head: [["Métrica", "Valor"]],
        body: statsData,
        ...getBrandedTableStyles(),
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 80 },
          1: { halign: "center" },
        },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 12;

      // --- Recommendation ---
      if (bestLevel) {
        y = addSectionTitle(doc, "Recomendación", y);
        y += 4;

        doc.setFillColor(34, 197, 94);
        doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`[SI] Nivel Optimo: ${bestLevel.label}`, 20, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(
          `Mover la entrada al ${bestLevel.label} genera +${bestLevel.totalRDelta.toFixed(2)}R más en total.`,
          20,
          y + 15
        );
        doc.text(
          `RR: ${bestLevel.avgOriginalRR.toFixed(2)}R -> ${bestLevel.avgNewRR.toFixed(2)}R | WR: ${bestLevel.originalWinRate.toFixed(1)}% -> ${bestLevel.newWinRate.toFixed(1)}% | P&L: ${bestLevel.originalTotalR.toFixed(2)}R -> ${bestLevel.newTotalR.toFixed(2)}R`,
          20,
          y + 22
        );
        y += 36;
      } else {
        y = addSectionTitle(doc, "Recomendación", y);
        y += 4;
        doc.setFillColor(239, 68, 68);
        doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("[NO] Ningun nivel mejora el P&L total. Mantener entrada actual.", 20, y + 9);
        y += 22;
      }

      // --- Analysis Table ---
      y = addSectionTitle(doc, "Análisis por Nivel de Drawdown", y);
      y += 4;

      const analysisBody = presetAnalysis.map((a) => [
        a.label,
        `${a.tpsReach}/${a.totalTPs} (${a.reachPercent.toFixed(1)}%)`,
        `${a.originalWinRate.toFixed(1)}% -> ${a.newWinRate.toFixed(1)}%`,
        `${a.avgNewRR.toFixed(2)}R`,
        a.originalEV.toFixed(3),
        a.newEV.toFixed(3),
        `${a.totalRDelta > 0 ? "+" : ""}${a.totalRDelta.toFixed(2)}R`,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Nivel DD", "Supervivencia", "Win Rate", "RR Nuevo", "EV Orig.", "EV Nuevo", "Dif P&L (R)"]],
        body: analysisBody,
        ...getBrandedTableStyles(),
        columnStyles: {
          0: { fontStyle: "bold", halign: "center", cellWidth: 20 },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "center", textColor: brandColors.quantumBlue },
          4: { halign: "center" },
          5: { halign: "center" },
          6: { halign: "center", fontStyle: "bold" },
        },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 6) {
            const a = presetAnalysis[data.row.index];
            if (a) {
              data.cell.styles.textColor = a.totalRDelta > 0 ? brandColors.success : brandColors.danger;
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 12;

      // --- P&L Comparison per Level ---
      y = addSectionTitle(doc, "Comparativa P&L por Nivel", y);
      y += 4;

      const pnlBody = presetAnalysis.map((a) => [
        a.label,
        `${a.originalTotalR.toFixed(2)}R`,
        `${a.newTotalR.toFixed(2)}R`,
        `${a.totalRDelta > 0 ? "+" : ""}${a.totalRDelta.toFixed(2)}R`,
        a.totalRDelta > 0 ? "SI" : "NO",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Nivel", "P&L Original", "P&L Optimizado", "Diferencia", "¿Merece la pena?"]],
        body: pnlBody,
        ...getBrandedTableStyles(),
        columnStyles: {
          0: { fontStyle: "bold", halign: "center", cellWidth: 22 },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "center", fontStyle: "bold" },
          4: { halign: "center", fontStyle: "bold" },
        },
        didParseCell: (data: any) => {
          if (data.section === "body") {
            const a = presetAnalysis[data.row.index];
            if (a && (data.column.index === 3 || data.column.index === 4)) {
              data.cell.styles.textColor = a.totalRDelta > 0 ? brandColors.success : brandColors.danger;
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 12;

      // --- Surviving trades detail per level (new pages) ---
      for (const a of presetAnalysis) {
        if (a.survivingTrades.length === 0) continue;

        doc.addPage();
        let detailY = 20;

        detailY = addSectionTitle(doc, `Trades Supervivientes – Nivel ${a.label}`, detailY);
        detailY += 2;

        doc.setFontSize(8);
        doc.setTextColor(...brandColors.textMuted);
        doc.text(
          `${a.tpsReach} de ${a.totalTPs} TPs alcanzan el nivel ${a.label} | RR: ${a.avgOriginalRR.toFixed(2)} → ${a.avgNewRR.toFixed(2)} | Δ P&L: ${a.totalRDelta > 0 ? "+" : ""}${a.totalRDelta.toFixed(2)}R`,
          20,
          detailY + 4
        );
        detailY += 10;

        const tradeRows = a.survivingTrades.map((t) => [
          t.date,
          t.asset,
          t.entry_model,
          `${(t.drawdown * 100).toFixed(0)}%`,
          `${t.originalRR.toFixed(2)}R`,
          `${t.newRR.toFixed(2)}R`,
          `+${t.rrIncrease.toFixed(2)}R`,
        ]);

        autoTable(doc, {
          startY: detailY,
          head: [["Fecha", "Activo", "Modelo", "DD", "RR Original", "RR Nuevo", "Δ RR"]],
          body: tradeRows,
          ...getBrandedTableStyles(),
          columnStyles: {
            0: { cellWidth: 25 },
            3: { halign: "center" },
            4: { halign: "center" },
            5: { halign: "center", textColor: brandColors.quantumBlue },
            6: { halign: "center", textColor: brandColors.success, fontStyle: "bold" },
          },
          margin: { left: 14, right: 14 },
        });
      }

      // --- P&L Curve Data (new page) ---
      doc.addPage();
      let curveY = 20;
      curveY = addSectionTitle(doc, "Evolución P&L Trade a Trade", curveY);
      curveY += 2;

      doc.setFontSize(8);
      doc.setTextColor(...brandColors.textMuted);
      doc.text("Datos de la curva de P&L acumulada (Original vs cada nivel optimizado)", 20, curveY + 4);
      curveY += 10;

      // Build cumulative P&L for each level
      const filtered = allTrades
        .filter(t => t.result_type === "SL" || (t.result_type === "TP" && t.drawdown !== null))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Summary table: milestone P&L at every 10th trade
      const milestoneRows: string[][] = [];
      const cumulatives: Record<string, number> = { original: 0 };
      presetAnalysis.forEach(a => { cumulatives[a.label] = 0; });

      filtered.forEach((trade, i) => {
        if (trade.result_type === "SL") {
          cumulatives["original"] -= 1;
          presetAnalysis.forEach(a => { cumulatives[a.label] -= 1; });
        } else if (trade.result_type === "TP") {
          cumulatives["original"] += baseRR;
          presetAnalysis.forEach(a => {
            const newRR = (baseRR + a.level) / (1 - a.level);
            if (trade.drawdown !== null && trade.drawdown >= a.level) {
              cumulatives[a.label] += newRR;
            }
          });
        }

        // Every 10 trades or last trade
        if ((i + 1) % 10 === 0 || i === filtered.length - 1) {
          milestoneRows.push([
            `#${i + 1}`,
            trade.date,
            `${cumulatives["original"].toFixed(2)}R`,
            ...presetAnalysis.map(a => `${cumulatives[a.label].toFixed(2)}R`),
          ]);
        }
      });

      autoTable(doc, {
        startY: curveY,
        head: [["Trade", "Fecha", "Original", ...presetAnalysis.map(a => a.label)]],
        body: milestoneRows,
        ...getBrandedTableStyles(),
        columnStyles: {
          0: { halign: "center", cellWidth: 16 },
          1: { cellWidth: 24 },
          2: { halign: "center", fontStyle: "bold" },
        },
        margin: { left: 14, right: 14 },
      });

      // --- Methodology explanation (last page) ---
      doc.addPage();
      let methY = 20;
      methY = addSectionTitle(doc, "Metodología", methY);
      methY += 6;

      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const methodology = [
        "• Drawdown: porcentaje del recorrido hacia el SL que realiza el precio antes de ir al TP.",
        "• Supervivencia: TPs cuyo drawdown ≥ nivel analizado. Si mueves la entrada ahí, estos trades seguirían siendo TP.",
        "• Los SL se mantienen iguales en todos los escenarios. Solo disminuyen los TPs que no alcanzan el nivel.",
        `• RR Nuevo = (RR Base + Nivel) / (1 - Nivel). Con RR base ${baseRR}: nivel 33% → RR ${((baseRR + 0.33) / 0.67).toFixed(2)}, nivel 50% → RR ${((baseRR + 0.50) / 0.50).toFixed(2)}.`,
        "• Win Rate = TPs supervivientes / (TPs supervivientes + SLs totales).",
        "• EV (Expected Value) = (WR × RR) − (1 − WR). Métrica por trade individual.",
        "• Δ P&L (R) = P&L total optimizado − P&L total original. Métrica acumulada sobre todo el historial.",
        "• La recomendación se basa en el Δ P&L total, no en el EV por trade, para reflejar el impacto real.",
      ];

      methodology.forEach((line) => {
        doc.text(line, 20, methY);
        methY += 6;
      });

      // AI Analysis Section
      toast.info("Generando análisis con IA...");
      const optDataSummary = buildOptimizationDataSummary({
        source: source === "journal" ? "Journal (Trades Reales)" : `Backtesting: ${strategyName || "Estrategia"}`,
        strategyName,
        baseRR,
        totalTrades,
        totalTPs: first.totalTPs,
        totalSLs: first.totalSLs,
        originalWinRate: first.originalWinRate,
        originalEV: first.originalEV,
        originalTotalR: first.originalTotalR,
        bestLevel: bestLevel ? {
          label: bestLevel.label,
          newWinRate: bestLevel.newWinRate,
          avgNewRR: bestLevel.avgNewRR,
          newTotalR: bestLevel.newTotalR,
          totalRDelta: bestLevel.totalRDelta,
        } : null,
        levels: presetAnalysis.map(a => ({
          label: a.label,
          reachPercent: a.reachPercent,
          newWinRate: a.newWinRate,
          avgNewRR: a.avgNewRR,
          newEV: a.newEV,
          totalRDelta: a.totalRDelta,
        })),
      });

      const aiResult = await fetchAIAnalysis("optimization", optDataSummary);
      if (aiResult.analysis) {
        doc.addPage();
        addAIAnalysisSection(doc, aiResult.analysis, 20);
      }

      // Branded footer on all pages
      addBrandedFooter(doc);

      // Save
      const date = new Date().toISOString().split("T")[0];
      doc.save(`quantum-optimization-report-${date}.pdf`);
      toast.success("Informe de optimización descargado");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Error al generar el informe");
    }
  };

  return (
    <Button onClick={generateReport} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Descargar PDF
    </Button>
  );
};
