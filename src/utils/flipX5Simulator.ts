export interface FlipConfig {
  accountSize: number;
  cycleSize: number;
  riskPerCycle: number;
  rrRatio: number;
  reinvestPercent: number;
  usePercentageRisk?: boolean; // Si es true, usa riskPerCycle como % del balance actual
}

export type TradeResult = 'TP' | 'SL';

export interface TradeRow {
  tradeNumber: number;
  cycle: number;
  result: TradeResult;
  riskTraditional: number;
  pnlTraditional: number;
  balanceTraditional: number;
  riskLeveraged: number;
  pnlLeveraged: number;
  balanceLeveraged: number;
}

export interface SimulationResult {
  trades: TradeRow[];
  finalBalanceTraditional: number;
  finalBalanceLeveraged: number;
  totalProfitTraditional: number;
  totalProfitLeveraged: number;
  roiTraditional: number;
  roiLeveraged: number;
  totalTP: number;
  totalSL: number;
  winRate: number;
}

export const simulateFlipX5 = (
  config: FlipConfig,
  tradeResults: TradeResult[],
  actualAmounts?: number[]
): SimulationResult => {
  const { accountSize, cycleSize, riskPerCycle, rrRatio, reinvestPercent, usePercentageRisk = false } = config;

  let balanceTraditional = accountSize;
  let balanceLeveraged = accountSize;

  const trades: TradeRow[] = [];

  let currentCycle = 1;
  let tradesInCycle = 0;
  let previousTradeProfit = 0;
  let previousTradeResult: TradeResult | null = null;

  tradeResults.forEach((result, index) => {
    const tradeNumber = index + 1;

    // Traditional calculation
    const riskTraditional = usePercentageRisk
      ? (balanceTraditional * riskPerCycle) / 100
      : riskPerCycle / cycleSize;

    const pnlTraditional = result === "TP" ? riskTraditional * rrRatio : -riskTraditional;
    balanceTraditional += pnlTraditional;

    // Leveraged calculation
    let riskLeveraged = usePercentageRisk
      ? (balanceLeveraged * riskPerCycle) / 100
      : riskPerCycle / cycleSize;

    if (tradesInCycle > 0 && previousTradeResult === "TP" && previousTradeProfit > 0) {
      const reinvestAmount = (previousTradeProfit * reinvestPercent) / 100;
      riskLeveraged += reinvestAmount;
    }

    const pnlLeveraged = result === "TP" ? riskLeveraged * rrRatio : -riskLeveraged;
    balanceLeveraged += pnlLeveraged;

    trades.push({
      tradeNumber,
      cycle: currentCycle,
      result,
      riskTraditional,
      pnlTraditional,
      balanceTraditional,
      riskLeveraged,
      pnlLeveraged,
      balanceLeveraged,
    });

    previousTradeResult = result;
    previousTradeProfit = pnlLeveraged;
    tradesInCycle++;

    // Regla de ciclo:
    // 1) termina al completar el tamaño de ciclo
    // 2) termina inmediatamente si hay SL
    const endBySize = tradesInCycle >= cycleSize;
    const endBySL = result === "SL";

    if (endBySize || endBySL) {
      currentCycle++;
      tradesInCycle = 0;
      previousTradeProfit = 0;
      previousTradeResult = null;
    }
  });

  const totalTP = tradeResults.filter((r) => r === "TP").length;
  const totalSL = tradeResults.filter((r) => r === "SL").length;
  const winRate = tradeResults.length > 0 ? (totalTP / tradeResults.length) * 100 : 0;

  return {
    trades,
    finalBalanceTraditional: balanceTraditional,
    finalBalanceLeveraged: balanceLeveraged,
    totalProfitTraditional: balanceTraditional - accountSize,
    totalProfitLeveraged: balanceLeveraged - accountSize,
    roiTraditional: ((balanceTraditional - accountSize) / accountSize) * 100,
    roiLeveraged: ((balanceLeveraged - accountSize) / accountSize) * 100,
    totalTP,
    totalSL,
    winRate,
  };
};
