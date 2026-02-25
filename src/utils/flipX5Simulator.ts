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
  const useActualAmounts = actualAmounts && actualAmounts.length === tradeResults.length;
  
  let balanceTraditional = accountSize;
  let balanceLeveraged = accountSize;
  
  const trades: TradeRow[] = [];
  const cycleData: { [key: number]: { tpCount: number; slCount: number; profit: number } } = {};
  
  let currentCycle = 1;
  let tradesInCycle = 0;
  let previousTradeProfit = 0;
  let previousTradeResult: TradeResult | null = null;
  
  tradeResults.forEach((result, index) => {
    const tradeNumber = index + 1;
    
    if (!cycleData[currentCycle]) {
      cycleData[currentCycle] = { tpCount: 0, slCount: 0, profit: 0 };
    }
    
    // Traditional calculation
    let riskTraditional: number;
    let pnlTraditional: number;
    
    if (useActualAmounts) {
      pnlTraditional = actualAmounts[index];
      riskTraditional = Math.abs(pnlTraditional);
    } else if (usePercentageRisk) {
      riskTraditional = (balanceTraditional * riskPerCycle) / 100;
      pnlTraditional = result === 'TP' ? riskTraditional * rrRatio : -riskTraditional;
    } else {
      riskTraditional = riskPerCycle / cycleSize;
      pnlTraditional = result === 'TP' ? riskTraditional * rrRatio : -riskTraditional;
    }
    
    balanceTraditional += pnlTraditional;
    
    // Leveraged calculation - aplica ciclos con reinversión
    let riskLeveraged: number;
    let pnlLeveraged: number;
    
    if (useActualAmounts) {
      // Con montos reales: usamos el monto real como base
      const actualPnl = actualAmounts[index];
      const baseRisk = Math.abs(actualPnl);
      
      // Si es el segundo+ trade del ciclo Y el anterior fue TP, aplicar reinversión
      if (tradesInCycle > 0 && previousTradeResult === 'TP' && previousTradeProfit > 0) {
        const reinvestAmount = (previousTradeProfit * reinvestPercent) / 100;
        riskLeveraged = baseRisk + reinvestAmount;
        // El PnL apalancado escala proporcionalmente
        if (result === 'TP') {
          pnlLeveraged = actualPnl + (reinvestAmount * rrRatio);
        } else {
          pnlLeveraged = actualPnl - reinvestAmount;
        }
      } else {
        // Primer trade del ciclo o anterior fue SL: sin reinversión
        riskLeveraged = baseRisk;
        pnlLeveraged = actualPnl;
      }
    } else if (usePercentageRisk) {
      riskLeveraged = (balanceLeveraged * riskPerCycle) / 100;
      
      if (tradesInCycle > 0 && previousTradeResult === 'TP' && previousTradeProfit > 0) {
        const reinvestAmount = (previousTradeProfit * reinvestPercent) / 100;
        riskLeveraged = (balanceLeveraged * riskPerCycle) / 100 + reinvestAmount;
      }
      pnlLeveraged = result === 'TP' ? riskLeveraged * rrRatio : -riskLeveraged;
    } else {
      riskLeveraged = riskPerCycle / cycleSize;
      
      if (tradesInCycle > 0 && previousTradeResult === 'TP' && previousTradeProfit > 0) {
        const reinvestAmount = (previousTradeProfit * reinvestPercent) / 100;
        riskLeveraged = (riskPerCycle / cycleSize) + reinvestAmount;
      }
      pnlLeveraged = result === 'TP' ? riskLeveraged * rrRatio : -riskLeveraged;
    }
    balanceLeveraged += pnlLeveraged;
    
    if (result === 'TP') {
      cycleData[currentCycle].tpCount++;
    } else {
      cycleData[currentCycle].slCount++;
    }
    cycleData[currentCycle].profit += pnlLeveraged;
    
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
    
    // Guardar el resultado y profit del trade actual para el siguiente
    previousTradeResult = result;
    previousTradeProfit = pnlLeveraged;
    
    tradesInCycle++;
    if (tradesInCycle >= cycleSize) {
      currentCycle++;
      tradesInCycle = 0;
      previousTradeProfit = 0;
      previousTradeResult = null;
    }
  });
  
  const totalTP = tradeResults.filter(r => r === 'TP').length;
  const totalSL = tradeResults.filter(r => r === 'SL').length;
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
