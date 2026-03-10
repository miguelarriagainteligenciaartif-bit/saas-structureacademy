import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Search, Target, ArrowDownRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DrawdownTrade {
  id: string;
  date: string;
  drawdown: number;
  result_type: string;
  result_dollars: number;
  asset: string;
  entry_model: string;
  max_rr: number | null;
}

interface LevelAnalysis {
  level: number;
  label: string;
  tpsReach: number;
  tpsDontReach: number;
  totalTPs: number;
  totalSLs: number;
  reachPercent: number;
  dontReachPercent: number;
  potentialRRGain: string;
  avgOriginalRR: number;
  avgNewRR: number;
  avgRRIncrease: number;
  originalWinRate: number;
  newWinRate: number;
  originalEV: number;
  newEV: number;
  evDelta: number;
  survivingTrades: { id: string; date: string; asset: string; entry_model: string; originalRR: number; newRR: number; rrIncrease: number; drawdown: number }[];
}

const PRESET_LEVELS = [0.33, 0.50, 0.66, 0.75];

export default function Optimization() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);
  const [source, setSource] = useState<string>("journal");
  const [strategies, setStrategies] = useState<{ id: string; name: string; risk_reward_ratio: string }[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [trades, setTrades] = useState<DrawdownTrade[]>([]);
  const [totalSLs, setTotalSLs] = useState<number>(0);
  const [customLevel, setCustomLevel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [journalRR, setJournalRR] = useState<number>(2);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/auth");
        return;
      }
      setUserName(data.user.email?.split("@")[0] || null);
    });
  }, [navigate]);

  // Load strategies for backtest source
  useEffect(() => {
    if (source !== "backtest") return;
    supabase.from("backtest_strategies").select("id, name, risk_reward_ratio").then(({ data }) => {
      setStrategies(data || []);
      if (data && data.length > 0 && !selectedStrategy) {
        setSelectedStrategy(data[0].id);
      }
    });
  }, [source]);

  // Get the base RR for calculations
  const baseRR = useMemo(() => {
    if (source === "journal") return journalRR;
    const strat = strategies.find((s) => s.id === selectedStrategy);
    if (!strat) return 2;
    // risk_reward_ratio format is "1:2" → extract the second number
    const parts = strat.risk_reward_ratio.split(":");
    return parts.length === 2 ? parseFloat(parts[1]) : 2;
  }, [source, journalRR, strategies, selectedStrategy]);

  // Load trades
  useEffect(() => {
    const loadTrades = async () => {
      setLoading(true);
      let query;

      let tpQuery;
      let slQuery;

      if (source === "journal") {
        tpQuery = supabase
          .from("trades")
          .select("id, date, drawdown, result_type, result_dollars, asset, entry_model, max_rr")
          .eq("result_type", "TP")
          .not("drawdown", "is", null);
        slQuery = supabase
          .from("trades")
          .select("id", { count: "exact", head: true })
          .eq("result_type", "SL");
      } else {
        if (!selectedStrategy) {
          setTrades([]);
          setTotalSLs(0);
          setLoading(false);
          return;
        }
        tpQuery = supabase
          .from("backtest_trades")
          .select("id, date, drawdown, result_type, result_dollars, asset, entry_model, max_rr")
          .eq("result_type", "TP")
          .eq("strategy_id", selectedStrategy)
          .not("drawdown", "is", null);
        slQuery = supabase
          .from("backtest_trades")
          .select("id", { count: "exact", head: true })
          .eq("result_type", "SL")
          .eq("strategy_id", selectedStrategy);
      }

      const [tpResult, slResult] = await Promise.all([
        tpQuery.order("date", { ascending: true }),
        slQuery,
      ]);

      if (!tpResult.error && tpResult.data) {
        setTrades(tpResult.data as DrawdownTrade[]);
      }
      setTotalSLs(slResult.count ?? 0);
      setLoading(false);
    };

    loadTrades();
  }, [source, selectedStrategy]);

  // Analysis
  const analyzeLevel = (level: number): LevelAnalysis => {
    const totalTPs = trades.length;
    const newRR = (baseRR + level) / (1 - level);
    
    const surviving = trades
      .filter((t) => t.drawdown >= level)
      .map((t) => ({
        id: t.id,
        date: t.date,
        asset: t.asset,
        entry_model: t.entry_model,
        originalRR: baseRR,
        newRR,
        rrIncrease: newRR - baseRR,
        drawdown: t.drawdown,
      }));

    const tpsReach = surviving.length;
    const tpsDontReach = totalTPs - tpsReach;

    // Win rates
    const originalTotal = totalTPs + totalSLs;
    const originalWinRate = originalTotal > 0 ? (totalTPs / originalTotal) * 100 : 0;
    const newTotal = tpsReach + totalSLs;
    const newWinRate = newTotal > 0 ? (tpsReach / newTotal) * 100 : 0;

    // EV = (WR × RR) - (1 - WR)
    const origWR = originalWinRate / 100;
    const newWR = newWinRate / 100;
    const originalEV = (origWR * baseRR) - (1 - origWR);
    const newEV = (newWR * newRR) - (1 - newWR);

    return {
      level,
      label: `${(level * 100).toFixed(0)}%`,
      tpsReach,
      tpsDontReach,
      totalTPs,
      totalSLs,
      reachPercent: totalTPs > 0 ? (tpsReach / totalTPs) * 100 : 0,
      dontReachPercent: totalTPs > 0 ? (tpsDontReach / totalTPs) * 100 : 0,
      potentialRRGain: `+${(newRR - baseRR).toFixed(2)}R`,
      avgOriginalRR: baseRR,
      avgNewRR: newRR,
      avgRRIncrease: newRR - baseRR,
      originalWinRate,
      newWinRate,
      originalEV,
      newEV,
      evDelta: newEV - originalEV,
      survivingTrades: surviving,
    };
  };

  const presetAnalysis = useMemo(() => PRESET_LEVELS.map(analyzeLevel), [trades, baseRR, totalSLs]);

  const customLevelNum = parseFloat(customLevel);
  const customAnalysis = useMemo(() => {
    if (isNaN(customLevelNum) || customLevelNum <= 0 || customLevelNum >= 1) return null;
    return analyzeLevel(customLevelNum);
  }, [customLevelNum, trades, baseRR, totalSLs]);

  // Best level: highest level where EV improves
  const bestLevel = useMemo(() => {
    for (let i = PRESET_LEVELS.length - 1; i >= 0; i--) {
      const analysis = presetAnalysis[i];
      if (analysis.evDelta > 0) return analysis;
    }
    return null;
  }, [presetAnalysis]);

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} />
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Optimización de Entrada</h1>
          <p className="text-muted-foreground mt-1">
            Analiza el drawdown de tus TPs para determinar si puedes acercar tu entrada al SL y aumentar tu RR.
          </p>
        </div>

        {/* Source Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fuente de Datos</CardTitle>
            <CardDescription>Selecciona de dónde tomar los trades para el análisis</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Select value={source} onValueChange={(v) => { setSource(v); setTrades([]); }}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="journal">Journal (Trades Reales)</SelectItem>
                <SelectItem value="backtest">Backtesting</SelectItem>
              </SelectContent>
            </Select>

            {source === "backtest" && (
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Seleccionar estrategia" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {source === "journal" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">RR de la estrategia:</span>
                <span className="text-sm text-muted-foreground">1:</span>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={journalRR}
                  onChange={(e) => setJournalRR(parseFloat(e.target.value) || 2)}
                  className="w-20 h-8"
                />
              </div>
            )}

            {source === "backtest" && strategies.find(s => s.id === selectedStrategy) && (
              <Badge variant="secondary" className="self-center whitespace-nowrap">
                RR: 1:{baseRR}
              </Badge>
            )}

            <Badge variant="outline" className="self-center whitespace-nowrap">
              {trades.length} TPs · {totalSLs} SLs
            </Badge>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando trades...</div>
        ) : trades.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ArrowDownRight className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay TPs con drawdown registrado</p>
              <p className="text-muted-foreground mt-1">
                Asegúrate de registrar el drawdown en tus trades para usar esta herramienta.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Recommendation */}
            {bestLevel && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="py-5 flex items-start gap-4">
                  <Target className="h-8 w-8 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-lg">Recomendación</p>
                    <p className="text-muted-foreground">
                      Mover tu entrada al <span className="text-foreground font-bold">{bestLevel.label}</span> del recorrido al SL 
                      aumenta tu RR de <span className="font-bold">{bestLevel.avgOriginalRR.toFixed(2)}R</span> a <span className="text-primary font-bold">{bestLevel.avgNewRR.toFixed(2)}R</span>.
                      Tu Win Rate bajaría de <span className="font-bold">{bestLevel.originalWinRate.toFixed(1)}%</span> a <span className="font-bold">{bestLevel.newWinRate.toFixed(1)}%</span>, 
                      pero tu EV mejora de <span className="font-bold">{bestLevel.originalEV.toFixed(3)}</span> a <span className="text-primary font-bold">{bestLevel.newEV.toFixed(3)}</span> (<span className="text-success font-bold">+{bestLevel.evDelta.toFixed(3)}</span>).
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preset Levels Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Análisis por Nivel de Drawdown</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>"Llegan" = TPs cuyo drawdown ≥ nivel → si mueves la entrada ahí, estos trades seguirían siendo TP.</p>
                      <p className="mt-1">"No llegan" = TPs con drawdown &lt; nivel → los perderías al mover la entrada.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription>
                  Cuántos de tus TPs sobreviven si mueves tu punto de entrada a cada nivel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nivel DD</TableHead>
                      <TableHead className="text-center">Supervivencia</TableHead>
                      <TableHead className="text-center">Win Rate</TableHead>
                      <TableHead className="text-center">RR Nuevo</TableHead>
                      <TableHead className="text-center">EV Original</TableHead>
                      <TableHead className="text-center">EV Nuevo</TableHead>
                      <TableHead className="text-center">Δ EV</TableHead>
                      <TableHead className="text-center">Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presetAnalysis.map((a) => (
                      <>
                        <TableRow key={a.level} className={a.evDelta > 0 ? "bg-success/5" : a.evDelta > -0.05 ? "" : "bg-destructive/5"}>
                          <TableCell className="font-bold">{a.label}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={a.reachPercent >= 80 ? "default" : a.reachPercent >= 60 ? "secondary" : "destructive"}>
                              {a.tpsReach}/{a.totalTPs} ({a.reachPercent.toFixed(1)}%)
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-muted-foreground line-through">{a.originalWinRate.toFixed(1)}%</span>
                              <span className="font-mono font-bold">{a.newWinRate.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-primary">
                            {a.avgNewRR.toFixed(2)}R
                          </TableCell>
                          <TableCell className="text-center font-mono text-muted-foreground">
                            {a.originalEV.toFixed(3)}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold">
                            {a.newEV.toFixed(3)}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold">
                            <span className={a.evDelta > 0 ? "text-success" : "text-destructive"}>
                              {a.evDelta > 0 ? "+" : ""}{a.evDelta.toFixed(3)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedLevel(expandedLevel === a.level ? null : a.level)}
                              disabled={a.survivingTrades.length === 0}
                            >
                              {expandedLevel === a.level ? "Ocultar" : `Ver ${a.survivingTrades.length}`}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedLevel === a.level && a.survivingTrades.length > 0 && (
                          <TableRow key={`${a.level}-detail`}>
                            <TableCell colSpan={8} className="p-0">
                              <div className="bg-muted/30 p-4">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Fecha</TableHead>
                                      <TableHead>Activo</TableHead>
                                      <TableHead>Modelo</TableHead>
                                      <TableHead className="text-center">DD</TableHead>
                                      <TableHead className="text-center">RR Original</TableHead>
                                      <TableHead className="text-center">RR Nuevo</TableHead>
                                      <TableHead className="text-center">Δ RR</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {a.survivingTrades.map((t) => (
                                      <TableRow key={t.id}>
                                        <TableCell className="text-sm">{t.date}</TableCell>
                                        <TableCell className="text-sm">{t.asset}</TableCell>
                                        <TableCell className="text-sm">{t.entry_model}</TableCell>
                                        <TableCell className="text-center text-sm">{(t.drawdown * 100).toFixed(0)}%</TableCell>
                                        <TableCell className="text-center font-mono text-sm">{t.originalRR.toFixed(2)}R</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-primary text-sm">{t.newRR.toFixed(2)}R</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-success text-sm">+{t.rrIncrease.toFixed(2)}R</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>

            {/* Custom Level */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Consultar Nivel Personalizado
                </CardTitle>
                <CardDescription>Ingresa un nivel de drawdown específico para analizar (entre 0.01 y 0.99)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 max-w-xs">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="0.99"
                      placeholder="Ej: 0.40"
                      value={customLevel}
                      onChange={(e) => setCustomLevel(e.target.value)}
                    />
                  </div>
                </div>

                {customAnalysis && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Supervivencia</p>
                          <p className="text-2xl font-bold text-success">{customAnalysis.tpsReach}/{customAnalysis.totalTPs}</p>
                          <p className="text-xs text-muted-foreground">{customAnalysis.reachPercent.toFixed(1)}%</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                          <p className="text-xs text-muted-foreground line-through">{customAnalysis.originalWinRate.toFixed(1)}%</p>
                          <p className="text-2xl font-bold">{customAnalysis.newWinRate.toFixed(1)}%</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <p className="text-xs text-muted-foreground mb-1">RR Nuevo</p>
                          <p className="text-xs text-muted-foreground line-through">{customAnalysis.avgOriginalRR.toFixed(2)}R</p>
                          <p className="text-2xl font-bold text-primary">{customAnalysis.avgNewRR.toFixed(2)}R</p>
                        </CardContent>
                      </Card>
                      <Card className={customAnalysis.evDelta > 0 ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}>
                        <CardContent className="pt-4 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Δ EV</p>
                          <p className="text-xs text-muted-foreground">{customAnalysis.originalEV.toFixed(3)} → {customAnalysis.newEV.toFixed(3)}</p>
                          <p className={`text-2xl font-bold ${customAnalysis.evDelta > 0 ? "text-success" : "text-destructive"}`}>
                            {customAnalysis.evDelta > 0 ? "+" : ""}{customAnalysis.evDelta.toFixed(3)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {customAnalysis.survivingTrades.length > 0 && (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Activo</TableHead>
                              <TableHead>Modelo</TableHead>
                              <TableHead className="text-center">DD</TableHead>
                              <TableHead className="text-center">RR Original</TableHead>
                              <TableHead className="text-center">RR Nuevo</TableHead>
                              <TableHead className="text-center">Δ RR</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customAnalysis.survivingTrades.map((t) => (
                              <TableRow key={t.id}>
                                <TableCell className="text-sm">{t.date}</TableCell>
                                <TableCell className="text-sm">{t.asset}</TableCell>
                                <TableCell className="text-sm">{t.entry_model}</TableCell>
                                <TableCell className="text-center text-sm">{(t.drawdown * 100).toFixed(0)}%</TableCell>
                                <TableCell className="text-center font-mono text-sm">{t.originalRR.toFixed(2)}R</TableCell>
                                <TableCell className="text-center font-mono font-bold text-primary text-sm">{t.newRR.toFixed(2)}R</TableCell>
                                <TableCell className="text-center font-mono font-bold text-success text-sm">+{t.rrIncrease.toFixed(2)}R</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Cómo interpretar estos datos?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Drawdown</strong> es cuánto recorre el precio hacia tu SL antes de ir al TP. 
                  Un drawdown de 0.33 significa que el precio recorrió el 33% del camino hacia el SL.
                </p>
                <p>
                  <strong className="text-foreground">Supervivencia</strong> = TPs cuyo drawdown ≥ nivel. Si mueves la entrada ahí, estos trades seguirían siendo TP. Los que no llegan se pierden.
                </p>
                <p>
                  <strong className="text-foreground">Win Rate</strong> = TPs supervivientes / (TPs supervivientes + SLs). 
                  Los SL se mantienen todos; solo disminuyen los TPs que no alcanzan el nivel.
                </p>
                <p>
                  <strong className="text-foreground">EV (Expected Value)</strong> = (WR × RR) − (1 − WR). 
                  Si el EV nuevo es mayor que el original, <strong className="text-success">merece la pena</strong> mover la entrada.
                </p>
                <p>
                  <strong className="text-primary">Busca el nivel donde el Δ EV sea positivo</strong> — eso significa que el aumento de RR compensa la pérdida de Win Rate.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
