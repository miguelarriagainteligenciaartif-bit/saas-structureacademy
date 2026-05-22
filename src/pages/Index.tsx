import { useEffect, useState } from "react";
import { format } from "date-fns";
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
import { getEntryPattern } from "@/lib/entryPattern";
import { PatternModelFvgMatrix } from "@/components/PatternModelFvgMatrix";
import { applyTradeFilters, defaultFilterState, hasActiveFilters as filtersAreActive, hasModelPatternRestriction, VALID_PATTERNS_BY_MODEL, type FilterState, type ModelPatterns, type NewsFilter } from "@/lib/tradeFilters";
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

const formatCompactCurrency = (n: number): string => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)} M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)} K`;
  return `${sign}$${abs.toFixed(2)}`;
};

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
  fvg_count: number | null;
  entry_subtype: string | null;
}

const formatDateFilter = (date: Date) => format(date, "yyyy-MM-dd");

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
  const [filterModels, setFilterModels] = useState<string[]>(["M1", "M3", "Continuación"]);
  const [filterTimeFrom, setFilterTimeFrom] = useState<string>("");
  const [filterTimeTo, setFilterTimeTo] = useState<string>("");
  const [filterModelPatterns, setFilterModelPatterns] = useState<ModelPatterns>({});
  const [filterFvgCounts, setFilterFvgCounts] = useState<number[]>([]);
  const [filterResults, setFilterResults] = useState<string[]>([]);
  const [filterTradeTypes, setFilterTradeTypes] = useState<string[]>([]);
  const [filterNews, setFilterNews] = useState<NewsFilter>("all");
  const [filterDrawdownLevels, setFilterDrawdownLevels] = useState<number[]>([]);
  const [filterDaysOfWeek, setFilterDaysOfWeek] = useState<string[]>([]);

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

  useEffect(() => {
    setTradesLimit(50);
    setSelectedTradeIds(new Set());
  }, [selectedAccount, filterDateFrom, filterDateTo, filterModels, filterTimeFrom, filterTimeTo, filterModelPatterns, filterFvgCounts, filterResults, filterTradeTypes, filterNews, filterDrawdownLevels, filterDaysOfWeek]);

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

  // Apply all filters: account, date range, model, etc.
  const buildFilterState = (): FilterState => ({
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    models: filterModels,
    timeFrom: filterTimeFrom,
    timeTo: filterTimeTo,
    modelPatterns: filterModelPatterns,
    fvgCounts: filterFvgCounts,
    results: filterResults,
    tradeTypes: filterTradeTypes,
    newsFilter: filterNews,
    drawdownLevels: filterDrawdownLevels,
    daysOfWeek: filterDaysOfWeek,
  });
  const applyFilters = (tradeList: Trade[]) => {
    let filtered = tradeList;
    if (selectedAccount !== "all") {
      filtered = filtered.filter(t => t.account_id === selectedAccount);
    }
    return applyTradeFilters(filtered, buildFilterState());
  };

  const allModels = ["M1", "M3", "Continuación"];
  const isModelFiltered = filterModels.length < allModels.length;
  const isPatternFiltered = hasModelPatternRestriction(filterModelPatterns);
  const hasActiveFilters = selectedAccount !== "all" || filtersAreActive(buildFilterState());

  const activeFilterLabel = (() => {
    const parts: string[] = [];
    if (filterDateFrom) parts.push(`Desde: ${filterDateFrom.toLocaleDateString("es-ES")}`);
    if (filterDateTo) parts.push(`Hasta: ${filterDateTo.toLocaleDateString("es-ES")}`);
    if (filterTimeFrom) parts.push(`Hora desde: ${filterTimeFrom}`);
    if (filterTimeTo) parts.push(`Hora hasta: ${filterTimeTo}`);
    if (isModelFiltered) parts.push(`Modelos: ${filterModels.join(", ")}`);
    if (isPatternFiltered) {
      const summary = Object.entries(filterModelPatterns)
        .filter(([m, ps]) => {
          const valid = VALID_PATTERNS_BY_MODEL[m] || [];
          return ps.length !== valid.length || !valid.every(v => ps.includes(v));
        })
        .map(([m, ps]) => `${m}: ${ps.length === 0 ? "ninguno" : ps.map(p => p.replace("Envolvente + ", "Env+")).join(", ")}`)
        .join(" · ");
      parts.push(`Patrón → ${summary}`);
    }
    if (filterFvgCounts.length > 0 && filterFvgCounts.length < 3) parts.push(`FVG: ${filterFvgCounts.join("/")}`);
    if (filterResults.length > 0 && filterResults.length < 2) parts.push(`Resultado: ${filterResults.join("/")}`);
    if (filterTradeTypes.length > 0 && filterTradeTypes.length < 2) parts.push(`Tipo: ${filterTradeTypes.join("/")}`);
    if (filterNews !== "all") parts.push(`Noticia: ${filterNews === "with" ? "con" : "sin"}`);
    if (filterDrawdownLevels.length > 0 && filterDrawdownLevels.length < 5) parts.push(`DD: ${filterDrawdownLevels.map(l => `${Math.round(l*100)}%`).join("/")}`);
    if (filterDaysOfWeek.length > 0 && filterDaysOfWeek.length < 5) parts.push(`Días: ${filterDaysOfWeek.map(d => d.slice(0,3)).join("/")}`);
    if (selectedAccount !== "all") {
      const acc = accounts.find(a => a.id === selectedAccount);
      if (acc) parts.push(`Cuenta: ${acc.name}`);
    }
    return parts.join(" · ");
  })();

  const filteredTradesForMetrics = applyFilters(allTrades);
  const actualTrades = filteredTradesForMetrics.filter(t => !t.no_trade_day);

  // Filter first, then limit only the visible table rows so filters search the full history.
  const filteredTradesForTable = filteredTradesForMetrics.slice(0, tradesLimit);
  const hasMoreFilteredTrades = filteredTradesForMetrics.length > tradesLimit;

  const clearFilters = () => {
    const d = defaultFilterState();
    setFilterDateFrom(d.dateFrom);
    setFilterDateTo(d.dateTo);
    setFilterModels(d.models);
    setFilterTimeFrom(d.timeFrom);
    setFilterTimeTo(d.timeTo);
    setFilterModelPatterns(d.modelPatterns);
    setFilterFvgCounts(d.fvgCounts);
    setFilterResults(d.results);
    setFilterTradeTypes(d.tradeTypes);
    setFilterNews(d.newsFilter);
    setFilterDrawdownLevels(d.drawdownLevels);
    setFilterDaysOfWeek(d.daysOfWeek);
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
          {hasActiveFilters && (
            <ReportGeneratorDialog trades={filteredTradesForMetrics} label="Informe Filtrado" directGenerate filterLabel={activeFilterLabel} />
          )}
          <ReportGeneratorDialog trades={allTrades} />
        </div>

        {/* Dashboard Filters */}
        <DashboardFilters
          dateFrom={filterDateFrom}
          dateTo={filterDateTo}
          selectedModels={filterModels}
          timeFrom={filterTimeFrom}
          timeTo={filterTimeTo}
          modelPatterns={filterModelPatterns}
          onDateFromChange={setFilterDateFrom}
          onDateToChange={setFilterDateTo}
          onModelsChange={setFilterModels}
          onTimeFromChange={setFilterTimeFrom}
          onTimeToChange={setFilterTimeTo}
          onModelPatternsChange={setFilterModelPatterns}
          onClearFilters={clearFilters}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <StatsCard
            title="P&L Total"
            value={formatCompactCurrency(stats.totalPnL)}
            valueTitle={`$${stats.totalPnL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            trend={stats.totalPnL >= 0 ? "up" : "down"}
          />
          <StatsCard
            title="Win Rate"
            value={`${winRate}%`}
            icon={Target}
            trend={Number(winRate) >= 40 ? "up" : "down"}
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
            value={(() => {
              const pnl = (arr: typeof stats.m1Trades) =>
                arr.reduce((s, t) => s + (t.result_dollars || 0), 0);
              const candidates = [
                { name: "M1", pnl: pnl(stats.m1Trades), n: stats.m1Trades.length },
                { name: "M3", pnl: pnl(stats.m3Trades), n: stats.m3Trades.length },
                { name: "Continuación", pnl: pnl(stats.contTrades), n: stats.contTrades.length },
              ].filter(c => c.n > 0);
              if (candidates.length === 0) return "—";
              return candidates.reduce((b, c) => (c.pnl > b.pnl ? c : b)).name;
            })()}
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

        {/* Pattern × Model × FVG matrix */}
        <PatternModelFvgMatrix trades={filteredTradesForMetrics} />

        {/* Drawdown by Model */}
        <DrawdownByModel trades={filteredTradesForMetrics} />

        {/* Monthly Results */}
        <MonthlyResults trades={filteredTradesForMetrics} />

        {/* Recent Trades Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Operaciones Recientes</CardTitle>
                <CardDescription>
                  Mostrando {filteredTradesForTable.length} de {filteredTradesForMetrics.length} operación{filteredTradesForMetrics.length !== 1 ? 'es' : ''}
                  {hasMoreFilteredTrades && ' - Hay más operaciones disponibles'}
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
            ) : filteredTradesForMetrics.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay operaciones que coincidan con los filtros</p>
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
                              : (trade.entry_model === "M1" || trade.entry_model === "M3")
                                ? `${trade.entry_model}${trade.fvg_count ? ` ${trade.fvg_count}FVG` : ""}${trade.entry_subtype ? ` ${trade.entry_subtype.replace("Envolvente + ", "")}` : ""}`
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
            {hasMoreFilteredTrades && (
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
