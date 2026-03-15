import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { TradeForm } from "@/components/TradeForm";
import { ReportGeneratorDialog } from "@/components/ReportGeneratorDialog";
import { CSVExportButton } from "@/components/CSVExportButton";
import { AccountManager } from "@/components/AccountManager";
import { TradeDetailsDialog } from "@/components/TradeDetailsDialog";
import { ExcelImporter } from "@/components/ExcelImporter";
import { MonthlyResults } from "@/components/MonthlyResults";
import { DollarSign, TrendingUp, TrendingDown, Target, Calendar, Layers, Trash2 } from "lucide-react";
import { DashboardFilters } from "@/components/DashboardFilters";
import { ModelComparisonTable } from "@/components/ModelComparisonTable";
import { DrawdownByModel } from "@/components/DrawdownByModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  entry_model: string | null;
  result_dollars: number | null;
  drawdown: number | null;
  had_news: boolean;
  news_description: string | null;
  custom_news_description: string | null;
  news_time: string | null;
  execution_timing: string | null;
  no_trade_day: boolean;
  image_link: string | null;
  account_id: string | null;
  risk_percentage: number;
  continuation_subtype: string | null;
}

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [allTrades, setAllTrades] = useState<Trade[]>([]); // ALL trades for metrics
  const [tradesLimit, setTradesLimit] = useState(50);
  const [hasMoreTrades, setHasMoreTrades] = useState(false);
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();
  const [filterModel, setFilterModel] = useState<string>("all");

  useEffect(() => {
    checkUser();
  }, []);

  // When tradesLimit changes, just update the displayed trades from allTrades
  useEffect(() => {
    if (allTrades.length > 0) {
      setTrades(allTrades.slice(0, tradesLimit));
      setHasMoreTrades(allTrades.length > tradesLimit);
    }
  }, [tradesLimit, allTrades]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    loadTrades();
  };

  const loadTrades = async () => {
    setLoading(true);

    try {
      // Load ALL trades for metrics (no limit)
      const { data: allData, error: allError } = await supabase
        .from("trades")
        .select("*")
        .order("date", { ascending: false })
        .order("entry_time", { ascending: false });

      if (allError) throw allError;

      if (allData) {
        setAllTrades(allData);
        setHasMoreTrades(allData.length > tradesLimit);
        setTrades(allData.slice(0, tradesLimit));
      }

      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .order("name");

      if (accountsError) throw accountsError;

      if (accountsData) {
        setAccounts(accountsData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters: account, date range, model
  const applyFilters = (tradeList: Trade[]) => {
    let filtered = tradeList;
    if (selectedAccount !== "all") {
      filtered = filtered.filter(t => t.account_id === selectedAccount);
    }
    if (filterDateFrom) {
      const fromStr = filterDateFrom.toISOString().split("T")[0];
      filtered = filtered.filter(t => t.date >= fromStr);
    }
    if (filterDateTo) {
      const toStr = filterDateTo.toISOString().split("T")[0];
      filtered = filtered.filter(t => t.date <= toStr);
    }
    if (filterModel !== "all") {
      filtered = filtered.filter(t => t.entry_model === filterModel);
    }
    return filtered;
  };

  const filteredTradesForMetrics = applyFilters(allTrades);
  const actualTrades = filteredTradesForMetrics.filter(t => !t.no_trade_day);

  // For table display, use limited then filtered
  const filteredTradesForTable = applyFilters(trades);

  const clearFilters = () => {
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
    setFilterModel("all");
  };

  // Calcular rachas consecutivas (orden cronológico real: fecha + hora de entrada)
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
    } else {
      currentTPStreak = 0;
      currentSLStreak = 0;
    }
  });

  const stats = {
    totalPnL: actualTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0),
    totalTrades: actualTrades.length,
    winningTrades: actualTrades.filter(t => t.result_type === "TP").length,
    losingTrades: actualTrades.filter(t => t.result_type === "SL").length,
    m1Trades: actualTrades.filter(t => t.entry_model === "M1"),
    m3Trades: actualTrades.filter(t => t.entry_model === "M3"),
    contTrades: actualTrades.filter(t => t.entry_model === "Continuación"),
    avgRisk: actualTrades.length > 0 
      ? actualTrades.reduce((sum, t) => sum + (t.risk_percentage || 1), 0) / actualTrades.length 
      : 0,
    bestTPStreak,
    worstSLStreak,
  };

  const winRate = stats.totalTrades > 0 ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1) : 0;

  // Prepare equity curve data with multiple lines for different accounts
  const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const equityCurveData = () => {
    if (selectedAccount !== "all") {
      // Single account curve
      let cumulative = 0;
      return actualTrades
        .slice()
        .reverse()
        .map((trade, index) => {
          cumulative += (trade.result_dollars || 0);
          return {
            trade: index + 1,
            equity: cumulative,
            date: trade.date,
          };
        });
    }

    // Multi-account curves
    const allAccountTrades = trades.filter(t => !t.no_trade_day);
    const tradesByDate = allAccountTrades.reduce((acc: any, trade) => {
      if (!acc[trade.date]) {
        acc[trade.date] = [];
      }
      acc[trade.date].push(trade);
      return acc;
    }, {});

    const dates = Object.keys(tradesByDate).sort();
    const accountCumulatives: Record<string, number> = {};
    
    // Initialize all accounts
    accounts.forEach(acc => {
      accountCumulatives[acc.id] = 0;
    });
    accountCumulatives["total"] = 0;

    return dates.map((date, index) => {
      const dayTrades = tradesByDate[date];
      const dataPoint: any = { trade: index + 1, date };

      // Update cumulatives for each account
      dayTrades.forEach((trade: Trade) => {
        if (trade.account_id) {
          accountCumulatives[trade.account_id] += (trade.result_dollars || 0);
        }
        accountCumulatives["total"] += (trade.result_dollars || 0);
      });

      // Add all account values to this data point
      accounts.forEach(acc => {
        dataPoint[acc.id] = accountCumulatives[acc.id];
      });
      dataPoint["total"] = accountCumulatives["total"];

      return dataPoint;
    });
  };

  const equityCurve = equityCurveData();

  // Multi-select handlers
  const toggleTradeSelection = (tradeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTradeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTradeIds.size === filteredTradesForTable.length) {
      setSelectedTradeIds(new Set());
    } else {
      setSelectedTradeIds(new Set(filteredTradesForTable.map(t => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTradeIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("trades")
        .delete()
        .in("id", Array.from(selectedTradeIds));

      if (error) throw error;

      toast.success(`${selectedTradeIds.size} trade(s) eliminados correctamente`);
      setSelectedTradeIds(new Set());
      loadTrades();
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName={user?.email} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Account Manager */}
        <AccountManager />

        {/* Report Generator and Excel Importer */}
        <div className="flex justify-end gap-2">
          <ExcelImporter onSuccess={loadTrades} />
          <CSVExportButton trades={allTrades} />
          <ReportGeneratorDialog trades={allTrades} />
        </div>

        {/* Dashboard Filters */}
        <DashboardFilters
          dateFrom={filterDateFrom}
          dateTo={filterDateTo}
          selectedModel={filterModel}
          onDateFromChange={setFilterDateFrom}
          onDateToChange={setFilterDateTo}
          onModelChange={setFilterModel}
          onClearFilters={clearFilters}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <StatsCard
            title="P&L Total"
            value={`$${stats.totalPnL.toFixed(2)}`}
            icon={DollarSign}
            trend={stats.totalPnL >= 0 ? "up" : "down"}
          />
          <StatsCard
            title="Win Rate"
            value={`${winRate}%`}
            icon={Target}
            trend={Number(winRate) >= 50 ? "up" : "down"}
            subtitle={`${stats.winningTrades} TP / ${stats.losingTrades} SL`}
          />
          <StatsCard
            title="Total Operaciones"
            value={stats.totalTrades}
            icon={Calendar}
            trend="neutral"
          />
          <StatsCard
            title="Riesgo Promedio"
            value={`${stats.avgRisk.toFixed(2)}%`}
            icon={Target}
            trend="neutral"
            subtitle="Por operación"
          />
          <StatsCard
            title="Mejor Modelo"
            value={
              stats.m1Trades.length >= stats.m3Trades.length && stats.m1Trades.length >= stats.contTrades.length
                ? "M1"
                : stats.m3Trades.length >= stats.contTrades.length
                ? "M3"
                : "Continuación"
            }
            icon={Layers}
            trend="neutral"
          />
          <StatsCard
            title="Mejor Racha TP"
            value={stats.bestTPStreak}
            icon={TrendingUp}
            trend="up"
            subtitle="Consecutivos"
          />
          <StatsCard
            title="Peor Racha SL"
            value={stats.worstSLStreak}
            icon={TrendingDown}
            trend="down"
            subtitle="Consecutivos"
          />
        </div>


        {/* Trade Form */}
        <TradeForm onSuccess={loadTrades} />

        {/* Model Comparison Table */}
        <ModelComparisonTable trades={filteredTradesForMetrics} />

        {/* Monthly Results */}
        <MonthlyResults trades={filteredTradesForMetrics} />

        {/* Recent Trades Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Operaciones Recientes</CardTitle>
                <CardDescription>
                  Mostrando {trades.length} operación{trades.length !== 1 ? 'es' : ''}
                  {hasMoreTrades && ' - Hay más operaciones disponibles'}
                  {selectedTradeIds.size > 0 && ` • ${selectedTradeIds.size} seleccionado(s)`}
                </CardDescription>
              </div>
              {selectedTradeIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar {selectedTradeIds.size} trade(s)
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar {selectedTradeIds.size} trade(s)?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Los trades seleccionados serán eliminados permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Eliminando..." : `Eliminar ${selectedTradeIds.size} trade(s)`}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Cargando...</p>
            ) : trades.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay operaciones registradas aún</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={filteredTradesForTable.length > 0 && selectedTradeIds.size === filteredTradesForTable.length}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Seleccionar todos"
                        />
                      </TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTradesForTable.map((trade) => (
                      <TableRow 
                        key={trade.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          selectedTradeIds.has(trade.id) && "bg-muted/30"
                        )}
                        onClick={() => {
                          setSelectedTrade(trade);
                          setDetailsOpen(true);
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedTradeIds.has(trade.id)}
                            onCheckedChange={() => {
                              setSelectedTradeIds(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(trade.id)) {
                                  newSet.delete(trade.id);
                                } else {
                                  newSet.add(trade.id);
                                }
                                return newSet;
                              });
                            }}
                            aria-label={`Seleccionar trade ${trade.date}`}
                          />
                        </TableCell>
                        <TableCell>{trade.date}</TableCell>
                        <TableCell>{trade.entry_time || "N/A"}</TableCell>
                        <TableCell>
                          {trade.no_trade_day ? (
                            <Badge variant="outline" className="text-warning">Sin Entrada</Badge>
                          ) : (
                            <Badge variant={trade.trade_type === "Compra" ? "default" : "secondary"}>
                              {trade.trade_type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {trade.entry_model === "Continuación" && trade.continuation_subtype
                              ? `Cont. ${trade.continuation_subtype}`
                              : trade.entry_model || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trade.no_trade_day ? (
                            <span className="text-muted-foreground">-</span>
                          ) : trade.result_type === "TP" ? (
                            <div className="flex items-center gap-1 text-success">
                              <TrendingUp className="h-4 w-4" />
                              <span className="font-medium">TP</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-destructive">
                              <TrendingDown className="h-4 w-4" />
                              <span className="font-medium">SL</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-medium",
                          trade.no_trade_day ? "text-muted-foreground" : (trade.result_dollars || 0) >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {trade.no_trade_day ? "-" : `$${(trade.result_dollars || 0).toFixed(2)}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {hasMoreTrades && (
              <div className="mt-4 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setTradesLimit(prev => prev + 50)}
                  disabled={loading}
                >
                  Cargar 50 operaciones más
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade Details Dialog */}
        <TradeDetailsDialog 
          trade={selectedTrade}
          open={detailsOpen}
          onOpenChange={(open) => {
            setDetailsOpen(open);
            if (!open) setSelectedTrade(null);
          }}
          onUpdated={loadTrades}
        />
      </main>
    </div>
  );
}
