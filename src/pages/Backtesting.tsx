import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, TrendingUp, TrendingDown, DollarSign, Percent, ExternalLink, ImageIcon, Target, Download, Filter, X, Trash2, CheckSquare } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { BacktestReportGenerator } from "@/components/BacktestReportGenerator";
import { BacktestCSVImporter } from "@/components/BacktestCSVImporter";
import { StatsCard } from "@/components/StatsCard";
import { TradeForm } from "@/components/TradeForm";
import { EditTradeForm } from "@/components/EditTradeForm";
import { StrategyManager } from "@/components/StrategyManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { toast } from "sonner";

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

const Backtesting = () => {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<BacktestTrade | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tradesLimit, setTradesLimit] = useState(10);
  const [hasMoreTrades, setHasMoreTrades] = useState(false);
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterTimeFrom, setFilterTimeFrom] = useState<string>("");
  const [filterTimeTo, setFilterTimeTo] = useState<string>("");

  const hasActiveFilters = filterDateFrom || filterDateTo || filterTimeFrom || filterTimeTo;

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (filterDateFrom && t.date < filterDateFrom) return false;
      if (filterDateTo && t.date > filterDateTo) return false;
      if (!t.no_trade_day && t.entry_time) {
        if (filterTimeFrom && t.entry_time < filterTimeFrom) return false;
        if (filterTimeTo && t.entry_time > filterTimeTo) return false;
      }
      return true;
    });
  }, [trades, filterDateFrom, filterDateTo, filterTimeFrom, filterTimeTo]);

  const clearFilters = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterTimeFrom("");
    setFilterTimeTo("");
  };

  const isSelecting = selectedTradeIds.size > 0;

  const toggleTradeSelection = (tradeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTradeIds(prev => {
      const next = new Set(prev);
      if (next.has(tradeId)) next.delete(tradeId);
      else next.add(tradeId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visible = filteredTrades.slice(0, tradesLimit);
    if (selectedTradeIds.size === visible.length) {
      setSelectedTradeIds(new Set());
    } else {
      setSelectedTradeIds(new Set(visible.map(t => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedTradeIds);
      const { error } = await supabase
        .from("backtest_trades")
        .delete()
        .in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} operación(es) eliminada(s)`);
      setSelectedTradeIds(new Set());
      setBulkDeleteOpen(false);
      fetchTrades();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchTrades = async () => {
    if (!selectedStrategy) {
      setTrades([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("backtest_trades")
        .select("*")
        .eq("strategy_id", selectedStrategy)
        .order("date", { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error("Error fetching backtest trades:", error);
      toast.error("Error al cargar operaciones de backtesting");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStrategy = async () => {
    if (!selectedStrategy) {
      setCurrentStrategy(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("backtest_strategies")
        .select("*")
        .eq("id", selectedStrategy)
        .maybeSingle();

      if (error) throw error;
      setCurrentStrategy(data);
    } catch (error) {
      console.error("Error fetching strategy:", error);
      setCurrentStrategy(null);
    }
  };

  useEffect(() => {
    if (selectedStrategy) {
      fetchTrades();
      fetchCurrentStrategy();
    } else {
      setTrades([]);
      setCurrentStrategy(null);
    }
  }, [selectedStrategy]);

  const calculateMetrics = () => {
    const actualTrades = filteredTrades.filter(t => !t.no_trade_day);
    const noTradeDays = filteredTrades.filter(t => t.no_trade_day).length;
    const totalDays = filteredTrades.length;
    const noTradeDaysPercentage = totalDays > 0 ? (noTradeDays / totalDays) * 100 : 0;
    
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

    // Calcular rachas consecutivas - INCLUYE Break Even como continuación
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
        if (currentTPStreak > bestTPStreak) {
          bestTPStreak = currentTPStreak;
        }
      } else if (trade.result_type === "SL") {
        currentSLStreak++;
        currentTPStreak = 0;
        if (currentSLStreak > worstSLStreak) {
          worstSLStreak = currentSLStreak;
        }
      } else if (trade.result_type === "Break Even") {
        // Break Even NO rompe la racha de TP, solo resetea SL
        currentSLStreak = 0;
      } else {
        // Cualquier otro tipo resetea ambas rachas
        currentTPStreak = 0;
        currentSLStreak = 0;
      }
    });

    // Calcular RR máximo promedio
    const tradesWithMaxRR = actualTrades.filter(t => t.max_rr !== null && t.max_rr !== undefined);
    const avgMaxRR = tradesWithMaxRR.length > 0
      ? tradesWithMaxRR.reduce((sum, t) => sum + (t.max_rr || 0), 0) / tradesWithMaxRR.length
      : 0;

    return {
      totalTrades,
      totalDays,
      noTradeDays,
      noTradeDaysPercentage,
      winningTrades,
      losingTrades,
      breakEvenTrades,
      totalProfit,
      winRate,
      avgWin,
      avgLoss,
      expectedValue,
      bestTPStreak,
      worstSLStreak,
      avgMaxRR,
      tradesWithMaxRR: tradesWithMaxRR.length
    };
  };

  const getAnalysisByEntryModel = () => {
    const models = ["M1", "M3", "Continuación"];
    return models.map(model => {
      const modelTrades = filteredTrades.filter(t => t.entry_model === model && !t.no_trade_day);
      const wins = modelTrades.filter(t => t.result_type === "TP").length;
      const total = modelTrades.length;
      const profit = modelTrades.reduce((sum, t) => sum + Number(t.result_dollars), 0);
      
      return {
        modelo: model,
        "Win Rate (%)": total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0,
        "Ganancia": Number(profit.toFixed(2)),
        operaciones: total
      };
    });
  };

  const getAnalysisByDayOfWeek = () => {
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    return days.map(day => {
      const dayTrades = filteredTrades.filter(t => t.day_of_week === day && !t.no_trade_day);
      const wins = dayTrades.filter(t => t.result_type === "TP").length;
      const total = dayTrades.length;
      const profit = dayTrades.reduce((sum, t) => sum + Number(t.result_dollars), 0);
      
      return {
        día: day,
        "Win Rate (%)": total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0,
        "Ganancia": Number(profit.toFixed(2)),
        operaciones: total
      };
    });
  };

  const getAnalysisByWeek = () => {
    const weeks = [1, 2, 3, 4, 5];
    return weeks.map(week => {
      const weekTrades = filteredTrades.filter(t => t.week_of_month === week && !t.no_trade_day);
      const wins = weekTrades.filter(t => t.result_type === "TP").length;
      const total = weekTrades.length;
      const profit = weekTrades.reduce((sum, t) => sum + Number(t.result_dollars), 0);
      
      return {
        semana: `Semana ${week}`,
        "Win Rate (%)": total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0,
        "Ganancia": Number(profit.toFixed(2)),
        operaciones: total
      };
    }).filter(w => w.operaciones > 0);
  };

  const exportToCSV = () => {
    if (filteredTrades.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const actualTrades = filteredTrades.filter(t => !t.no_trade_day);
    let csvContent = "QUANTUM ERA - BACKTESTING EXPORT\n\n";
    
    csvContent += "=== ESTRATEGIA ===\n";
    csvContent += `Nombre,${currentStrategy?.name || "N/A"}\n`;
    csvContent += `Capital Inicial,$${(currentStrategy?.initial_capital || 0).toFixed(2)}\n`;
    csvContent += `R:R,${currentStrategy?.risk_reward_ratio || "N/A"}\n\n`;

    csvContent += "=== RESUMEN ===\n";
    csvContent += `Total Operaciones,${metrics.totalTrades}\n`;
    csvContent += `Ganadoras,${metrics.winningTrades}\n`;
    csvContent += `Perdedoras,${metrics.losingTrades}\n`;
    csvContent += `Break Even,${metrics.breakEvenTrades}\n`;
    csvContent += `Win Rate,${metrics.winRate.toFixed(1)}%\n`;
    csvContent += `P&L Total,$${metrics.totalProfit.toFixed(2)}\n`;
    csvContent += `Expected Value,$${metrics.expectedValue.toFixed(2)}\n`;
    csvContent += `Mejor Racha TP,${metrics.bestTPStreak}\n`;
    csvContent += `Peor Racha SL,${metrics.worstSLStreak}\n\n`;

    csvContent += "=== ANÁLISIS POR SEMANA ===\n";
    csvContent += "Semana,Operaciones,Win Rate (%),P&L ($)\n";
    getAnalysisByWeek().forEach(w => {
      csvContent += `${w.semana},${w.operaciones},${w["Win Rate (%)"]},${w.Ganancia}\n`;
    });
    csvContent += "\n";

    csvContent += "=== ANÁLISIS POR DÍA ===\n";
    csvContent += "Día,Operaciones,Win Rate (%),P&L ($)\n";
    dayData.forEach(d => {
      csvContent += `${d.día},${d.operaciones},${d["Win Rate (%)"]},${d.Ganancia}\n`;
    });
    csvContent += "\n";

    csvContent += "=== ANÁLISIS POR MODELO ===\n";
    csvContent += "Modelo,Operaciones,Win Rate (%),P&L ($)\n";
    modelData.forEach(m => {
      csvContent += `${m.modelo},${m.operaciones},${m["Win Rate (%)"]},${m.Ganancia}\n`;
    });
    csvContent += "\n";

    csvContent += "=== DETALLE DE OPERACIONES ===\n";
    csvContent += "Fecha,Día,Semana,Hora Entrada,Tipo,Modelo,Resultado,P&L ($),RR Máx,Notas\n";
    const sorted = [...filteredTrades].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach(t => {
      if (t.no_trade_day) {
        csvContent += `${t.date},${t.day_of_week},${t.week_of_month || ""},,,,,Día sin entrada,,\n`;
      } else {
        csvContent += `${t.date},${t.day_of_week},${t.week_of_month || ""},${t.entry_time || ""},${t.trade_type},${t.entry_model},${t.result_type},$${Number(t.result_dollars).toFixed(2)},${t.max_rr !== null ? t.max_rr : ""},\n`;
      }
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const slug = (currentStrategy?.name || "backtest").toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    link.download = `quantum-backtest-${slug}-${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado exitosamente");
  };

  const getEquityCurveData = () => {
    if (!currentStrategy) return [];
    
    const sortedTrades = [...filteredTrades]
      .filter(t => !t.no_trade_day)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulativeEquity = currentStrategy.initial_capital;
    return sortedTrades.map((trade) => {
      cumulativeEquity += Number(trade.result_dollars);
      return {
        date: new Date(trade.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        equity: Number(cumulativeEquity.toFixed(2)),
        fullDate: trade.date
      };
    });
  };

  const metrics = calculateMetrics();
  const modelData = getAnalysisByEntryModel();
  const dayData = getAnalysisByDayOfWeek();
  const weekData = getAnalysisByWeek();
  const equityData = getEquityCurveData();
  const initialCapital = currentStrategy?.initial_capital || 0;

  if (loading && selectedStrategy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Backtesting</h1>
            <p className="text-muted-foreground">Prueba y analiza tus estrategias con datos históricos</p>
          </div>
          {selectedStrategy && currentStrategy && (
            <div className="flex gap-3">
              <Button onClick={exportToCSV} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <BacktestCSVImporter strategyId={selectedStrategy} onSuccess={fetchTrades} />
              <BacktestReportGenerator trades={filteredTrades} strategy={currentStrategy} />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Operación
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nueva Operación de Backtesting</DialogTitle>
                </DialogHeader>
                <TradeForm 
                  isBacktest={true}
                  strategyId={selectedStrategy}
                  onSuccess={() => {
                    setIsDialogOpen(false);
                    fetchTrades();
                  }}
                />
              </DialogContent>
            </Dialog>
            </div>
          )}
        </div>

        {/* Strategy Manager */}
        <div className="mb-8">
          <StrategyManager 
            selectedStrategy={selectedStrategy}
            onStrategyChange={setSelectedStrategy}
            onStrategiesUpdate={() => {
              if (selectedStrategy) {
                fetchCurrentStrategy();
              }
            }}
          />
        </div>

        {!selectedStrategy ? (
          <Card>
            <CardContent className="py-20">
              <p className="text-center text-muted-foreground">
                Selecciona o crea una estrategia para comenzar
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current Strategy Info */}
            {currentStrategy && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{currentStrategy.name}</span>
                    <div className="flex gap-4 text-sm font-normal text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        R:R {currentStrategy.risk_reward_ratio}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            )}

            {/* Filters */}
            <Card className="mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                    {hasActiveFilters && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {filteredTrades.length} de {trades.length} operaciones
                      </span>
                    )}
                  </span>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs h-7">
                      <X className="h-3 w-3" />
                      Limpiar filtros
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fecha desde</Label>
                    <Input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fecha hasta</Label>
                    <Input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora desde</Label>
                    <Input
                      type="time"
                      value={filterTimeFrom}
                      onChange={(e) => setFilterTimeFrom(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora hasta</Label>
                    <Input
                      type="time"
                      value={filterTimeTo}
                      onChange={(e) => setFilterTimeTo(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <StatsCard
                title="Capital Inicial"
                value={`$${initialCapital.toFixed(2)}`}
                icon={DollarSign}
                trend="neutral"
              />
              <StatsCard
                title="Capital Actual"
                value={`$${(initialCapital + metrics.totalProfit).toFixed(2)}`}
                icon={DollarSign}
                trend={(initialCapital + metrics.totalProfit) >= initialCapital ? "up" : "down"}
                subtitle="Capital inicial + P&L"
              />
              <StatsCard
                title="Total de Operaciones"
                value={metrics.totalTrades}
                icon={DollarSign}
                trend="neutral"
              />
              <StatsCard
                title="Win Rate"
                value={`${metrics.winRate.toFixed(1)}%`}
                icon={Percent}
                trend={metrics.winRate >= 50 ? "up" : "down"}
              />
              <StatsCard
                title="Expected Value"
                value={`$${metrics.expectedValue.toFixed(2)}`}
                icon={TrendingUp}
                trend={metrics.expectedValue > 0 ? "up" : "down"}
                subtitle="Por operación"
              />
              <StatsCard
                title="RR Máximo Promedio"
                value={metrics.avgMaxRR > 0 ? metrics.avgMaxRR.toFixed(2) : "N/A"}
                icon={TrendingUp}
                trend="up"
                subtitle={`${metrics.tradesWithMaxRR} ops con RR máx`}
              />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Operaciones Ganadoras</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-success">{metrics.winningTrades}</p>
                  <p className="text-xs text-muted-foreground">Promedio: ${metrics.avgWin.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Operaciones Perdedoras</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">{metrics.losingTrades}</p>
                  <p className="text-xs text-muted-foreground">Promedio: -${metrics.avgLoss.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="border-warning/20 bg-warning/5">
                <CardHeader>
                  <CardTitle className="text-sm text-warning">Días sin Operación</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-warning">{metrics.noTradeDays}</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.noTradeDaysPercentage.toFixed(1)}% del total de días ({metrics.totalDays})
                  </p>
                </CardContent>
              </Card>
              <Card className="border-success/20 bg-success/5">
                <CardHeader>
                  <CardTitle className="text-sm text-success">Mejor Racha (TP)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-success">{metrics.bestTPStreak}</p>
                  <p className="text-xs text-muted-foreground">TP consecutivos</p>
                </CardContent>
              </Card>
              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-sm text-destructive">Peor Racha (SL)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">{metrics.worstSLStreak}</p>
                  <p className="text-xs text-muted-foreground">SL consecutivos</p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Analysis */}
            {weekData.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Análisis por Semana del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weekData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semana" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === "Ganancia") return [`$${value}`, "Ganancia ($)"];
                          return [value, name];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          if (value === "Ganancia") return "Ganancia ($)";
                          return value;
                        }}
                      />
                      <Bar dataKey="Win Rate (%)" fill="hsl(var(--primary))" />
                      <Bar dataKey="Ganancia">
                        {weekData.map((entry, index) => (
                          <Cell key={`cell-week-${index}`} fill={entry.Ganancia >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis por Modelo de Entrada</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={modelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="modelo" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === "Ganancia") return [`$${value}`, "Ganancia ($)"];
                          return [value, name];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          if (value === "Ganancia") return "Ganancia ($)";
                          return value;
                        }}
                      />
                      <Bar dataKey="Win Rate (%)" fill="hsl(var(--primary))" />
                      <Bar dataKey="Ganancia">
                        {modelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.Ganancia >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Análisis por Día de la Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dayData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="día" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === "Ganancia") return [`$${value}`, "Ganancia ($)"];
                          return [value, name];
                        }}
                      />
                      <Legend 
                        formatter={(value: string) => {
                          if (value === "Ganancia") return "Ganancia ($)";
                          return value;
                        }}
                      />
                      <Bar dataKey="Win Rate (%)" fill="hsl(var(--primary))" />
                      <Bar dataKey="Ganancia">
                        {dayData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.Ganancia >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Trades */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Operaciones {hasActiveFilters ? "Filtradas" : "Recientes"}</CardTitle>
                    {filteredTrades.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Mostrando {Math.min(tradesLimit, filteredTrades.length)} de {filteredTrades.length} operaciones
                      </p>
                    )}
                  </div>
                  {filteredTrades.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={toggleSelectAll} className="gap-2">
                        <CheckSquare className="h-4 w-4" />
                        {selectedTradeIds.size === filteredTrades.slice(0, tradesLimit).length ? "Deseleccionar" : "Seleccionar todo"}
                      </Button>
                    </div>
                  )}
                </div>
                {isSelecting && (
                  <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <span className="text-sm font-medium">{selectedTradeIds.size} seleccionada(s)</span>
                    <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Eliminar seleccionadas
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar {selectedTradeIds.size} operación(es)?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán permanentemente las operaciones seleccionadas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleBulkDelete}
                          >
                            Eliminar {selectedTradeIds.size}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTradeIds(new Set())}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTrades.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {hasActiveFilters ? "No hay operaciones que coincidan con los filtros" : "No hay registros para esta estrategia"}
                    </p>
                  ) : (
                    <>
                      {filteredTrades.slice(0, tradesLimit).map((trade) => (
                      <div 
                        key={trade.id} 
                        className={`flex items-start gap-3 p-4 border rounded-lg transition-colors cursor-pointer ${
                          selectedTradeIds.has(trade.id) ? 'bg-primary/10 border-primary/30' :
                          trade.no_trade_day 
                            ? 'bg-warning/5 border-warning/20' 
                            : 'hover:bg-accent/5'
                        }`}
                        onClick={() => {
                          if (isSelecting) {
                            toggleTradeSelection(trade.id, { stopPropagation: () => {} } as React.MouseEvent);
                          } else {
                            setSelectedTrade(trade);
                            setEditDialogOpen(true);
                          }
                        }}
                      >
                        <div className="pt-1" onClick={(e) => toggleTradeSelection(trade.id, e)}>
                          <Checkbox
                            checked={selectedTradeIds.has(trade.id)}
                            onCheckedChange={() => {}}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-semibold">{new Date(trade.date).toLocaleDateString('es-ES')}</span>
                            <span className="text-xs text-muted-foreground">{trade.day_of_week}</span>
                            {trade.no_trade_day ? (
                              <span className="text-xs px-2 py-1 rounded bg-warning/20 text-warning">
                                Día sin entrada
                              </span>
                            ) : (
                              <span className={`text-xs px-2 py-1 rounded ${
                                trade.result_type === 'TP' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                              }`}>
                                {trade.result_type}
                              </span>
                            )}
                          </div>
                          {!trade.no_trade_day && (
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>Modelo: {trade.entry_model}</span>
                              <span>Tipo: {trade.trade_type}</span>
                              <span className={trade.result_dollars >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                                ${Number(trade.result_dollars).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        {trade.image_link && (
                          <div className="mt-2 border rounded-lg overflow-hidden max-w-xs">
                            <img
                              src={trade.image_link}
                              alt="Trade Chart"
                              className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {filteredTrades.length > tradesLimit && (
                      <div className="flex justify-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setTradesLimit(prev => prev + 10)}
                        >
                          Cargar 10 operaciones más
                        </Button>
                      </div>
                    )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Equity Curve */}
            <Card>
              <CardHeader>
                <CardTitle>Curva de Equity</CardTitle>
              </CardHeader>
              <CardContent>
                {equityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={equityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Equity ($)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
                        labelFormatter={(label) => `Fecha: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="equity" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    No hay operaciones registradas todavía
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Edit Trade Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <DialogTitle>Editar Operación</DialogTitle>
                {selectedTrade && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar esta operación?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente esta operación de backtesting.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from("backtest_trades")
                                .delete()
                                .eq("id", selectedTrade.id);
                              if (error) throw error;
                              toast.success("Operación eliminada exitosamente");
                              setEditDialogOpen(false);
                              fetchTrades();
                            } catch (error: any) {
                              toast.error(error.message || "Error al eliminar");
                            }
                          }}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </DialogHeader>
            {selectedTrade && (
              <EditTradeForm
                trade={selectedTrade}
                isBacktest={true}
                onSuccess={() => {
                  setEditDialogOpen(false);
                  fetchTrades();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Backtesting;