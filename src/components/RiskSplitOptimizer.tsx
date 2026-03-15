import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Zap, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  drawdown: number;
  result_type: string;
}

interface RiskSplitOptimizerProps {
  tpTrades: Trade[];
  slCount: number;
  baseRR: number;
}

const SPLIT_LEVELS = [0, 0.33, 0.50, 0.66, 0.75];

function getNewRR(baseRR: number, level: number): number {
  if (level === 0) return baseRR;
  return (baseRR + level) / (1 - level);
}

function getLevelLabel(level: number): string {
  if (level === 0) return "Original (0%)";
  return `${(level * 100).toFixed(0)}%`;
}

export function RiskSplitOptimizer({ tpTrades, slCount, baseRR }: RiskSplitOptimizerProps) {
  // Weights as percentages (0-100), must sum to 100
  const [weights, setWeights] = useState<number[]>([100, 0, 0, 0, 0]);

  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Precompute: for each level, how many TPs reach it
  const levelStats = useMemo(() => {
    return SPLIT_LEVELS.map((level) => {
      const reaching = tpTrades.filter(t => t.drawdown >= level).length;
      const newRR = getNewRR(baseRR, level);
      return { level, reaching, newRR };
    });
  }, [tpTrades, baseRR]);

  // Calculate total R with current split
  const analysis = useMemo(() => {
    const w = weights.map(v => v / 100); // normalize to 0-1

    // For each TP trade, calculate its R contribution
    let totalTPContribution = 0;
    for (const trade of tpTrades) {
      let tradeR = 0;
      for (let i = 0; i < SPLIT_LEVELS.length; i++) {
        if (trade.drawdown >= SPLIT_LEVELS[i]) {
          tradeR += w[i] * levelStats[i].newRR;
        }
        // If drawdown < level, that portion doesn't get filled — no gain, no loss
      }
      totalTPContribution += tradeR;
    }

    // For each SL trade, ALL portions get filled and lose
    // Loss per SL = sum of all weights = 1R (if weights sum to 100%)
    const totalSLLoss = slCount * 1; // always 1R per SL regardless of split

    const totalR = totalTPContribution - totalSLLoss;

    // Compare to baseline (100% at original entry)
    const baselineTotalR = tpTrades.length * baseRR - slCount;

    return {
      totalTPContribution,
      totalSLLoss,
      totalR,
      baselineTotalR,
      delta: totalR - baselineTotalR,
    };
  }, [weights, tpTrades, slCount, baseRR, levelStats]);

  // Round to nearest 10 for practical execution
  const roundToTen = (weights: number[]): number[] => {
    const rounded = weights.map(w => Math.round(w / 10) * 10);
    // Fix sum to 100
    let diff = 100 - rounded.reduce((a, b) => a + b, 0);
    while (diff !== 0) {
      // Find the weight with largest rounding error to adjust
      const errors = weights.map((w, i) => ({ i, error: w - rounded[i] }));
      errors.sort((a, b) => diff > 0 ? b.error - a.error : a.error - b.error);
      for (const { i } of errors) {
        if (diff > 0 && rounded[i] < 100) { rounded[i] += 10; diff -= 10; break; }
        if (diff < 0 && rounded[i] > 0) { rounded[i] -= 10; diff += 10; break; }
      }
    }
    return rounded.map(w => Math.max(0, Math.min(100, w)));
  };

  // Auto-optimize: best single level (100% concentration)
  const handleAutoOptimize = () => {
    const contributions = SPLIT_LEVELS.map((_, i) => levelStats[i].reaching * levelStats[i].newRR);
    let bestIdx = 0;
    for (let i = 1; i < contributions.length; i++) {
      if (contributions[i] > contributions[bestIdx]) bestIdx = i;
    }
    const newWeights = [0, 0, 0, 0, 0];
    newWeights[bestIdx] = 100;
    setWeights(newWeights);
  };

  // Smart split: allocate based on EV per unit risk at each level, rounded to 10s
  const handleSmartSplit = () => {
    const totalTrades = tpTrades.length + slCount;
    if (totalTrades === 0) return;

    // EV per unit risk at each level
    const evPerUnit = SPLIT_LEVELS.map((_, i) => {
      const pTP = levelStats[i].reaching / totalTrades;
      const pSL = slCount / totalTrades;
      return pTP * levelStats[i].newRR - pSL;
    });

    // Only allocate to levels with positive EV
    const positiveEVs = evPerUnit.map(ev => Math.max(0, ev));
    const total = positiveEVs.reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const raw = positiveEVs.map(v => (v / total) * 100);
    setWeights(roundToTen(raw));
  };

  // Equal split across all 5 levels
  const handleEqualSplit = () => setWeights([20, 20, 20, 20, 20]);

  const handleReset = () => setWeights([100, 0, 0, 0, 0]);

  const handleWeightChange = (index: number, value: number) => {
    // Snap to multiples of 10
    const snapped = Math.round(value / 10) * 10;
    const newWeights = [...weights];
    const oldValue = newWeights[index];
    const diff = snapped - oldValue;
    if (diff === 0) return;

    newWeights[index] = snapped;

    // Distribute the difference across other sliders
    const otherIndices = SPLIT_LEVELS.map((_, i) => i).filter(i => i !== index);
    const otherTotal = otherIndices.reduce((sum, i) => sum + newWeights[i], 0);

    if (otherTotal > 0) {
      let remaining = -diff;
      for (const i of otherIndices) {
        const proportion = newWeights[i] / otherTotal;
        const adj = Math.round((proportion * remaining) / 10) * 10;
        newWeights[i] = Math.max(0, newWeights[i] + adj);
      }
    } else if (diff < 0) {
      newWeights[otherIndices[0]] = Math.max(0, -diff);
    }

    // Fix sum to 100
    const sum = newWeights.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      const adjustIdx = otherIndices.find(i => newWeights[i] > 0) ?? index;
      newWeights[adjustIdx] += 100 - sum;
    }

    setWeights(newWeights.map(w => Math.max(0, w)));
  };

  const isImproved = analysis.delta > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              Split de Riesgo por Niveles
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Divide tu 1% de riesgo entre múltiples órdenes límite a diferentes niveles de retroceso.</p>
                  <p className="mt-1">Las porciones en niveles que el precio no alcanza simplemente no se llenan (no pierdes esa porción).</p>
                  <p className="mt-1">En los SL, todas las órdenes se llenan porque el precio recorre el 100%.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Divide tu riesgo entre niveles de entrada para maximizar tus R basándote en datos reales
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleEqualSplit}>
              20-20-20-20-20
            </Button>
            <Button variant="outline" size="sm" onClick={handleSmartSplit}>
              <Zap className="h-3.5 w-3.5 mr-1" />
              Split Óptimo
            </Button>
            <Button variant="default" size="sm" onClick={handleAutoOptimize}>
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              Mejor Nivel Único
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sliders */}
        <div className="space-y-5">
          {SPLIT_LEVELS.map((level, i) => (
            <div key={level} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-28">{getLevelLabel(level)}</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    RR: {levelStats[i].newRR.toFixed(2)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {levelStats[i].reaching}/{tpTrades.length} TPs llegan
                  </span>
                </div>
                <span className="font-mono font-bold text-base w-12 text-right">
                  {weights[i]}%
                </span>
              </div>
              <Slider
                value={[weights[i]]}
                onValueChange={([v]) => handleWeightChange(i, v)}
                max={100}
                min={0}
                step={10}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {/* Weight validation */}
        {totalWeight !== 100 && (
          <Badge variant="destructive" className="text-sm">
            ⚠️ Los pesos suman {totalWeight}% — deben sumar 100%
          </Badge>
        )}

        {/* Results comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">P&L Original (100% nivel 0)</p>
              <p className="text-2xl font-bold font-mono">{analysis.baselineTotalR.toFixed(2)}R</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">P&L con Split Actual</p>
              <p className="text-2xl font-bold font-mono text-primary">{analysis.totalR.toFixed(2)}R</p>
            </CardContent>
          </Card>
          <Card className={cn(
            isImproved ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
          )}>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Diferencia</p>
              <div className="flex items-center justify-center gap-1">
                {isImproved ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
                <p className={cn(
                  "text-2xl font-bold font-mono",
                  isImproved ? "text-success" : "text-destructive"
                )}>
                  {analysis.delta > 0 ? "+" : ""}{analysis.delta.toFixed(2)}R
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed breakdown table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nivel</TableHead>
                <TableHead className="text-center">% Riesgo</TableHead>
                <TableHead className="text-center">RR</TableHead>
                <TableHead className="text-center">TPs que llegan</TableHead>
                <TableHead className="text-center">R aportadas (TPs)</TableHead>
                <TableHead className="text-center">R perdidas (SLs)</TableHead>
                <TableHead className="text-center">R Netas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SPLIT_LEVELS.map((level, i) => {
                const w = weights[i] / 100;
                const tpR = levelStats[i].reaching * w * levelStats[i].newRR;
                const slR = slCount * w;
                const netR = tpR - slR;
                return (
                  <TableRow key={level} className={weights[i] === 0 ? "opacity-40" : ""}>
                    <TableCell className="font-semibold">{getLevelLabel(level)}</TableCell>
                    <TableCell className="text-center font-mono font-bold">{weights[i]}%</TableCell>
                    <TableCell className="text-center font-mono text-primary">{levelStats[i].newRR.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{levelStats[i].reaching}/{tpTrades.length}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-success">+{tpR.toFixed(2)}R</TableCell>
                    <TableCell className="text-center font-mono text-destructive">-{slR.toFixed(2)}R</TableCell>
                    <TableCell className={cn(
                      "text-center font-mono font-bold",
                      netR > 0 ? "text-success" : "text-destructive"
                    )}>
                      {netR > 0 ? "+" : ""}{netR.toFixed(2)}R
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="border-t-2 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-center font-mono">{totalWeight}%</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-mono text-success">
                  +{analysis.totalTPContribution.toFixed(2)}R
                </TableCell>
                <TableCell className="text-center font-mono text-destructive">
                  -{analysis.totalSLLoss.toFixed(2)}R
                </TableCell>
                <TableCell className={cn(
                  "text-center font-mono",
                  analysis.totalR > 0 ? "text-success" : "text-destructive"
                )}>
                  {analysis.totalR > 0 ? "+" : ""}{analysis.totalR.toFixed(2)}R
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Explanation */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong className="text-foreground">¿Cómo funciona?</strong> Divides tu 1% de riesgo entre órdenes límite a distintos niveles.</p>
          <p>• En un <strong>TP</strong>: solo las órdenes en niveles que el precio alcanzó (drawdown ≥ nivel) se llenan y ganan a su RR mejorado. Las que no se alcanzan no se activan.</p>
          <p>• En un <strong>SL</strong>: todas las órdenes se llenan (el precio recorre 100%), por lo que pierdes el 100% del riesgo asignado.</p>
          <p>• <strong>Auto-Optimizar</strong> pone el 100% en el nivel que históricamente genera más R. <strong>Split Proporcional</strong> distribuye según el valor esperado de cada nivel.</p>
        </div>
      </CardContent>
    </Card>
  );
}
