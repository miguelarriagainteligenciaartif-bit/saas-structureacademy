import { supabase } from "@/integrations/supabase/client";

export interface AIAnalysisResult {
  analysis: string;
  error?: string;
}

export const fetchAIAnalysis = async (
  reportType: "journal" | "backtest" | "optimization",
  tradingData: string
): Promise<AIAnalysisResult> => {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-trading", {
      body: { reportType, tradingData },
    });

    if (error) {
      console.error("AI analysis error:", error);
      return { analysis: "", error: "No se pudo obtener el análisis IA." };
    }

    if (data?.error) {
      return { analysis: "", error: data.error };
    }

    return { analysis: data?.analysis || "" };
  } catch (e) {
    console.error("AI analysis fetch error:", e);
    return { analysis: "", error: "Error de conexión con el servicio de análisis IA." };
  }
};

export const buildJournalDataSummary = (stats: {
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  expectedValue: number;
  avgWin: number;
  avgLoss: number;
  bestTPStreak: number;
  worstSLStreak: number;
  modelStats: { model: string; trades: number; pnl: number; winRate: number }[];
  dayStats: { day: string; trades: number; pnl: number; winRate: number }[];
  continuationSubtypeStats?: { subtype: string; trades: number; pnl: number; winRate: number }[];
}): string => {
  let summary = `ESTADISTICAS GENERALES:
- Total operaciones: ${stats.totalTrades}
- P&L Total: $${stats.totalPnL.toFixed(2)}
- Win Rate: ${stats.winRate.toFixed(1)}%
- Expected Value: $${stats.expectedValue.toFixed(2)}
- Ganancia promedio: $${stats.avgWin.toFixed(2)}
- Perdida promedio: $${stats.avgLoss.toFixed(2)}
- Mejor racha TP: ${stats.bestTPStreak}
- Peor racha SL: ${stats.worstSLStreak}

ANALISIS POR MODELO DE ENTRADA:`;

  stats.modelStats.forEach((m) => {
    if (m.trades > 0) {
      summary += `\n- ${m.model}: ${m.trades} trades, P&L $${m.pnl.toFixed(2)}, WR ${m.winRate.toFixed(1)}%`;
    }
  });

  if (stats.continuationSubtypeStats && stats.continuationSubtypeStats.length > 0) {
    summary += `\n\nDESGLOSE DEL MODELO CONTINUACION (subtipos):`;
    stats.continuationSubtypeStats.forEach((s) => {
      if (s.trades > 0) {
        summary += `\n- Continuacion ${s.subtype}: ${s.trades} trades, P&L $${s.pnl.toFixed(2)}, WR ${s.winRate.toFixed(1)}%`;
      }
    });
    summary += `\nIMPORTANTE: Analiza y compara el rendimiento de Bloque vs FVG dentro del modelo Continuacion. Indica cual subtipo es mas rentable y por que.`;
  }

  summary += `\n\nANALISIS POR DIA:`;
  stats.dayStats.forEach((d) => {
    if (d.trades > 0) {
      summary += `\n- ${d.day}: ${d.trades} trades, P&L $${d.pnl.toFixed(2)}, WR ${d.winRate.toFixed(1)}%`;
    }
  });

  return summary;
};

export const buildBacktestDataSummary = (stats: {
  strategyName: string;
  rrRatio: string;
  initialCapital: number;
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  expectedValue: number;
  avgWin: number;
  avgLoss: number;
  bestTPStreak: number;
  worstSLStreak: number;
  modelStats: { model: string; trades: number; pnl: number; winRate: number }[];
  dayStats: { day: string; trades: number; pnl: number; winRate: number }[];
}): string => {
  let summary = `ESTRATEGIA: ${stats.strategyName}
R:R: ${stats.rrRatio}
Capital Inicial: $${stats.initialCapital.toFixed(2)}

ESTADÍSTICAS GENERALES:
- Total operaciones: ${stats.totalTrades}
- P&L Total: $${stats.totalPnL.toFixed(2)}
- Win Rate: ${stats.winRate.toFixed(1)}%
- Expected Value: $${stats.expectedValue.toFixed(2)}
- Ganancia promedio: $${stats.avgWin.toFixed(2)}
- Pérdida promedio: $${stats.avgLoss.toFixed(2)}
- Mejor racha TP: ${stats.bestTPStreak}
- Peor racha SL: ${stats.worstSLStreak}

ANÁLISIS POR MODELO DE ENTRADA:`;

  stats.modelStats.forEach((m) => {
    if (m.trades > 0) {
      summary += `\n- ${m.model}: ${m.trades} trades, P&L $${m.pnl.toFixed(2)}, WR ${m.winRate.toFixed(1)}%`;
    }
  });

  summary += `\n\nANÁLISIS POR DÍA:`;
  stats.dayStats.forEach((d) => {
    if (d.trades > 0) {
      summary += `\n- ${d.day}: ${d.trades} trades, P&L $${d.pnl.toFixed(2)}, WR ${d.winRate.toFixed(1)}%`;
    }
  });

  return summary;
};

export const buildOptimizationDataSummary = (stats: {
  source: string;
  strategyName?: string;
  baseRR: number;
  totalTrades: number;
  totalTPs: number;
  totalSLs: number;
  originalWinRate: number;
  originalEV: number;
  originalTotalR: number;
  bestLevel: { label: string; newWinRate: number; avgNewRR: number; newTotalR: number; totalRDelta: number } | null;
  levels: { label: string; reachPercent: number; newWinRate: number; avgNewRR: number; newEV: number; totalRDelta: number }[];
}): string => {
  let summary = `FUENTE: ${stats.source}${stats.strategyName ? ` (${stats.strategyName})` : ""}
RR Base: 1:${stats.baseRR}

ESTADÍSTICAS GENERALES:
- Total trades analizados: ${stats.totalTrades}
- TPs con drawdown: ${stats.totalTPs}
- SLs totales: ${stats.totalSLs}
- Win Rate original: ${stats.originalWinRate.toFixed(1)}%
- EV original: ${stats.originalEV.toFixed(3)}
- P&L original: ${stats.originalTotalR.toFixed(2)}R

NIVEL ÓPTIMO RECOMENDADO: ${stats.bestLevel ? `${stats.bestLevel.label} (Δ P&L: +${stats.bestLevel.totalRDelta.toFixed(2)}R)` : "Ninguno mejora el P&L"}

ANÁLISIS POR NIVEL:`;

  stats.levels.forEach((l) => {
    summary += `\n- ${l.label}: Supervivencia ${l.reachPercent.toFixed(1)}%, WR ${l.newWinRate.toFixed(1)}%, RR ${l.avgNewRR.toFixed(2)}, EV ${l.newEV.toFixed(3)}, Δ P&L ${l.totalRDelta > 0 ? "+" : ""}${l.totalRDelta.toFixed(2)}R`;
  });

  return summary;
};
