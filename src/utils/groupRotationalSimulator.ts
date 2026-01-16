// Types for Group-based Rotational Simulator

export type BrokerType = 'cfd' | 'futures';

export interface AccountConfig {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  profitTarget: number; // % de profit para retiro
  withdrawals: Withdrawal[];
  tradesSinceLastWithdrawal: number; // Contador de trades desde último retiro (para Apex)
  tradesInCurrentMonth: number; // Contador de trades en el mes actual (para FTMO)
}

export interface Withdrawal {
  date: Date;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
}

export interface GroupConfig {
  id: string;
  name: string;
  brokerType: BrokerType;
  brokerName: string; // e.g., "FTMO", "Apex"
  accounts: AccountConfig[];
  // Risk per trade in dollars (same for all accounts in this group)
  riskPerTrade: number; // e.g., 375 for Futures, 800 for CFD
  // Futures specific - simple withdrawal rules
  withdrawalThreshold?: number; // Balance to reach before withdrawing (e.g., 54100 for Apex 50K)
  withdrawalAmount?: number; // Amount to withdraw when threshold is reached (e.g., 2000)
}

export interface GroupRotationalConfig {
  groups: GroupConfig[];
  riskRewardRatio: number;
  profitTargetPercent: number; // % objetivo para retiro
}

export interface GroupTradeEffect {
  groupId: string;
  groupName: string;
  brokerType: BrokerType;
  riskAmount: number;
  profitLoss: number;
  accountsAffected: {
    accountId: string;
    accountName: string;
    balanceBefore: number;
    balanceAfter: number;
  }[];
}

export interface GroupTrade {
  tradeNumber: number; // Número único de la operación (1 trade = 1 día)
  result: 'TP' | 'SL';
  effects: GroupTradeEffect[]; // Efectos en cada grupo (CFD + Futuros)
  totalProfitLoss: number;
  timestamp: Date;
}

export interface ProjectedWithdrawal {
  groupId: string;
  groupName: string;
  accountId: string;
  accountName: string;
  projectedDate: Date;
  projectedTradeNumber: number;
  withdrawalAmount: number;
  balanceAfterWithdrawal: number;
}

export interface GroupRotationalState {
  config: GroupRotationalConfig;
  groups: GroupConfig[];
  currentTurnByBroker: { [brokerType: string]: number }; // Índice del grupo actual por tipo de broker
  trades: GroupTrade[];
  totalTP: number;
  totalSL: number;
  winRate: number;
  projectedWithdrawals: ProjectedWithdrawal[];
  totalWithdrawn: number;
}

// Crear ID único
const generateId = () => Math.random().toString(36).substr(2, 9);

// Inicializar estado
export const initializeGroupState = (config: GroupRotationalConfig): GroupRotationalState => {
  const currentTurnByBroker: { [key: string]: number } = {};
  
  // Inicializar turno para cada tipo de broker
  config.groups.forEach(group => {
    if (!(group.brokerType in currentTurnByBroker)) {
      currentTurnByBroker[group.brokerType] = 0;
    }
  });

  return {
    config,
    groups: config.groups.map(g => ({
      ...g,
      accounts: g.accounts.map(a => ({
        ...a,
        currentBalance: a.initialBalance,
        withdrawals: [],
        tradesSinceLastWithdrawal: 0, // Empieza en 0, necesita 8 trades antes de poder retirar
        tradesInCurrentMonth: 0, // Contador para FTMO - retiro al final del mes
      })),
    })),
    currentTurnByBroker,
    trades: [],
    totalTP: 0,
    totalSL: 0,
    winRate: 0,
    projectedWithdrawals: [],
    totalWithdrawn: 0,
  };
};

// Calculate risk amount based on group's fixed risk (same for all accounts in group)
const calculateRiskAmount = (group: GroupConfig): number => {
  return group.riskPerTrade;
};

// Mínimo de trades requeridos en Apex antes de poder retirar
const MIN_TRADES_FOR_APEX_WITHDRAWAL = 8;

// Trades por mes (aproximado - días de trading en un mes)
const TRADES_PER_MONTH = 20;

// Procesar retiro según tipo de broker
const processWithdrawal = (
  account: AccountConfig,
  group: GroupConfig
): { newBalance: number; withdrawalAmount: number; canWithdraw: boolean } => {
  const profit = account.currentBalance - account.initialBalance;
  
  if (group.brokerType === 'cfd') {
    // CFD: Retira todo el profit, balance vuelve al inicial
    return {
      newBalance: account.initialBalance,
      withdrawalAmount: profit,
      canWithdraw: true,
    };
  } else {
    // Futuros (Apex): Necesita mínimo 8 trades antes de poder retirar
    if (account.tradesSinceLastWithdrawal < MIN_TRADES_FOR_APEX_WITHDRAWAL) {
      return { newBalance: account.currentBalance, withdrawalAmount: 0, canWithdraw: false };
    }
    
    // Futuros: Retiro simple - cuando llega al umbral y tiene 8+ trades, retira cantidad fija
    const threshold = group.withdrawalThreshold || (account.initialBalance + 4100); // Default: initial + 4100
    const withdrawAmount = group.withdrawalAmount || 2000; // Default: $2000
    
    if (account.currentBalance >= threshold) {
      return {
        newBalance: account.currentBalance - withdrawAmount,
        withdrawalAmount: withdrawAmount,
        canWithdraw: true,
      };
    }
    return { newBalance: account.currentBalance, withdrawalAmount: 0, canWithdraw: false };
  }
};

// Verificar si cuenta alcanzó objetivo de retiro
const checkWithdrawalTarget = (
  account: AccountConfig,
  profitTargetPercent: number
): boolean => {
  const profitPercent = ((account.currentBalance - account.initialBalance) / account.initialBalance) * 100;
  return profitPercent >= profitTargetPercent;
};

// Procesar un trade UNIFICADO (aplica a todos los grupos activos - CFD + Futuros)
export const processUnifiedTrade = (
  state: GroupRotationalState,
  result: 'TP' | 'SL'
): GroupRotationalState => {
  const effects: GroupTradeEffect[] = [];
  let newGroups = [...state.groups];
  const newCurrentTurnByBroker = { ...state.currentTurnByBroker };
  
  // Process each broker type
  const brokerTypes: BrokerType[] = ['cfd', 'futures'];
  
  for (const brokerType of brokerTypes) {
    const groupsOfType = state.groups.filter(g => g.brokerType === brokerType);
    if (groupsOfType.length === 0) continue;
    
    const currentIndex = state.currentTurnByBroker[brokerType] || 0;
    const groupIndex = state.groups.findIndex(g => g.id === groupsOfType[currentIndex % groupsOfType.length].id);
    const group = state.groups[groupIndex];
    
    // Risk is fixed per group
    const baseRisk = calculateRiskAmount(group);
    const singleAccountPL = result === 'TP' 
      ? baseRisk * state.config.riskRewardRatio 
      : -baseRisk;
    
    // Apply result to all accounts in the group
    const accountsAffected = group.accounts.map(account => {
      return {
        accountId: account.id,
        accountName: account.name,
        balanceBefore: account.currentBalance,
        balanceAfter: account.currentBalance + singleAccountPL,
      };
    });
    
    // Total P/L for the group = P/L per account * number of accounts
    const groupTotalProfitLoss = singleAccountPL * group.accounts.length;
    
    // Add effect for this group
    effects.push({
      groupId: group.id,
      groupName: group.name,
      brokerType: group.brokerType,
      riskAmount: baseRisk,
      profitLoss: groupTotalProfitLoss, // Now correctly sums all accounts
      accountsAffected,
    });
    
    // Update account balances for this group
    newGroups = newGroups.map((g, idx) => {
      if (idx !== groupIndex) return g;
      
      return {
        ...g,
        accounts: g.accounts.map(account => {
          const affected = accountsAffected.find(a => a.accountId === account.id);
          if (!affected) return account;
          
          let newAccount = {
            ...account,
            currentBalance: affected.balanceAfter,
            // Incrementar contador de trades (para Apex)
            tradesSinceLastWithdrawal: (account.tradesSinceLastWithdrawal || 0) + 1,
            // Incrementar contador de trades del mes actual (para FTMO)
            tradesInCurrentMonth: (account.tradesInCurrentMonth || 0) + 1,
          };
          
          // Apply withdrawals rules
          if (g.brokerType === 'cfd') {
            // CFD (FTMO): Retira al final de cada mes (cada 20 trades por cuenta)
            const isEndOfMonth = newAccount.tradesInCurrentMonth >= TRADES_PER_MONTH;
            const profit = newAccount.currentBalance - newAccount.initialBalance;
            
            if (isEndOfMonth && profit > 0) {
              const { newBalance, withdrawalAmount } = processWithdrawal(newAccount, g);
              if (withdrawalAmount > 0) {
                newAccount = {
                  ...newAccount,
                  currentBalance: newBalance,
                  tradesInCurrentMonth: 0, // Reset contador del mes
                  withdrawals: [
                    ...newAccount.withdrawals,
                    {
                      date: new Date(),
                      amount: withdrawalAmount,
                      balanceBefore: affected.balanceAfter,
                      balanceAfter: newBalance,
                    },
                  ],
                };
              }
            } else if (isEndOfMonth) {
              // Si es fin de mes pero no hay profit, igual reseteamos el contador
              newAccount = {
                ...newAccount,
                tradesInCurrentMonth: 0,
              };
            }
          } else {
            // Futures (Apex): withdrawal depends on threshold AND minimum 8 trades
            const { newBalance, withdrawalAmount } = processWithdrawal(newAccount, g);
            if (withdrawalAmount > 0) {
              newAccount = {
                ...newAccount,
                currentBalance: newBalance,
                tradesSinceLastWithdrawal: 0, // Reset contador después de retiro
                withdrawals: [
                  ...newAccount.withdrawals,
                  {
                    date: new Date(),
                    amount: withdrawalAmount,
                    balanceBefore: affected.balanceAfter,
                    balanceAfter: newBalance,
                  },
                ],
              };
            }
          }
          
          return newAccount;
        }),
      };
    });
    
    // Update turn for this broker type
    newCurrentTurnByBroker[brokerType] = (currentIndex + 1) % groupsOfType.length;
  }
  
  // Calculate total P&L for this trade
  const totalProfitLoss = effects.reduce((sum, e) => sum + e.profitLoss, 0);
  
  // Create unified trade record
  const newTrade: GroupTrade = {
    tradeNumber: state.trades.length + 1,
    result,
    effects,
    totalProfitLoss,
    timestamp: new Date(),
  };
  
  // Calculate stats
  const totalTP = result === 'TP' ? state.totalTP + 1 : state.totalTP;
  const totalSL = result === 'SL' ? state.totalSL + 1 : state.totalSL;
  const totalTrades = totalTP + totalSL;
  const winRate = totalTrades > 0 ? (totalTP / totalTrades) * 100 : 0;
  
  // Calculate total withdrawn
  const totalWithdrawn = newGroups.reduce((sum, g) => 
    sum + g.accounts.reduce((accSum, acc) => 
      accSum + acc.withdrawals.reduce((wSum, w) => wSum + w.amount, 0), 0), 0);
  
  return {
    ...state,
    groups: newGroups,
    currentTurnByBroker: newCurrentTurnByBroker,
    trades: [...state.trades, newTrade],
    totalTP,
    totalSL,
    winRate,
    totalWithdrawn,
  };
};

// Legacy function - now calls unified trade (kept for compatibility)
export const processGroupTrade = (
  state: GroupRotationalState,
  _brokerType: BrokerType,
  result: 'TP' | 'SL'
): GroupRotationalState => {
  // Only process once per trade - ignore broker type since we process all together
  return processUnifiedTrade(state, result);
};

// Deshacer último trade (unified - reverts all effects)
export const undoGroupTrade = (state: GroupRotationalState): GroupRotationalState => {
  if (state.trades.length === 0) return state;

  const lastTrade = state.trades[state.trades.length - 1];
  const newCurrentTurnByBroker = { ...state.currentTurnByBroker };
  
  // Restore balances for all affected groups
  let newGroups = [...state.groups];
  
  for (const effect of lastTrade.effects) {
    const groupIndex = state.groups.findIndex(g => g.id === effect.groupId);
    if (groupIndex === -1) continue;
    
    newGroups = newGroups.map((g, idx) => {
      if (idx !== groupIndex) return g;
      
      return {
        ...g,
        accounts: g.accounts.map(account => {
          const affected = effect.accountsAffected.find(a => a.accountId === account.id);
          if (!affected) return account;
          
          // Also revert any withdrawal that was made
          const lastWithdrawal = account.withdrawals[account.withdrawals.length - 1];
          if (lastWithdrawal && lastWithdrawal.balanceBefore === affected.balanceAfter) {
            return {
              ...account,
              currentBalance: affected.balanceBefore,
              withdrawals: account.withdrawals.slice(0, -1),
            };
          }
          
          return {
            ...account,
            currentBalance: affected.balanceBefore,
          };
        }),
      };
    });
    
    // Revert turn for this broker type
    const brokerType = effect.brokerType;
    const groupsOfType = state.groups.filter(g => g.brokerType === brokerType);
    const currentIndex = state.currentTurnByBroker[brokerType] || 0;
    const newIndex = currentIndex === 0 ? groupsOfType.length - 1 : currentIndex - 1;
    newCurrentTurnByBroker[brokerType] = newIndex;
  }

  // Recalculate stats
  const totalTP = lastTrade.result === 'TP' ? state.totalTP - 1 : state.totalTP;
  const totalSL = lastTrade.result === 'SL' ? state.totalSL - 1 : state.totalSL;
  const totalTrades = totalTP + totalSL;
  const winRate = totalTrades > 0 ? (totalTP / totalTrades) * 100 : 0;

  const totalWithdrawn = newGroups.reduce((sum, g) => 
    sum + g.accounts.reduce((accSum, acc) => 
      accSum + acc.withdrawals.reduce((wSum, w) => wSum + w.amount, 0), 0), 0);

  return {
    ...state,
    groups: newGroups,
    currentTurnByBroker: newCurrentTurnByBroker,
    trades: state.trades.slice(0, -1),
    totalTP,
    totalSL,
    winRate,
    totalWithdrawn,
  };
};

// Proyectar retiros futuros basado en winrate esperado
export const projectWithdrawals = (
  state: GroupRotationalState,
  expectedWinRate: number,
  tradesToProject: number
): ProjectedWithdrawal[] => {
  const projections: ProjectedWithdrawal[] = [];
  let simulatedState = { ...state, groups: state.groups.map(g => ({ ...g, accounts: g.accounts.map(a => ({ ...a, withdrawals: [...a.withdrawals] })) })) };

  for (let i = 0; i < tradesToProject; i++) {
    const result = Math.random() * 100 < expectedWinRate ? 'TP' : 'SL';
    
    // Save balances before for all groups
    const balancesBefore: { groupId: string; accounts: { id: string; balance: number; withdrawalsCount: number }[] }[] = 
      simulatedState.groups.map(g => ({
        groupId: g.id,
        accounts: g.accounts.map(a => ({ id: a.id, balance: a.currentBalance, withdrawalsCount: a.withdrawals.length }))
      }));
    
    // Process unified trade
    simulatedState = processUnifiedTrade(simulatedState, result);
    
    // Check for new withdrawals in any group
    simulatedState.groups.forEach((group) => {
      const beforeGroup = balancesBefore.find(b => b.groupId === group.id);
      if (!beforeGroup) return;
      
      group.accounts.forEach((account) => {
        const beforeAccount = beforeGroup.accounts.find(a => a.id === account.id);
        if (beforeAccount && account.withdrawals.length > beforeAccount.withdrawalsCount) {
          const lastWithdrawal = account.withdrawals[account.withdrawals.length - 1];
          projections.push({
            groupId: group.id,
            groupName: group.name,
            accountId: account.id,
            accountName: account.name,
            projectedDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
            projectedTradeNumber: state.trades.length + i + 1,
            withdrawalAmount: lastWithdrawal.amount,
            balanceAfterWithdrawal: lastWithdrawal.balanceAfter,
          });
        }
      });
    });
  }

  return projections;
};

// Helper para crear configuración inicial vacía (ratio 1:2 fijo)
export const createDefaultConfig = (): GroupRotationalConfig => {
  return {
    groups: [],
    riskRewardRatio: 2, // Fijo en 1:2 según la estrategia
    profitTargetPercent: 10,
  };
};

// Obtener resumen por broker
export const getBrokerSummary = (state: GroupRotationalState) => {
  const summary: { [key: string]: { 
    totalBalance: number; 
    totalInitial: number; 
    totalWithdrawn: number;
    groups: number;
    accounts: number;
  }} = {};

  state.groups.forEach(group => {
    if (!summary[group.brokerName]) {
      summary[group.brokerName] = {
        totalBalance: 0,
        totalInitial: 0,
        totalWithdrawn: 0,
        groups: 0,
        accounts: 0,
      };
    }
    
    summary[group.brokerName].groups += 1;
    summary[group.brokerName].accounts += group.accounts.length;
    
    group.accounts.forEach(account => {
      summary[group.brokerName].totalBalance += account.currentBalance;
      summary[group.brokerName].totalInitial += account.initialBalance;
      summary[group.brokerName].totalWithdrawn += account.withdrawals.reduce((sum, w) => sum + w.amount, 0);
    });
  });

  return summary;
};
