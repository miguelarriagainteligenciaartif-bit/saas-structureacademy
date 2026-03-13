import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Database, TrendingUp, TrendingDown, Plus, Calendar, Filter, CheckSquare, ClipboardPaste, FlaskConical, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradeResult } from "@/utils/flipX5Simulator";
import { toast } from "sonner";

export interface RealTrade {
  id: string;
  date: string;
  result_type: string;
  result_dollars: number;
  entry_model: string;
  trade_type: string;
}

interface BacktestStrategy {
  id: string;
  name: string;
  risk_reward_ratio: string;
}

interface BacktestTrade {
  id: string;
  date: string;
  result_type: string;
  result_dollars: number;
  entry_model: string;
  no_trade_day: boolean;
}

interface FlipTradeSelectorProps {
  onTradesSelected: (trades: TradeResult[], amounts?: number[]) => void;
}

export const FlipTradeSelector = ({ onTradesSelected }: FlipTradeSelectorProps) => {
  const [trades, setTrades] = useState<RealTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());
  const [filterModel, setFilterModel] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectCount, setSelectCount] = useState<number>(10);
  const [pastedSequence, setPastedSequence] = useState<string>("");

  // Backtest state
  const [btStrategies, setBtStrategies] = useState<BacktestStrategy[]>([]);
  const [btSelectedStrategy, setBtSelectedStrategy] = useState<string>("");
  const [btTrades, setBtTrades] = useState<BacktestTrade[]>([]);
  const [btLoading, setBtLoading] = useState(false);
  const [btSelectedIds, setBtSelectedIds] = useState<Set<string>>(new Set());
  const [btFilterModel, setBtFilterModel] = useState<string>("all");

  useEffect(() => {
    loadTrades();
    loadStrategies();
  }, []);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("id, date, result_type, result_dollars, entry_model, trade_type")
        .eq("no_trade_day", false)
        .in("result_type", ["TP", "SL"])
        .order("date", { ascending: true })
        .order("entry_time", { ascending: true });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error("Error loading trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from("backtest_strategies")
        .select("id, name, risk_reward_ratio")
        .order("name");

      if (error) throw error;
      setBtStrategies(data || []);
    } catch (error) {
      console.error("Error loading strategies:", error);
    }
  };

  const loadBacktestTrades = async (strategyId: string) => {
    setBtLoading(true);
    setBtSelectedIds(new Set());
    try {
      const { data, error } = await supabase
        .from("backtest_trades")
        .select("id, date, result_type, result_dollars, entry_model, no_trade_day")
        .eq("strategy_id", strategyId)
        .eq("no_trade_day", false)
        .in("result_type", ["TP", "SL"])
        .order("date", { ascending: true })
        .order("entry_time", { ascending: true });

      if (error) throw error;
      setBtTrades(data || []);
    } catch (error) {
      console.error("Error loading backtest trades:", error);
    } finally {
      setBtLoading(false);
    }
  };

  const handleStrategyChange = (strategyId: string) => {
    setBtSelectedStrategy(strategyId);
    if (strategyId) {
      loadBacktestTrades(strategyId);
    } else {
      setBtTrades([]);
    }
  };

  const filteredBtTrades = btTrades.filter((t) => {
    if (btFilterModel !== "all" && t.entry_model !== btFilterModel) return false;
    return true;
  });

  const handleBtToggle = (id: string) => {
    const newSet = new Set(btSelectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setBtSelectedIds(newSet);
  };

  const handleBtSelectAll = () => {
    setBtSelectedIds(new Set(filteredBtTrades.map(t => t.id)));
  };

  const handleBtAddTrades = () => {
    const selectedTrades = filteredBtTrades.filter(t => btSelectedIds.has(t.id));
    const results = selectedTrades.map(t => t.result_type as TradeResult);
    const amounts = selectedTrades.map(t => Number(t.result_dollars));
    toast.success(`Agregados ${results.length} trades de backtesting`);
    onTradesSelected(results, amounts);
    setBtSelectedIds(new Set());
  };

  const btSelectedStats = {
    total: btSelectedIds.size,
    tp: filteredBtTrades.filter(t => btSelectedIds.has(t.id) && t.result_type === "TP").length,
    sl: filteredBtTrades.filter(t => btSelectedIds.has(t.id) && t.result_type === "SL").length,
  };
  const btWinRate = btSelectedStats.total > 0 ? ((btSelectedStats.tp / btSelectedStats.total) * 100).toFixed(1) : "0";

  // --- Original dashboard logic (unchanged) ---

  const filteredTrades = trades.filter((trade) => {
    if (filterModel !== "all" && trade.entry_model !== filterModel) return false;
    if (filterResult !== "all" && trade.result_type !== filterResult) return false;
    if (dateFrom && trade.date < dateFrom) return false;
    if (dateTo && trade.date > dateTo) return false;
    return true;
  });

  const handleToggleTrade = (tradeId: string) => {
    const newSelected = new Set(selectedTradeIds);
    if (newSelected.has(tradeId)) {
      newSelected.delete(tradeId);
    } else {
      newSelected.add(tradeId);
    }
    setSelectedTradeIds(newSelected);
  };

  const handleSelectFirst = (count: number) => {
    const newSelected = new Set<string>();
    filteredTrades.slice(0, count).forEach((trade) => {
      newSelected.add(trade.id);
    });
    setSelectedTradeIds(newSelected);
  };

  const handleSelectAll = () => {
    const newSelected = new Set<string>();
    filteredTrades.forEach((trade) => {
      newSelected.add(trade.id);
    });
    setSelectedTradeIds(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedTradeIds(new Set());
  };

  const handleAddTrades = () => {
    const selectedTrades = filteredTrades
      .filter((trade) => selectedTradeIds.has(trade.id));
    const results = selectedTrades.map((trade) => trade.result_type as TradeResult);
    const amounts = selectedTrades.map((trade) => Number(trade.result_dollars));

    toast.success(`Agregados ${results.length} trades`);
    onTradesSelected(results, amounts);
    setSelectedTradeIds(new Set());
  };

  const parsePastedSequence = (text: string): TradeResult[] | null => {
    const cleaned = text.trim().toUpperCase();
    
    let parts: string[] = [];
    if (cleaned.includes(",")) {
      parts = cleaned.split(",").map(s => s.trim());
    } else if (cleaned.includes(";")) {
      parts = cleaned.split(";").map(s => s.trim());
    } else if (cleaned.includes("\n")) {
      parts = cleaned.split("\n").map(s => s.trim());
    } else if (cleaned.includes(" ")) {
      parts = cleaned.split(/\s+/);
    } else {
      const matches = cleaned.match(/(TP|SL|W|L)/g);
      if (matches) {
        parts = matches;
      }
    }

    const validResults: TradeResult[] = [];
    for (const part of parts) {
      if (part === "TP" || part === "W" || part === "WIN" || part === "1") {
        validResults.push("TP");
      } else if (part === "SL" || part === "L" || part === "LOSS" || part === "0") {
        validResults.push("SL");
      } else if (part !== "") {
        return null;
      }
    }

    return validResults.length > 0 ? validResults : null;
  };

  const handleAddPasted = () => {
    const results = parsePastedSequence(pastedSequence);
    if (!results) {
      toast.error("Formato inválido. Usa: TP,SL,TP o TP SL TP o W,L,W");
      return;
    }
    if (results.length === 0) {
      toast.error("No se encontraron trades válidos");
      return;
    }
    toast.success(`Agregados ${results.length} trades`);
    onTradesSelected(results);
    setPastedSequence("");
  };

  const pastedStats = (() => {
    const results = parsePastedSequence(pastedSequence);
    if (!results) return { total: 0, tp: 0, sl: 0, winRate: "0" };
    const tp = results.filter(r => r === "TP").length;
    const sl = results.filter(r => r === "SL").length;
    return {
      total: results.length,
      tp,
      sl,
      winRate: results.length > 0 ? ((tp / results.length) * 100).toFixed(1) : "0"
    };
  })();

  const selectedStats = {
    total: selectedTradeIds.size,
    tp: filteredTrades.filter((t) => selectedTradeIds.has(t.id) && t.result_type === "TP").length,
    sl: filteredTrades.filter((t) => selectedTradeIds.has(t.id) && t.result_type === "SL").length,
  };

  const winRate = selectedStats.total > 0 ? ((selectedStats.tp / selectedStats.total) * 100).toFixed(1) : "0";

  return (
    <Card className="border-border/50 bg-card/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Importar Trades</CardTitle>
            <CardDescription>
              Usa tus trades registrados, de backtesting o pega una secuencia
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="database" className="gap-2">
              <Database className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="backtest" className="gap-2">
              <FlaskConical className="h-4 w-4" />
              Backtesting
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-2">
              <ClipboardPaste className="h-4 w-4" />
              Pegar
            </TabsTrigger>
          </TabsList>

          {/* === BACKTEST TAB === */}
          <TabsContent value="backtest" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Estrategia de Backtesting</Label>
                <Select value={btSelectedStrategy} onValueChange={handleStrategyChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecciona una estrategia" />
                  </SelectTrigger>
                  <SelectContent>
                    {btStrategies.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} (R:R {s.risk_reward_ratio})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Modelo
                </Label>
                <Select value={btFilterModel} onValueChange={setBtFilterModel}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="M1">M1</SelectItem>
                    <SelectItem value="M3">M3</SelectItem>
                    <SelectItem value="Continuación">Continuación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {btSelectedStrategy && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleBtSelectAll} disabled={btLoading || filteredBtTrades.length === 0}>
                    Seleccionar todos ({filteredBtTrades.length})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setBtSelectedIds(new Set())} disabled={btSelectedIds.size === 0}>
                    Limpiar
                  </Button>
                </div>

                {btLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando trades de backtesting...</div>
                ) : filteredBtTrades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay trades TP/SL en esta estrategia
                  </div>
                ) : (
                  <ScrollArea className="h-[200px] rounded-md border border-border/50 p-2">
                    <div className="space-y-1">
                      {filteredBtTrades.map((trade, index) => (
                        <div
                          key={trade.id}
                          onClick={() => handleBtToggle(trade.id)}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                            btSelectedIds.has(trade.id)
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={btSelectedIds.has(trade.id)}
                              onCheckedChange={() => handleBtToggle(trade.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>
                            <span className="text-sm font-mono">{trade.date}</span>
                            <Badge variant="outline" className="text-xs">
                              {trade.entry_model}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {trade.result_type === "TP" ? (
                              <div className="flex items-center gap-1 text-success">
                                <TrendingUp className="h-3 w-3" />
                                <span className="text-sm font-medium">TP</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-destructive">
                                <TrendingDown className="h-3 w-3" />
                                <span className="text-sm font-medium">SL</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Seleccionados: <span className="font-medium text-foreground">{btSelectedStats.total}</span>
                    </span>
                    <span className="text-success">TP: {btSelectedStats.tp}</span>
                    <span className="text-destructive">SL: {btSelectedStats.sl}</span>
                    <span className="text-muted-foreground">
                      Win Rate: <span className="font-medium text-foreground">{btWinRate}%</span>
                    </span>
                  </div>
                  <Button
                    onClick={handleBtAddTrades}
                    disabled={btSelectedIds.size === 0}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar {btSelectedStats.total} trades
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* === DASHBOARD TAB (original) === */}
          <TabsContent value="database" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Modelo
                </Label>
                <Select value={filterModel} onValueChange={setFilterModel}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="M1">M1</SelectItem>
                    <SelectItem value="M3">M3</SelectItem>
                    <SelectItem value="Continuación">Continuación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Resultado</Label>
                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="TP">Solo TP</SelectItem>
                    <SelectItem value="SL">Solo SL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Desde
                </Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Quick selection */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={filteredTrades.length}
                  value={selectCount}
                  onChange={(e) => setSelectCount(Math.min(Number(e.target.value), filteredTrades.length))}
                  className="h-8 w-20 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectFirst(selectCount)}
                  disabled={loading || filteredTrades.length === 0}
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Seleccionar primeros
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={loading}>
                Seleccionar todos ({filteredTrades.length})
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearSelection} disabled={selectedTradeIds.size === 0}>
                Limpiar
              </Button>
            </div>

            {/* Trades list */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando trades...</div>
            ) : filteredTrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay trades que coincidan con los filtros
              </div>
            ) : (
              <ScrollArea className="h-[200px] rounded-md border border-border/50 p-2">
                <div className="space-y-1">
                  {filteredTrades.map((trade, index) => (
                    <div
                      key={trade.id}
                      onClick={() => handleToggleTrade(trade.id)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                        selectedTradeIds.has(trade.id)
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedTradeIds.has(trade.id)}
                          onCheckedChange={() => handleToggleTrade(trade.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>
                        <span className="text-sm font-mono">{trade.date}</span>
                        <Badge variant="outline" className="text-xs">
                          {trade.entry_model}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {trade.result_type === "TP" ? (
                          <div className="flex items-center gap-1 text-success">
                            <TrendingUp className="h-3 w-3" />
                            <span className="text-sm font-medium">TP</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-destructive">
                            <TrendingDown className="h-3 w-3" />
                            <span className="text-sm font-medium">SL</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Selection summary and action */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Seleccionados: <span className="font-medium text-foreground">{selectedStats.total}</span>
                </span>
                <span className="text-success">
                  TP: {selectedStats.tp}
                </span>
                <span className="text-destructive">
                  SL: {selectedStats.sl}
                </span>
                <span className="text-muted-foreground">
                  Win Rate: <span className="font-medium text-foreground">{winRate}%</span>
                </span>
              </div>
              <Button
                onClick={handleAddTrades}
                disabled={selectedTradeIds.size === 0}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar {selectedStats.total} trades
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Pegar secuencia de trades</Label>
              <Textarea
                placeholder="Pega tu secuencia aquí. Ejemplos:
TP, SL, TP, TP, SL
TP SL TP TP SL  
W, L, W, W, L
1, 0, 1, 1, 0"
                value={pastedSequence}
                onChange={(e) => setPastedSequence(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Formatos soportados: TP/SL, W/L, WIN/LOSS, 1/0. Separadores: coma, espacio, línea nueva, punto y coma.
              </p>
            </div>

            {pastedSequence.trim() && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Detectados: <span className="font-medium text-foreground">{pastedStats.total}</span>
                  </span>
                  <span className="text-success">
                    TP: {pastedStats.tp}
                  </span>
                  <span className="text-destructive">
                    SL: {pastedStats.sl}
                  </span>
                  <span className="text-muted-foreground">
                    Win Rate: <span className="font-medium text-foreground">{pastedStats.winRate}%</span>
                  </span>
                </div>
                <Button
                  onClick={handleAddPasted}
                  disabled={pastedStats.total === 0}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar {pastedStats.total} trades
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
