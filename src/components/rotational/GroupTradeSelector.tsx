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
import { Database, TrendingUp, TrendingDown, Play, Calendar, Filter, CheckSquare, ClipboardPaste, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export interface RealTrade {
  id: string;
  date: string;
  result_type: string;
  result_dollars: number;
  entry_model: string;
  trade_type: string;
}

export type TradeResult = 'TP' | 'SL';

interface GroupTradeSelectorProps {
  onTradesSelected: (trades: TradeResult[]) => void;
  disabled?: boolean;
}

export const GroupTradeSelector = ({ onTradesSelected, disabled = false }: GroupTradeSelectorProps) => {
  const [trades, setTrades] = useState<RealTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());
  const [filterModel, setFilterModel] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectCount, setSelectCount] = useState<number>(10);
  const [pastedSequence, setPastedSequence] = useState<string>("");
  const [manualSequence, setManualSequence] = useState<string>("");

  useEffect(() => {
    loadTrades();
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

  const handleAddFromDatabase = () => {
    const selectedTrades = filteredTrades
      .filter((trade) => selectedTradeIds.has(trade.id))
      .map((trade) => trade.result_type as TradeResult);

    if (selectedTrades.length === 0) {
      toast.error("Selecciona al menos un trade");
      return;
    }

    toast.success(`${selectedTrades.length} trades añadidos a la simulación`);
    onTradesSelected(selectedTrades);
  };

  const parseSequence = (text: string): TradeResult[] | null => {
    const cleaned = text.trim().toUpperCase();
    if (!cleaned) return null;
    
    let parts: string[] = [];
    
    // Try different separators
    if (cleaned.includes(",")) {
      parts = cleaned.split(",").map(s => s.trim());
    } else if (cleaned.includes(";")) {
      parts = cleaned.split(";").map(s => s.trim());
    } else if (cleaned.includes("\n")) {
      parts = cleaned.split("\n").map(s => s.trim());
    } else if (cleaned.includes(" ")) {
      parts = cleaned.split(/\s+/);
    } else {
      // Consecutive like "TPSLTP" or "WWLWL"
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

  const handleAddFromPaste = () => {
    const results = parseSequence(pastedSequence);
    if (!results) {
      toast.error("Formato inválido. Usa: TP,SL,TP o TP SL TP o W,L,W");
      return;
    }
    toast.success(`${results.length} trades añadidos a la simulación`);
    onTradesSelected(results);
  };

  const handleAddFromManual = () => {
    const results = parseSequence(manualSequence);
    if (!results) {
      toast.error("Formato inválido. Usa: TPSLTPSLTP o TP,SL,TP");
      return;
    }
    toast.success(`${results.length} trades añadidos a la simulación`);
    onTradesSelected(results);
  };

  const pastedStats = (() => {
    const results = parseSequence(pastedSequence);
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

  const manualStats = (() => {
    const results = parseSequence(manualSequence);
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

  // Get unique models for filter
  const uniqueModels = [...new Set(trades.map(t => t.entry_model))];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Añadir Trades a la Simulación</CardTitle>
            <CardDescription>
              Selecciona trades desde tu historial, pega desde Excel o escribe manualmente
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="database" className="gap-2 text-xs sm:text-sm">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-2 text-xs sm:text-sm">
              <ClipboardPaste className="h-4 w-4" />
              <span className="hidden sm:inline">Pegar</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2 text-xs sm:text-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Manual</span>
            </TabsTrigger>
          </TabsList>

          {/* Database Tab */}
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
                    {uniqueModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
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
                  className="h-8 text-sm [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 text-sm [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
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
                  Primeros
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={loading}>
                Todos ({filteredTrades.length})
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
              <ScrollArea className="h-[220px] rounded-md border border-border/50 p-2">
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
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedStats.total}</span> sel.
                </span>
                <span className="text-success">TP: {selectedStats.tp}</span>
                <span className="text-destructive">SL: {selectedStats.sl}</span>
                <span className="text-muted-foreground">WR: {winRate}%</span>
              </div>
              <Button
                onClick={handleAddFromDatabase}
                disabled={selectedTradeIds.size === 0 || disabled}
                size="sm"
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Añadir ({selectedStats.total})
              </Button>
            </div>
          </TabsContent>

          {/* Paste Tab */}
          <TabsContent value="paste" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Pegar secuencia desde Excel</Label>
              <Textarea
                placeholder="Pega tu secuencia aquí. Ejemplos:
TP, SL, TP, TP, SL (desde Excel con comas)
TP SL TP TP SL (separados por espacios)
W, L, W, W, L (wins y losses)
1, 0, 1, 1, 0 (1=TP, 0=SL)"
                value={pastedSequence}
                onChange={(e) => setPastedSequence(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Formatos: TP/SL, W/L, WIN/LOSS, 1/0. Separadores: coma, espacio, línea, punto y coma.
              </p>
            </div>

            {pastedSequence.trim() && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{pastedStats.total}</span> trades
                  </span>
                  <span className="text-success">TP: {pastedStats.tp}</span>
                  <span className="text-destructive">SL: {pastedStats.sl}</span>
                  <span className="text-muted-foreground">WR: {pastedStats.winRate}%</span>
                </div>
                <Button
                  onClick={handleAddFromPaste}
                  disabled={pastedStats.total === 0 || disabled}
                  size="sm"
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Añadir ({pastedStats.total})
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Escribir secuencia manual</Label>
              <Input
                placeholder="Ej: TPSLTPSLTP o TP,SL,TP,SL,TP"
                value={manualSequence}
                onChange={(e) => setManualSequence(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Escribe tu secuencia: TPSLTPTP o separado TP,SL,TP,TP
              </p>
            </div>

            {manualSequence.trim() && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{manualStats.total}</span> trades
                  </span>
                  <span className="text-success">TP: {manualStats.tp}</span>
                  <span className="text-destructive">SL: {manualStats.sl}</span>
                  <span className="text-muted-foreground">WR: {manualStats.winRate}%</span>
                </div>
                <Button
                  onClick={handleAddFromManual}
                  disabled={manualStats.total === 0 || disabled}
                  size="sm"
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Añadir ({manualStats.total})
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
