import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AllTrade {
  id: string;
  date: string;
  drawdown: number | null;
  result_type: string;
}

interface Props {
  allTrades: AllTrade[];
  baseRR: number;
  presetLevels: number[];
}

export function OptimizationPnLChart({ allTrades, baseRR, presetLevels }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<string>(presetLevels[0]?.toString() || "0.33");
  const level = parseFloat(selectedLevel);
  const newRR = (baseRR + level) / (1 - level);

  const { chartData, originalTotal, newTotal, deltaR, originalTradeCount, newTradeCount } = useMemo(() => {
    // Sort trades chronologically
    const sorted = [...allTrades].sort((a, b) => a.date.localeCompare(b.date));

    let origCumulative = 0;
    let newCumulative = 0;
    let origCount = 0;
    let newCount = 0;

    const data = sorted.map((trade, i) => {
      if (trade.result_type === "SL") {
        // SLs always count in both scenarios
        origCumulative -= 1;
        newCumulative -= 1;
        origCount++;
        newCount++;
      } else if (trade.result_type === "TP") {
        // Original: all TPs count
        origCumulative += baseRR;
        origCount++;

        // New: only TPs with drawdown >= level survive
        if (trade.drawdown !== null && trade.drawdown >= level) {
          newCumulative += newRR;
          newCount++;
        }
        // TPs that don't reach: trader never enters, so no gain and no loss
      }

      return {
        index: i + 1,
        date: trade.date,
        original: parseFloat(origCumulative.toFixed(2)),
        optimized: parseFloat(newCumulative.toFixed(2)),
      };
    });

    return {
      chartData: data,
      originalTotal: origCumulative,
      newTotal: newCumulative,
      deltaR: newCumulative - origCumulative,
      originalTradeCount: origCount,
      newTradeCount: newCount,
    };
  }, [allTrades, baseRR, level, newRR]);

  if (allTrades.length === 0) return null;

  const isPositive = deltaR > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Comparativa P&L (en R)</CardTitle>
            <CardDescription>
              Curva de resultados acumulados: estrategia original vs entrada optimizada
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Nivel:</span>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetLevels.map((l) => (
                  <SelectItem key={l} value={l.toString()}>
                    {(l * 100).toFixed(0)}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">P&L Original</p>
            <p className={`text-xl font-bold font-mono ${originalTotal >= 0 ? "text-success" : "text-destructive"}`}>
              {originalTotal >= 0 ? "+" : ""}{originalTotal.toFixed(2)}R
            </p>
            <p className="text-xs text-muted-foreground">{originalTradeCount} trades</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">P&L Optimizado</p>
            <p className={`text-xl font-bold font-mono ${newTotal >= 0 ? "text-success" : "text-destructive"}`}>
              {newTotal >= 0 ? "+" : ""}{newTotal.toFixed(2)}R
            </p>
            <p className="text-xs text-muted-foreground">{newTradeCount} trades</p>
          </div>
          <div className={`rounded-lg border p-3 text-center ${isPositive ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
            <p className="text-xs text-muted-foreground mb-1">Diferencia</p>
            <div className="flex items-center justify-center gap-1">
              {isPositive ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
              <p className={`text-xl font-bold font-mono ${isPositive ? "text-success" : "text-destructive"}`}>
                {deltaR >= 0 ? "+" : ""}{deltaR.toFixed(2)}R
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">RR Nuevo</p>
            <p className="text-xl font-bold font-mono text-primary">
              {newRR.toFixed(2)}R
            </p>
            <p className="text-xs text-muted-foreground">vs {baseRR.toFixed(2)}R</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="index"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                label={{ value: "Trade #", position: "insideBottom", offset: -2, className: "fill-muted-foreground", fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                label={{ value: "R acumuladas", angle: -90, position: "insideLeft", className: "fill-muted-foreground", fontSize: 12 }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(v) => `Trade #${v}`}
                formatter={(value: number, name: string) => [
                  `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`,
                  name === "original" ? "Original" : "Optimizado",
                ]}
              />
              <Legend
                formatter={(value) => (value === "original" ? "Original" : `Optimizado (${(level * 100).toFixed(0)}%)`)}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Line
                type="monotone"
                dataKey="original"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="optimized"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Verdict */}
        <div className={`rounded-lg p-4 text-sm ${isPositive ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"}`}>
          {isPositive ? (
            <p>
              <strong className="text-success">✅ Merece la pena.</strong>{" "}
              Moviendo la entrada al {(level * 100).toFixed(0)}% habrías ganado{" "}
              <strong>{deltaR.toFixed(2)}R más</strong> sobre tu histórico de {originalTradeCount} trades, 
              pasando de {originalTotal.toFixed(2)}R a {newTotal.toFixed(2)}R.
            </p>
          ) : (
            <p>
              <strong className="text-destructive">❌ No merece la pena.</strong>{" "}
              Moviendo la entrada al {(level * 100).toFixed(0)}% habrías perdido{" "}
              <strong>{Math.abs(deltaR).toFixed(2)}R</strong> sobre tu histórico de {originalTradeCount} trades, 
              pasando de {originalTotal.toFixed(2)}R a {newTotal.toFixed(2)}R.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
