import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { getEntryPattern } from "@/lib/entryPattern";
import { ReportGenerator } from "@/components/ReportGenerator";
import { DashboardFilters } from "@/components/DashboardFilters";
import { applyTradeFilters, defaultFilterState, type FilterState, type NewsFilter } from "@/lib/tradeFilters";
import { DollarSign, TrendingUp, TrendingDown, Target, Calendar, BarChart3, Clock, Flame, Award } from "lucide-react";
import { ContinuationSubtypeAnalysis } from "@/components/ContinuationSubtypeAnalysis";
import { DrawdownByModel } from "@/components/DrawdownByModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area } from "recharts";

interface Trade {
  id: string;
  date: string;
  day_of_week: string;
  week_of_month: number | null;
  entry_time: string | null;
  exit_time: string | null;
  trade_type: string | null;
  result_type: string | null;
  drawdown: number | null;
  entry_model: string | null;
  result_dollars: number | null;
  had_news: boolean;
  news_description: string | null;
  custom_news_description: string | null;
  news_time: string | null;
  execution_timing: string | null;
  no_trade_day: boolean;
  image_link: string | null;
  account_id: string | null;
  max_rr: number | null;
  continuation_subtype: string | null;
  fvg_count: number | null;
  entry_subtype: string | null;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();
  const [filterModels, setFilterModels] = useState<string[]>(["M1", "M3", "Continuación"]);
  const [filterTimeFrom, setFilterTimeFrom] = useState<string>("");
  const [filterTimeTo, setFilterTimeTo] = useState<string>("");
  const [filterPatterns, setFilterPatterns] = useState<string[]>([]);
  const [filterFvgCounts, setFilterFvgCounts] = useState<number[]>([]);
  const [filterResults, setFilterResults] = useState<string[]>([]);
  const [filterTradeTypes, setFilterTradeTypes] = useState<string[]>([]);
  const [filterNews, setFilterNews] = useState<NewsFilter>("all");
  const [filterDrawdownLevels, setFilterDrawdownLevels] = useState<number[]>([]);
  const [filterDaysOfWeek, setFilterDaysOfWeek] = useState<string[]>([]);

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
    patterns: filterPatterns,
    fvgCounts: filterFvgCounts,
    results: filterResults,
    tradeTypes: filterTradeTypes,
    newsFilter: filterNews,
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
    setFilterPatterns(d.patterns);
    setFilterFvgCounts(d.fvgCounts);
    setFilterResults(d.results);
    setFilterTradeTypes(d.tradeTypes);
    setFilterNews(d.newsFilter);
    setFilterDrawdownLevels(d.drawdownLevels);
    setFilterDaysOfWeek(d.daysOfWeek);
  };

  const allModels = ["M1", "M3", "Continuación"];
  const isModelFiltered = filterModels.length < allModels.length;
  const isPatternFiltered = filterPatterns.length > 0 && filterPatterns.length < 3;
  const hasActiveFilters = filterDateFrom || filterDateTo || isModelFiltered || filterTimeFrom || filterTimeTo || isPatternFiltered;

  const activeFilterLabel = (() => {
    const parts: string[] = [];
    if (filterDateFrom) parts.push(`Desde: ${filterDateFrom.toLocaleDateString("es-ES")}`);
    if (filterDateTo) parts.push(`Hasta: ${filterDateTo.toLocaleDateString("es-ES")}`);
    if (filterTimeFrom) parts.push(`Hora desde: ${filterTimeFrom}`);
    if (filterTimeTo) parts.push(`Hora hasta: ${filterTimeTo}`);
    if (isModelFiltered) parts.push(`Modelos: ${filterModels.join(", ")}`);
    if (isPatternFiltered) parts.push(`Patrón: ${filterPatterns.join(" + ")}`);
    return parts.join(" · ");
  })();

  const filteredTrades = applyFilters(trades);
  const actualTrades = filteredTrades.filter(t => !t.no_trade_day);
  const winningTrades = actualTrades.filter(t => t.result_type === "TP");
  const losingTrades = actualTrades.filter(t => t.result_type === "SL");

  // Ensure consistent chronological order (date + entry_time)
  const sortedActualTrades = [...actualTrades].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    const timeCompare = (a.entry_time || "").localeCompare(b.entry_time || "");
    if (timeCompare !== 0) return timeCompare;
    return a.id.localeCompare(b.id);
  });

  // Calculate main metrics
  const totalPnL = actualTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
  const winRate = actualTrades.length > 0 ? (winningTrades.length / actualTrades.length * 100) : 0;
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0) / winningTrades.length 
    : 0;
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0) / losingTrades.length)
    : 0;
  const expectedValue = avgWin * (winRate / 100) - avgLoss * (1 - winRate / 100);

  // Calculate streaks (best TP streak and worst SL streak)
  let currentTPStreak = 0;
  let bestTPStreak = 0;
  let currentSLStreak = 0;
  let worstSLStreak = 0;

  sortedActualTrades.forEach(trade => {
    if (trade.result_type === "TP") {
      currentTPStreak++;
      currentSLStreak = 0;
      if (currentTPStreak > bestTPStreak) bestTPStreak = currentTPStreak;
    } else if (trade.result_type === "SL") {
      currentSLStreak++;
      currentTPStreak = 0;
      if (currentSLStreak > worstSLStreak) worstSLStreak = currentSLStreak;
    } else {
      currentTPStreak = 0;
      currentSLStreak = 0;
    }
  });

  // Helper function to calculate duration in minutes
  const calculateDurationMinutes = (entryTime: string, exitTime: string): number => {
    const [entryHours, entryMinutes] = entryTime.split(":").map(Number);
    const [exitHours, exitMinutes] = exitTime.split(":").map(Number);
    const entryTotalMinutes = entryHours * 60 + entryMinutes;
    const exitTotalMinutes = exitHours * 60 + exitMinutes;
    return exitTotalMinutes - entryTotalMinutes;
  };

  // Calculate average trade duration in minutes (all trades)
  const tradesWithDuration = actualTrades.filter(t => t.entry_time && t.exit_time);
  const avgDurationMinutes = tradesWithDuration.length > 0
    ? tradesWithDuration.reduce((sum, t) => sum + calculateDurationMinutes(t.entry_time!, t.exit_time!), 0) / tradesWithDuration.length
    : 0;

  // Calculate average duration for TP trades
  const tpTradesWithDuration = winningTrades.filter(t => t.entry_time && t.exit_time);
  const avgDurationTP = tpTradesWithDuration.length > 0
    ? tpTradesWithDuration.reduce((sum, t) => sum + calculateDurationMinutes(t.entry_time!, t.exit_time!), 0) / tpTradesWithDuration.length
    : 0;

  // Calculate average duration for SL trades
  const slTradesWithDuration = losingTrades.filter(t => t.entry_time && t.exit_time);
  const avgDurationSL = slTradesWithDuration.length > 0
    ? slTradesWithDuration.reduce((sum, t) => sum + calculateDurationMinutes(t.entry_time!, t.exit_time!), 0) / slTradesWithDuration.length
    : 0;

  // Calculate win rate by trade type (Compra/Venta)
  const buyTrades = actualTrades.filter(t => t.trade_type?.toLowerCase() === "compra" || t.trade_type?.toLowerCase() === "buy" || t.trade_type?.toLowerCase() === "long");
  const sellTrades = actualTrades.filter(t => t.trade_type?.toLowerCase() === "venta" || t.trade_type?.toLowerCase() === "sell" || t.trade_type?.toLowerCase() === "short");
  const buyWins = buyTrades.filter(t => t.result_type === "TP");
  const sellWins = sellTrades.filter(t => t.result_type === "TP");
  const buyWinRate = buyTrades.length > 0 ? (buyWins.length / buyTrades.length * 100) : 0;
  const sellWinRate = sellTrades.length > 0 ? (sellWins.length / sellTrades.length * 100) : 0;

  // Calculate average drawdown for TP trades
  const tpTradesWithDrawdown = winningTrades.filter(t => t.drawdown !== null && t.drawdown !== undefined);
  const avgDrawdownTP = tpTradesWithDrawdown.length > 0
    ? tpTradesWithDrawdown.reduce((sum, t) => sum + (t.drawdown || 0), 0) / tpTradesWithDrawdown.length
    : 0;

  // Calculate average max RR
  const tradesWithMaxRR = actualTrades.filter(t => t.max_rr !== null && t.max_rr !== undefined);
  const avgMaxRR = tradesWithMaxRR.length > 0
    ? tradesWithMaxRR.reduce((sum, t) => sum + (t.max_rr || 0), 0) / tradesWithMaxRR.length
    : 0;

  // Analysis by entry model
  const modelStats = ["M1", "M3", "Continuación"].map(model => {
    const modelTrades = actualTrades.filter(t => t.entry_model === model || t.entry_model?.toUpperCase() === model.toUpperCase());
    const modelWins = modelTrades.filter(t => t.result_type === "TP");
    const modelPnL = modelTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
    const modelWinRate = modelTrades.length > 0 ? (modelWins.length / modelTrades.length * 100) : 0;
    
    return {
      name: model,
      operaciones: modelTrades.length,
      pnl: modelPnL,
      winRate: modelWinRate
    };
  });

  // Analysis by day of week
  const dayStats = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(day => {
    const dayTrades = actualTrades.filter(t => t.day_of_week?.toLowerCase() === day.toLowerCase());
    const dayPnL = dayTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
    const dayWins = dayTrades.filter(t => t.result_type === "TP");
    const dayWinRate = dayTrades.length > 0 ? (dayWins.length / dayTrades.length * 100) : 0;
    
    return {
      name: day,
      operaciones: dayTrades.length,
      pnl: dayPnL,
      winRate: dayWinRate
    };
  });

  // Analysis by week of month
  const weekStats = [1, 2, 3, 4, 5].map(week => {
    const weekTrades = actualTrades.filter(t => t.week_of_month === week);
    const weekPnL = weekTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
    const weekWins = weekTrades.filter(t => t.result_type === "TP");
    const weekWinRate = weekTrades.length > 0 ? (weekWins.length / weekTrades.length * 100) : 0;
    
    return {
      name: `Semana ${week}`,
      week,
      operaciones: weekTrades.length,
      pnl: weekPnL,
      winRate: weekWinRate
    };
  });

  // Find best and worst performers
  const bestDay = dayStats.reduce((best, current) => 
    current.pnl > best.pnl ? current : best, dayStats[0]);
  const worstDay = dayStats.filter(d => d.operaciones > 0).reduce((worst, current) => 
    current.pnl < worst.pnl ? current : worst, dayStats.find(d => d.operaciones > 0) || dayStats[0]);
  
  const bestWeek = weekStats.reduce((best, current) => 
    current.pnl > best.pnl ? current : best, weekStats[0]);
  const worstWeek = weekStats.filter(w => w.operaciones > 0).reduce((worst, current) => 
    current.pnl < worst.pnl ? current : worst, weekStats.find(w => w.operaciones > 0) || weekStats[0]);
  
  const bestModel = modelStats.reduce((best, current) => 
    current.pnl > best.pnl ? current : best, modelStats[0]);
  const worstModel = modelStats.filter(m => m.operaciones > 0).reduce((worst, current) => 
    current.pnl < worst.pnl ? current : worst, modelStats.find(m => m.operaciones > 0) || modelStats[0]);

  // News analysis
  const tradesWithNews = actualTrades.filter(t => t.had_news);
  const tradesWithoutNews = actualTrades.filter(t => !t.had_news);
  const newsWins = tradesWithNews.filter(t => t.result_type === "TP");
  const noNewsWins = tradesWithoutNews.filter(t => t.result_type === "TP");
  const newsPnL = tradesWithNews.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
  const noNewsPnL = tradesWithoutNews.reduce((sum, t) => sum + (t.result_dollars || 0), 0);
  const newsWinRate = tradesWithNews.length > 0 ? (newsWins.length / tradesWithNews.length * 100) : 0;
  const noNewsWinRate = tradesWithoutNews.length > 0 ? (noNewsWins.length / tradesWithoutNews.length * 100) : 0;

  // Equity curve data
  let cumulative = 0;
  const equityCurveData = sortedActualTrades.map((trade, index) => {
    cumulative += (trade.result_dollars || 0);
    return {
      trade: index + 1,
      equity: cumulative,
      date: trade.date,
      result: trade.result_type
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <p className="text-center text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Análisis y Estadísticas</h1>
            <p className="text-muted-foreground mt-2">
              Métricas detalladas de tu rendimiento en trading
            </p>
          </div>
          <ReportGenerator trades={filteredTrades} filterLabel={hasActiveFilters ? activeFilterLabel : undefined} />
        </div>

        {/* Filters */}
        <DashboardFilters
          dateFrom={filterDateFrom}
          dateTo={filterDateTo}
          selectedModels={filterModels}
          timeFrom={filterTimeFrom}
          timeTo={filterTimeTo}
          patterns={filterPatterns}
          onDateFromChange={setFilterDateFrom}
          onDateToChange={setFilterDateTo}
          onModelsChange={setFilterModels}
          onTimeFromChange={setFilterTimeFrom}
          onTimeToChange={setFilterTimeTo}
          onPatternsChange={setFilterPatterns}
          onClearFilters={clearFilters}
          fvgCounts={filterFvgCounts}
          results={filterResults}
          tradeTypes={filterTradeTypes}
          newsFilter={filterNews}
          drawdownLevels={filterDrawdownLevels}
          daysOfWeek={filterDaysOfWeek}
          onFvgCountsChange={setFilterFvgCounts}
          onResultsChange={setFilterResults}
          onTradeTypesChange={setFilterTradeTypes}
          onNewsFilterChange={setFilterNews}
          onDrawdownLevelsChange={setFilterDrawdownLevels}
          onDaysOfWeekChange={setFilterDaysOfWeek}
        />

        {/* Main Metrics Row 1 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <StatsCard
            title="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            subtitle={`${winningTrades.length} TP / ${losingTrades.length} SL`}
            icon={Target}
            trend={winRate >= 50 ? "up" : "down"}
          />
          <StatsCard
            title="Expected Value"
            value={`$${expectedValue.toFixed(2)}`}
            subtitle="Expectativa por op"
            icon={TrendingUp}
            trend={expectedValue >= 0 ? "up" : "down"}
          />
          <StatsCard
            title="Mejor Racha TP"
            value={bestTPStreak}
            subtitle="Consecutivos ganados"
            icon={Award}
            trend="up"
          />
          <StatsCard
            title="Peor Racha SL"
            value={worstSLStreak}
            subtitle="Consecutivos perdidos"
            icon={Flame}
            trend="down"
          />
          <StatsCard
            title="RR Máximo Prom."
            value={avgMaxRR > 0 ? avgMaxRR.toFixed(2) : "N/A"}
            subtitle={`${tradesWithMaxRR.length} ops`}
            icon={TrendingUp}
            trend="up"
          />
          <StatsCard
            title="Duración Prom."
            value={`${avgDurationMinutes.toFixed(0)} min`}
            subtitle={`${tradesWithDuration.length} ops`}
            icon={Clock}
            trend="neutral"
          />
        </div>

        {/* Best/Worst Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mejor Día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{bestDay?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground">${bestDay?.pnl.toFixed(2)} | WR: {bestDay?.winRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Peor Día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{worstDay?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground">${worstDay?.pnl.toFixed(2)} | WR: {worstDay?.winRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mejor Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{bestWeek?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground">${bestWeek?.pnl.toFixed(2)} | WR: {bestWeek?.winRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Peor Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{worstWeek?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground">${worstWeek?.pnl.toFixed(2)} | WR: {worstWeek?.winRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mejor Modelo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{bestModel?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground">${bestModel?.pnl.toFixed(2)} | WR: {bestModel?.winRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Peor Modelo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{worstModel?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground">${worstModel?.pnl.toFixed(2)} | WR: {worstModel?.winRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Promedio Ganancia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">${avgWin.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{winningTrades.length} operaciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Promedio Pérdida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">${avgLoss.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{losingTrades.length} operaciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">DrawDown Prom. TP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(avgDrawdownTP * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">{tpTradesWithDrawdown.length} TPs</p>
            </CardContent>
          </Card>
        </div>

        {/* Equity Curve */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Equity Curve (Curva de Capital)
            </CardTitle>
            <CardDescription>Evolución del P&L acumulado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trade" label={{ value: 'Operación #', position: 'bottom' }} />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
                  labelFormatter={(label) => `Operación #${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="hsl(var(--chart-1))" 
                  fillOpacity={1} 
                  fill="url(#colorEquity)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Analysis by Entry Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análisis por Modelo de Entrada
            </CardTitle>
            <CardDescription>Rendimiento de cada modelo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="pnl" fill="#8884d8" name="P&L ($)" />
                <Bar yAxisId="right" dataKey="winRate" fill="#82ca9d" name="Win Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Analysis by Day of Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Análisis por Día de la Semana
            </CardTitle>
            <CardDescription>Rendimiento por cada día</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="pnl" fill="#8884d8" name="P&L ($)" />
                <Bar yAxisId="right" dataKey="winRate" fill="#82ca9d" name="Win Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Analysis by Week of Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Análisis por Semana del Mes
            </CardTitle>
            <CardDescription>Rendimiento por semana del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="pnl" fill="#8884d8" name="P&L ($)" />
                <Bar yAxisId="right" dataKey="winRate" fill="#82ca9d" name="Win Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Duration & Win Rate by Type Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Análisis de Duración y Tipo de Operación
            </CardTitle>
            <CardDescription>Tiempo promedio por resultado y win rate por dirección</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Duration Analysis */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-sm">Duración Promedio por Resultado</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Todos los trades</span>
                    <span className="font-bold">{avgDurationMinutes.toFixed(0)} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Cuando es TP
                    </span>
                    <span className="font-bold text-success">{avgDurationTP.toFixed(0)} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Cuando es SL
                    </span>
                    <span className="font-bold text-destructive">{avgDurationSL.toFixed(0)} min</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  TP: {tpTradesWithDuration.length} ops | SL: {slTradesWithDuration.length} ops
                </p>
              </div>
              
              {/* Win Rate by Direction */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-sm">Win Rate por Dirección</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      Compras (Long)
                    </span>
                    <div className="text-right">
                      <span className={`font-bold ${buyWinRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                        {buyWinRate.toFixed(1)}%
                      </span>
                      <p className="text-xs text-muted-foreground">{buyWins.length}/{buyTrades.length} ops</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      Ventas (Short)
                    </span>
                    <div className="text-right">
                      <span className={`font-bold ${sellWinRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                        {sellWinRate.toFixed(1)}%
                      </span>
                      <p className="text-xs text-muted-foreground">{sellWins.length}/{sellTrades.length} ops</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Continuation Subtype Analysis */}
        <ContinuationSubtypeAnalysis trades={filteredTrades} />

        {/* News Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Análisis de Operaciones con Noticias
            </CardTitle>
            <CardDescription>Comparación: Con noticias vs Sin noticias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-sm">Con Noticias</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Operaciones</span>
                    <span className="font-bold">{tradesWithNews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">P&L</span>
                    <span className={`font-bold ${newsPnL >= 0 ? 'text-success' : 'text-destructive'}`}>${newsPnL.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Win Rate</span>
                    <span className="font-bold">{newsWinRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-sm">Sin Noticias</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Operaciones</span>
                    <span className="font-bold">{tradesWithoutNews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">P&L</span>
                    <span className={`font-bold ${noNewsPnL >= 0 ? 'text-success' : 'text-destructive'}`}>${noNewsPnL.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Win Rate</span>
                    <span className="font-bold">{noNewsWinRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Drawdown by Model */}
        <DrawdownByModel trades={filteredTrades} />
      </main>
    </div>
  );
}
