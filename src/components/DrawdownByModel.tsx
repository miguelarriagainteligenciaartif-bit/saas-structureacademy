import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { ArrowDownRight } from "lucide-react";

interface Trade {
  id: string;
  result_type: string | null;
  result_dollars: number | null;
  entry_model: string | null;
  drawdown: number | null;
  no_trade_day: boolean;
  continuation_subtype?: string | null;
}

interface DrawdownByModelProps {
  trades: Trade[];
}

interface DrawdownStats {
  model: string;
  tradesWithData: number;
  avgDrawdown: number;
  medianDrawdown: number;
  minDrawdown: number;
  maxDrawdown: number;
  avgDrawdownTP: number;
  avgDrawdownSL: number;
  tpCount: number;
  slCount: number;
  isSubrow?: boolean;
}

const getMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const computeStats = (trades: { drawdown: number | null; result_type: string | null }[], model: string, isSubrow = false): DrawdownStats => {
  const withData = trades.filter(t => t.drawdown !== null && t.drawdown !== undefined);
  const drawdowns = withData.map(t => t.drawdown!);
  const tpTrades = withData.filter(t => t.result_type === "TP");
  const slTrades = withData.filter(t => t.result_type === "SL");

  return {
    model,
    tradesWithData: withData.length,
    avgDrawdown: drawdowns.length > 0 ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length : 0,
    medianDrawdown: getMedian(drawdowns),
    minDrawdown: drawdowns.length > 0 ? Math.min(...drawdowns) : 0,
    maxDrawdown: drawdowns.length > 0 ? Math.max(...drawdowns) : 0,
    avgDrawdownTP: tpTrades.length > 0 ? tpTrades.reduce((s, t) => s + (t.drawdown || 0), 0) / tpTrades.length : 0,
    avgDrawdownSL: slTrades.length > 0 ? slTrades.reduce((s, t) => s + (t.drawdown || 0), 0) / slTrades.length : 0,
    tpCount: tpTrades.length,
    slCount: slTrades.length,
    isSubrow,
  };
};

const formatDD = (val: number) => val > 0 ? `${(val * 100).toFixed(1)}%` : "—";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function DrawdownByModel({ trades }: DrawdownByModelProps) {
  const actualTrades = trades.filter(t => !t.no_trade_day);
  const models = ["M1", "M3", "Continuación"];

  const allStats: DrawdownStats[] = [];

  models.forEach(model => {
    const modelTrades = actualTrades.filter(t => t.entry_model === model);
    allStats.push(computeStats(modelTrades, model));

    if (model === "Continuación") {
      ["Bloque", "FVG"].forEach(subtype => {
        const subTrades = modelTrades.filter(t => t.continuation_subtype === subtype);
        allStats.push(computeStats(subTrades, `└ ${subtype}`, true));
      });
    }
  });

  const chartData = allStats
    .filter(s => !s.isSubrow && s.tradesWithData > 0)
    .map((s, i) => ({
      name: s.model,
      "Promedio DD": +(s.avgDrawdown * 100).toFixed(1),
      "Mediana DD": +(s.medianDrawdown * 100).toFixed(1),
      "Max DD": +(s.maxDrawdown * 100).toFixed(1),
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownRight className="h-5 w-5" />
          Retroceso (Drawdown) por Modelo
        </CardTitle>
        <CardDescription>
          Análisis del tamaño del retroceso antes de alcanzar TP o SL por cada modelo de entrada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={v => `${v}%`} className="text-xs" />
              <Tooltip
                formatter={(value: number) => [`${value}%`]}
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="Promedio DD" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Mediana DD" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Max DD" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo</TableHead>
              <TableHead className="text-center">Trades c/DD</TableHead>
              <TableHead className="text-center">Prom. DD</TableHead>
              <TableHead className="text-center">Mediana DD</TableHead>
              <TableHead className="text-center">Min DD</TableHead>
              <TableHead className="text-center">Max DD</TableHead>
              <TableHead className="text-center">DD Prom. TP</TableHead>
              <TableHead className="text-center">DD Prom. SL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStats.map((stat, idx) => (
              <TableRow key={idx} className={stat.isSubrow ? "bg-muted/30" : ""}>
                <TableCell className={cn("font-semibold", stat.isSubrow && "pl-6 text-muted-foreground text-sm")}>
                  {stat.model}
                </TableCell>
                <TableCell className="text-center">{stat.tradesWithData}</TableCell>
                <TableCell className="text-center font-mono">{formatDD(stat.avgDrawdown)}</TableCell>
                <TableCell className="text-center font-mono">{formatDD(stat.medianDrawdown)}</TableCell>
                <TableCell className="text-center font-mono">{formatDD(stat.minDrawdown)}</TableCell>
                <TableCell className="text-center font-mono">{formatDD(stat.maxDrawdown)}</TableCell>
                <TableCell className="text-center font-mono">
                  {stat.tpCount > 0 ? (
                    <span className="text-success">{formatDD(stat.avgDrawdownTP)}</span>
                  ) : "—"}
                  {stat.tpCount > 0 && <span className="text-muted-foreground text-xs ml-1">({stat.tpCount})</span>}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {stat.slCount > 0 ? (
                    <span className="text-destructive">{formatDD(stat.avgDrawdownSL)}</span>
                  ) : "—"}
                  {stat.slCount > 0 && <span className="text-muted-foreground text-xs ml-1">({stat.slCount})</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
