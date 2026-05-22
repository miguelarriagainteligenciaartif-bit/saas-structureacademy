import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { DashboardFilters } from "@/components/DashboardFilters";
import { getEntryPattern } from "@/lib/entryPattern";
import { applyTradeFilters, defaultFilterState, type FilterState, type ModelPatterns, type NewsFilter } from "@/lib/tradeFilters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Flame, Shield, TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  date: string;
  day_of_week: string;
  entry_time: string | null;
  result_type: string | null;
  entry_model: string | null;
  result_dollars: number | null;
  continuation_subtype: string | null;
  fvg_count: number | null;
  entry_subtype: string | null;
  trade_type: string | null;
  had_news: boolean | null;
  drawdown: number | null;
}

interface StreakInfo {
  length: number;
  type: "TP" | "SL";
  startDate: string;
  endDate: string;
  trades: Trade[];
}

function computeStreaks(trades: Trade[]): StreakInfo[] {
  const decisive = trades.filter(t => t.result_type === "TP" || t.result_type === "SL");
  if (decisive.length === 0) return [];

  const streaks: StreakInfo[] = [];
  let current: StreakInfo = {
    length: 1,
    type: decisive[0].result_type as "TP" | "SL",
    startDate: decisive[0].date,
    endDate: decisive[0].date,
    trades: [decisive[0]],
  };

  for (let i = 1; i < decisive.length; i++) {
    if (decisive[i].result_type === current.type) {
      current.length++;
      current.endDate = decisive[i].date;
      current.trades.push(decisive[i]);
    } else {
      streaks.push(current);
      current = {
        length: 1,
        type: decisive[i].result_type as "TP" | "SL",
        startDate: decisive[i].date,
        endDate: decisive[i].date,
        trades: [decisive[i]],
      };
    }
  }
  streaks.push(current);
  return streaks;
}

function buildDistribution(streaks: StreakInfo[], type: "TP" | "SL") {
  const filtered = streaks.filter(s => s.type === type);
  const dist: Record<string, number> = {};
  let maxLen = 0;
  for (const s of filtered) {
    const key = s.length >= 6 ? "6+" : String(s.length);
    dist[key] = (dist[key] || 0) + 1;
    if (s.length > maxLen) maxLen = s.length;
  }
  return { dist, maxLen, total: filtered.length };
}

function calculateRiskOfRuin(winRate: number, riskPercent: number, payoffRatio: number): number {
  // Risk of ruin formula considering payoff ratio (avg win / avg loss)
  // p = win rate, q = loss rate, b = payoff ratio
  // If p*b > q (positive edge): RoR = (q / (p * b))^(capital_units)
  // capital_units = 100 / riskPercent (number of risk units in account)
  if (winRate >= 1) return 0;
  if (winRate <= 0) return 1;
  
  const q = 1 - winRate;
  const edge = winRate * payoffRatio - q;
  if (edge <= 0) return 1; // No edge = certain ruin eventually
  
  const capitalUnits = Math.floor(100 / riskPercent); // Units to lose 100% of capital
  const ratio = q / (winRate * payoffRatio);
  const ror = Math.pow(ratio, capitalUnits);
  return Math.min(ror, 1);
}

export default function StreakTracker() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [filterNewsTypes, setFilterNewsTypes] = useState<string[]>([]);
  const [filterDrawdownLevels, setFilterDrawdownLevels] = useState<number[]>([]);
  const [filterDaysOfWeek, setFilterDaysOfWeek] = useState<string[]>([]);

  const [expandedStreaks, setExpandedStreaks] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkUser();
  }, []);

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
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("date", { ascending: true })
      .order("entry_time", { ascending: true });

    if (!error && data) {
      setTrades(data);
    }
    setLoading(false);
  };

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
    newsTypes: filterNewsTypes,
    drawdownLevels: filterDrawdownLevels,
    daysOfWeek: filterDaysOfWeek,
  });
  const applyFilters = (tradeList: Trade[]) => applyTradeFilters(tradeList, buildFilterState());

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
    setFilterNewsTypes(d.newsTypes);
    setFilterDrawdownLevels(d.drawdownLevels);
    setFilterDaysOfWeek(d.daysOfWeek);
  };

  const filteredTrades = useMemo(() => applyFilters(trades), [trades, filterDateFrom, filterDateTo, filterModels, filterTimeFrom, filterTimeTo, filterModelPatterns, filterFvgCounts, filterResults, filterTradeTypes, filterNews, filterDrawdownLevels, filterDaysOfWeek]);

  const streaks = useMemo(() => computeStreaks(filteredTrades), [filteredTrades]);

  const tpStats = useMemo(() => buildDistribution(streaks, "TP"), [streaks]);
  const slStats = useMemo(() => buildDistribution(streaks, "SL"), [streaks]);

  const decisiveTrades = useMemo(() => filteredTrades.filter(t => t.result_type === "TP" || t.result_type === "SL"), [filteredTrades]);
  const winRate = useMemo(() => {
    if (decisiveTrades.length === 0) return 0;
    return decisiveTrades.filter(t => t.result_type === "TP").length / decisiveTrades.length;
  }, [decisiveTrades]);

  const payoffRatio = useMemo(() => {
    const wins = decisiveTrades.filter(t => t.result_type === "TP");
    const losses = decisiveTrades.filter(t => t.result_type === "SL");
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + Math.abs(t.result_dollars || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + Math.abs(t.result_dollars || 0), 0) / losses.length : 1;
    return avgLoss > 0 ? avgWin / avgLoss : 1;
  }, [decisiveTrades]);

  const riskOfRuin = useMemo(() => calculateRiskOfRuin(winRate, 1, payoffRatio), [winRate, payoffRatio]);

  const longestTP = useMemo(() => {
    const tpStreaks = streaks.filter(s => s.type === "TP");
    return tpStreaks.length > 0 ? tpStreaks.reduce((a, b) => a.length > b.length ? a : b) : null;
  }, [streaks]);

  const longestSL = useMemo(() => {
    const slStreaks = streaks.filter(s => s.type === "SL");
    return slStreaks.length > 0 ? slStreaks.reduce((a, b) => a.length > b.length ? a : b) : null;
  }, [streaks]);

  // Get top N streaks for detail view
  const topStreaks = useMemo(() => {
    return [...streaks]
      .filter(s => s.length >= 3)
      .sort((a, b) => b.length - a.length)
      .slice(0, 20);
  }, [streaks]);

  const toggleStreak = (key: string) => {
    setExpandedStreaks(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allLengths = ["1", "2", "3", "4", "5", "6+"];

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y.slice(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header userName={user?.email?.split("@")[0]} />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName={user?.email?.split("@")[0]} />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Flame className="h-8 w-8 text-primary" />
            Racha Tracker
          </h1>
          <p className="text-muted-foreground mt-1">Análisis de rachas consecutivas TP/SL y riesgo de ruina</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Racha TP más larga"
            value={longestTP ? `${longestTP.length} TP` : "—"}
            icon={TrendingUp}
            trend="up"
            subtitle={longestTP ? `${formatDate(longestTP.startDate)} → ${formatDate(longestTP.endDate)}` : undefined}
          />
          <StatsCard
            title="Racha SL más larga"
            value={longestSL ? `${longestSL.length} SL` : "—"}
            icon={TrendingDown}
            trend="down"
            subtitle={longestSL ? `${formatDate(longestSL.startDate)} → ${formatDate(longestSL.endDate)}` : undefined}
          />
          <StatsCard
            title="Win Rate"
            value={`${(winRate * 100).toFixed(1)}%`}
            icon={Shield}
            trend={winRate >= 0.5 ? "up" : "down"}
            subtitle={`${decisiveTrades.filter(t => t.result_type === "TP").length} TP / ${decisiveTrades.filter(t => t.result_type === "SL").length} SL`}
          />
          <StatsCard
            title="Riesgo de Ruina"
            value={`${(riskOfRuin * 100).toFixed(2)}%`}
            icon={AlertTriangle}
            trend={riskOfRuin < 0.01 ? "up" : riskOfRuin < 0.05 ? "neutral" : "down"}
            subtitle="Prob. perder 100% del capital (1% riesgo)"
          />
        </div>

        {/* Distribution Table */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Rachas</CardTitle>
            <CardDescription>Frecuencia de rachas consecutivas por longitud — TP vs SL</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Longitud</TableHead>
                  <TableHead className="text-center">
                    <span className="text-success font-semibold">TP</span>
                  </TableHead>
                  <TableHead className="text-center">
                    <span className="text-destructive font-semibold">SL</span>
                  </TableHead>
                  <TableHead className="text-center">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLengths.map(len => {
                  const tp = tpStats.dist[len] || 0;
                  const sl = slStats.dist[len] || 0;
                  const diff = tp - sl;
                  return (
                    <TableRow key={len}>
                      <TableCell className="font-medium">{len} seguidos</TableCell>
                      <TableCell className="text-center">
                        {tp > 0 ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                            {tp}×
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {sl > 0 ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                            {sl}×
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-semibold",
                          diff > 0 && "text-success",
                          diff < 0 && "text-destructive",
                          diff === 0 && "text-muted-foreground"
                        )}>
                          {diff > 0 ? `+${diff}` : diff === 0 ? "=" : diff}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="border-t-2 border-border">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-center font-bold text-success">{tpStats.total}</TableCell>
                  <TableCell className="text-center font-bold text-destructive">{slStats.total}</TableCell>
                  <TableCell className="text-center font-bold">
                    <span className={cn(
                      tpStats.total - slStats.total > 0 ? "text-success" : "text-destructive"
                    )}>
                      {tpStats.total - slStats.total > 0 ? "+" : ""}{tpStats.total - slStats.total}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Streaks Detail */}
        <Card>
          <CardHeader>
            <CardTitle>Rachas Destacadas (≥3 consecutivos)</CardTitle>
            <CardDescription>Haz clic para ver los trades involucrados en cada racha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topStreaks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No se encontraron rachas de 3 o más con los filtros actuales.
              </p>
            ) : (
              topStreaks.map((streak, idx) => {
                const key = `${streak.type}-${idx}`;
                const isOpen = expandedStreaks.has(key);
                return (
                  <Collapsible key={key} open={isOpen} onOpenChange={() => toggleStreak(key)}>
                    <CollapsibleTrigger className="w-full">
                      <div className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-muted/50",
                        streak.type === "TP" ? "border-success/20" : "border-destructive/20"
                      )}>
                        <div className="flex items-center gap-3">
                          {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          <Badge variant="outline" className={cn(
                            "text-sm px-3 py-1",
                            streak.type === "TP" 
                              ? "bg-success/10 text-success border-success/30" 
                              : "bg-destructive/10 text-destructive border-destructive/30"
                          )}>
                            {streak.length}× {streak.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(streak.startDate)} → {formatDate(streak.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {streak.trades.map((t, i) => (
                            <div key={i} className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              streak.type === "TP" ? "bg-success" : "bg-destructive"
                            )} />
                          ))}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-7 mt-1 mb-2 border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Fecha</TableHead>
                              <TableHead className="text-xs">Hora</TableHead>
                              <TableHead className="text-xs">Modelo</TableHead>
                              <TableHead className="text-xs text-right">P&L</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {streak.trades.map((t, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-xs py-2">{formatDate(t.date)}</TableCell>
                                <TableCell className="text-xs py-2">{t.entry_time || "—"}</TableCell>
                                <TableCell className="text-xs py-2">{t.entry_model}</TableCell>
                                <TableCell className={cn(
                                  "text-xs py-2 text-right font-medium",
                                  (t.result_dollars || 0) >= 0 ? "text-success" : "text-destructive"
                                )}>
                                  ${t.result_dollars?.toFixed(2) || "0.00"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Risk of Ruin Explanation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Riesgo de Ruina
            </CardTitle>
            <CardDescription>Probabilidad estimada de perder el 100% del capital</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Win Rate actual</p>
                <p className="text-2xl font-bold">{(winRate * 100).toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Payoff Ratio (Avg Win / Avg Loss)</p>
                <p className="text-2xl font-bold">{payoffRatio.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Riesgo por trade</p>
                <p className="text-2xl font-bold">1%</p>
              </div>
              <div className={cn(
                "p-4 rounded-lg border",
                riskOfRuin < 0.01 ? "bg-success/5 border-success/30" : riskOfRuin < 0.05 ? "bg-warning/5 border-warning/30" : "bg-destructive/5 border-destructive/30"
              )}>
                <p className="text-xs text-muted-foreground mb-1">Prob. perder 100% capital</p>
                <p className={cn(
                  "text-2xl font-bold",
                  riskOfRuin < 0.01 ? "text-success" : riskOfRuin < 0.05 ? "text-warning" : "text-destructive"
                )}>
                  {riskOfRuin < 0.0001 ? "< 0.01%" : `${(riskOfRuin * 100).toFixed(2)}%`}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• <strong className="text-foreground">Verde ({"<"}1%)</strong>: Edge sólido, prácticamente imposible de arruinarte.</p>
              <p>• <strong className="text-warning">Amarillo (1-5%)</strong>: Precaución, el edge existe pero es ajustado.</p>
              <p>• <strong className="text-destructive">Rojo ({">"}5%)</strong>: Riesgo significativo. Revisa tu gestión de riesgo.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
