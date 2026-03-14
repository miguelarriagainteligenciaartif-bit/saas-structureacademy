import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, TrendingDown, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Trade {
  id: string;
  date: string;
  result_type: string | null;
  result_dollars: number | null;
  entry_model: string | null;
  no_trade_day: boolean;
  continuation_subtype?: string | null;
}

interface ContinuationSubtypeAnalysisProps {
  trades: Trade[];
}

type PeriodType = "all" | "monthly" | "weekly";

interface SubtypeStats {
  subtype: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
}

function computeSubtypeStats(trades: Trade[]): SubtypeStats[] {
  const continuationTrades = trades.filter(
    (t) => !t.no_trade_day && t.entry_model === "Continuación"
  );

  return ["FVG", "Bloque"].map((subtype) => {
    const filtered = continuationTrades.filter(
      (t) => t.continuation_subtype === subtype
    );
    const wins = filtered.filter((t) => t.result_type === "TP").length;
    const losses = filtered.filter((t) => t.result_type === "SL").length;
    const totalPnL = filtered.reduce(
      (sum, t) => sum + (t.result_dollars || 0),
      0
    );
    return {
      subtype,
      totalTrades: filtered.length,
      wins,
      losses,
      winRate: filtered.length > 0 ? (wins / filtered.length) * 100 : 0,
      totalPnL,
      avgPnL: filtered.length > 0 ? totalPnL / filtered.length : 0,
    };
  });
}

export function ContinuationSubtypeAnalysis({
  trades,
}: ContinuationSubtypeAnalysisProps) {
  const [periodType, setPeriodType] = useState<PeriodType>("all");

  const continuationTrades = useMemo(
    () =>
      trades.filter(
        (t) => !t.no_trade_day && t.entry_model === "Continuación"
      ),
    [trades]
  );

  // Global stats
  const globalStats = useMemo(() => computeSubtypeStats(trades), [trades]);

  // Period-grouped stats
  const periodData = useMemo(() => {
    if (periodType === "all") return null;

    const grouped: Record<string, Trade[]> = {};
    continuationTrades.forEach((t) => {
      const date = parseISO(t.date);
      const key =
        periodType === "monthly"
          ? format(date, "yyyy-MM")
          : `${format(date, "yyyy")}-S${String(
              getWeekOfYear(date)
            ).padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, periodTrades]) => {
        const fvg = periodTrades.filter(
          (t) => t.continuation_subtype === "FVG"
        );
        const bloque = periodTrades.filter(
          (t) => t.continuation_subtype === "Bloque"
        );
        const fvgPnL = fvg.reduce(
          (s, t) => s + (t.result_dollars || 0),
          0
        );
        const bloquePnL = bloque.reduce(
          (s, t) => s + (t.result_dollars || 0),
          0
        );

        const label =
          periodType === "monthly"
            ? format(parseISO(`${period}-01`), "MMM yyyy", { locale: es })
            : period;

        return {
          period: label,
          fvgPnL,
          bloquePnL,
          fvgTrades: fvg.length,
          bloqueTrades: bloque.length,
          fvgWinRate:
            fvg.length > 0
              ? (fvg.filter((t) => t.result_type === "TP").length /
                  fvg.length) *
                100
              : 0,
          bloqueWinRate:
            bloque.length > 0
              ? (bloque.filter((t) => t.result_type === "TP").length /
                  bloque.length) *
                100
              : 0,
        };
      });
  }, [continuationTrades, periodType]);

  if (continuationTrades.length === 0) return null;

  const totalCont = continuationTrades.length;
  const totalPnL = continuationTrades.reduce(
    (s, t) => s + (t.result_dollars || 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Análisis Continuación: FVG vs Bloque
            </CardTitle>
            <CardDescription>
              {totalCont} operaciones de continuación • P&L Total:{" "}
              <span
                className={cn(
                  "font-semibold",
                  totalPnL >= 0 ? "text-success" : "text-destructive"
                )}
              >
                ${totalPnL.toFixed(2)}
              </span>
            </CardDescription>
          </div>
          <Select
            value={periodType}
            onValueChange={(v) => setPeriodType(v as PeriodType)}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Resumen global</SelectItem>
              <SelectItem value="monthly">Por mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {globalStats.map((stat) => (
            <div
              key={stat.subtype}
              className="p-4 border rounded-lg space-y-2"
            >
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span
                  className={cn(
                    "w-3 h-3 rounded-full",
                    stat.subtype === "FVG" ? "bg-chart-1" : "bg-chart-2"
                  )}
                  style={{
                    backgroundColor:
                      stat.subtype === "FVG"
                        ? "hsl(var(--chart-1))"
                        : "hsl(var(--chart-2))",
                  }}
                />
                {stat.subtype}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Trades</span>
                  <p className="font-bold">{stat.totalTrades}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Win Rate</span>
                  <p
                    className={cn(
                      "font-bold",
                      stat.totalTrades === 0
                        ? "text-muted-foreground"
                        : stat.winRate >= 50
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    {stat.totalTrades > 0
                      ? `${stat.winRate.toFixed(1)}%`
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">P&L Total</span>
                  <p
                    className={cn(
                      "font-bold font-mono",
                      stat.totalTrades === 0
                        ? "text-muted-foreground"
                        : stat.totalPnL >= 0
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    {stat.totalTrades > 0
                      ? `$${stat.totalPnL.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">P&L Promedio</span>
                  <p
                    className={cn(
                      "font-bold font-mono",
                      stat.totalTrades === 0
                        ? "text-muted-foreground"
                        : stat.avgPnL >= 0
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    {stat.totalTrades > 0
                      ? `$${stat.avgPnL.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-success">{stat.wins} TP</span>
                <span>•</span>
                <span className="text-destructive">{stat.losses} SL</span>
              </div>
            </div>
          ))}
        </div>

        {/* Period breakdown */}
        {periodType === "monthly" && periodData && periodData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `$${value.toFixed(2)}`,
                    name,
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="fvgPnL"
                  name="FVG P&L"
                  fill="hsl(var(--chart-1))"
                />
                <Bar
                  dataKey="bloquePnL"
                  name="Bloque P&L"
                  fill="hsl(var(--chart-2))"
                />
              </BarChart>
            </ResponsiveContainer>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-center">FVG Trades</TableHead>
                  <TableHead className="text-right">FVG P&L</TableHead>
                  <TableHead className="text-center">FVG WR</TableHead>
                  <TableHead className="text-center">Bloque Trades</TableHead>
                  <TableHead className="text-right">Bloque P&L</TableHead>
                  <TableHead className="text-center">Bloque WR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodData.map((row) => (
                  <TableRow key={row.period}>
                    <TableCell className="font-medium capitalize">
                      {row.period}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.fvgTrades}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono font-medium",
                        row.fvgTrades === 0
                          ? "text-muted-foreground"
                          : row.fvgPnL >= 0
                          ? "text-success"
                          : "text-destructive"
                      )}
                    >
                      {row.fvgTrades > 0
                        ? `$${row.fvgPnL.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {row.fvgTrades > 0
                        ? `${row.fvgWinRate.toFixed(0)}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.bloqueTrades}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono font-medium",
                        row.bloqueTrades === 0
                          ? "text-muted-foreground"
                          : row.bloquePnL >= 0
                          ? "text-success"
                          : "text-destructive"
                      )}
                    >
                      {row.bloqueTrades > 0
                        ? `$${row.bloquePnL.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {row.bloqueTrades > 0
                        ? `${row.bloqueWinRate.toFixed(0)}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}
