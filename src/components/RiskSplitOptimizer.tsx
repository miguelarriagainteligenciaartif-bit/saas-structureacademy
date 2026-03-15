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

  // Auto-optimize: find the level with max (reaching * newRR)
  const handleAutoOptimize = () => {
    // For each level, calculate total R contribution if 100% is placed there
    const contributions = SPLIT_LEVELS.map((level, i) => {
      return levelStats[i].reaching * levelStats[i].newRR;
    });

    // Find the best single level
    let bestIdx = 0;
    let bestVal = contributions[0];
    for (let i = 1; i < contributions.length; i++) {
      if (contributions[i] > bestVal) {
        bestVal = contributions[i];
        bestIdx = i;
      }
    }

    const newWeights = [0, 0, 0, 0, 0];
    newWeights[bestIdx] = 100;
    setWeights(newWeights);
  };

  // Smart split: allocate proportionally to each level's marginal value
  const handleSmartSplit = () => {
    // Calculate marginal value: for trades that reach exactly this level but not the next
    // This gives a more nuanced split
    const marginalValues = SPLIT_LEVELS.map((level, i) => {
      const nextLevel = i < SPLIT_LEVELS.length - 1 ? SPLIT_LEVELS[i + 1] : 1;
      // Trades that reach this level but NOT the next
      const exclusiveCount = tpTrades.filter(t =>
        t.drawdown >= level && t.drawdown < nextLevel
      ).length;
      // Plus trades that reach this AND all higher levels benefit from better RR
      return levelStats[i].reaching * levelStats[i].newRR;
    });

    const total = marginalValues.reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const newWeights = marginalValues.map(v => Math.round((v / total) * 100));
    // Adjust rounding to sum to 100
    const diff = 100 - newWeights.reduce((a, b) => a + b, 0);
    const maxIdx = newWeights.indexOf(Math.max(...newWeights));
    newWeights[maxIdx] += diff;

    setWeights(newWeights);
  };

  const handleReset = () => setWeights([100, 0, 0, 0, 0]);

  const handleWeightChange = (index: number, value: number) => {
    const newWeights = [...weights];
    const oldValue = newWeights[index];
    const diff = value - oldValue;

    newWeights[index] = value;

    // Distribute the difference proportionally across other non-zero sliders
    const otherIndices = SPLIT_LEVELS.map((_, i) => i).filter(i => i !== index);
    const otherTotal = otherIndices.reduce((sum, i) => sum + newWeights[i], 0);

    if (otherTotal > 0) {
      let remaining = -diff;
      for (const i of otherIndices) {
        const proportion = newWeights[i] / otherTotal;
        const adjustment = Math.round(proportion * remaining);
        newWeights[i] = Math.max(0, newWeights[i] + adjustment);
      }
    } else if (diff < 0) {
      // All others are 0, put remainder in first available
      const firstOther = otherIndices[0];
      newWeights[firstOther] = Math.max(0, -diff);
    }

    // Ensure sum = 100
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
            <Button variant="outline" size="sm" onClick={handleSmartSplit}>
              <Zap className="h-3.5 w-3.5 mr-1" />
              Split Proporcional
            </Button>
            <Button variant="default" size="sm" onClick={handleAutoOptimize}>
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              Auto-Optimizar
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
                step={5}
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
