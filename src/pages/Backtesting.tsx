import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, Percent, ExternalLink, ImageIcon, Target, Download } from "lucide-react";
import { BacktestReportGenerator } from "@/components/BacktestReportGenerator";
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
    const actualTrades = trades.filter(t => !t.no_trade_day);
    const noTradeDays = trades.filter(t => t.no_trade_day).length;
    const totalDays = trades.length;
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
      const modelTrades = trades.filter(t => t.entry_model === model && !t.no_trade_day);
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
      const dayTrades = trades.filter(t => t.day_of_week === day && !t.no_trade_day);
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
      const weekTrades = trades.filter(t => t.week_of_month === week && !t.no_trade_day);
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
    if (trades.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const actualTrades = trades.filter(t => !t.no_trade_day);
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
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
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
    
    const sortedTrades = [...trades]
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
              <BacktestReportGenerator trades={trades} strategy={currentStrategy} />
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
                <CardTitle>Operaciones Recientes</CardTitle>
                {trades.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Mostrando {Math.min(tradesLimit, trades.length)} de {trades.length} operaciones
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trades.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay registros para esta estrategia
                    </p>
                  ) : (
                    <>
                      {trades.slice(0, tradesLimit).map((trade) => (
                      <div 
                        key={trade.id} 
                        className={`flex items-start justify-between p-4 border rounded-lg transition-colors cursor-pointer ${
                          trade.no_trade_day 
                            ? 'bg-warning/5 border-warning/20' 
                            : 'hover:bg-accent/5'
                        }`}
                        onClick={() => {
                          setSelectedTrade(trade);
                          setEditDialogOpen(true);
                        }}
                      >
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
                          <a 
                            href={trade.image_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
                          >
                            <ImageIcon className="h-4 w-4" />
                            Ver Chart
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                    
                    {trades.length > tradesLimit && (
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
              <DialogTitle>Editar Operación</DialogTitle>
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