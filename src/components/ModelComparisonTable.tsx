import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  result_type: string | null;
  result_dollars: number | null;
  entry_model: string | null;
  no_trade_day: boolean;
  continuation_subtype?: string | null;
  fvg_count?: number | null;
  entry_subtype?: string | null;
}

interface ModelComparisonTableProps {
  trades: Trade[];
}

interface ModelStats {
  model: string;
  subtype?: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  expectedValue: number;
  isSubrow?: boolean;
}

export function ModelComparisonTable({ trades }: ModelComparisonTableProps) {
  const actualTrades = trades.filter(t => !t.no_trade_day);
  const models = ["M1", "M3", "Continuación"];

  const modelStats: ModelStats[] = [];

  models.forEach(model => {
    const modelTrades = actualTrades.filter(t => t.entry_model === model);
    const wins = modelTrades.filter(t => t.result_type === "TP").length;
    const losses = modelTrades.filter(t => t.result_type === "SL").length;
    const totalPnL = modelTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);

    const decisiveTrades = modelTrades.filter(t => t.result_type === "TP" || t.result_type === "SL");
    const wr = decisiveTrades.length > 0 ? wins / decisiveTrades.length : 0;
    const avgWin = wins > 0 ? modelTrades.filter(t => t.result_type === "TP").reduce((s, t) => s + (t.result_dollars || 0), 0) / wins : 0;
    const avgLoss = losses > 0 ? Math.abs(modelTrades.filter(t => t.result_type === "SL").reduce((s, t) => s + (t.result_dollars || 0), 0) / losses) : 0;
    const ev = decisiveTrades.length > 0 ? (wr * avgWin) - ((1 - wr) * avgLoss) : 0;

    modelStats.push({
      model,
      totalTrades: modelTrades.length,
      wins,
      losses,
      winRate: modelTrades.length > 0 ? (wins / modelTrades.length) * 100 : 0,
      totalPnL,
      expectedValue: ev,
    });

    // Add subtypes for Continuación
    if (model === "Continuación") {
      ["Bloque", "FVG"].forEach(subtype => {
        const subTrades = modelTrades.filter(t => t.continuation_subtype === subtype);
        const subWins = subTrades.filter(t => t.result_type === "TP").length;
        const subLosses = subTrades.filter(t => t.result_type === "SL").length;
        const subPnL = subTrades.reduce((sum, t) => sum + (t.result_dollars || 0), 0);

        const subDecisive = subTrades.filter(t => t.result_type === "TP" || t.result_type === "SL");
        const subWr = subDecisive.length > 0 ? subWins / subDecisive.length : 0;
        const subAvgWin = subWins > 0 ? subTrades.filter(t => t.result_type === "TP").reduce((s, t) => s + (t.result_dollars || 0), 0) / subWins : 0;
        const subAvgLoss = subLosses > 0 ? Math.abs(subTrades.filter(t => t.result_type === "SL").reduce((s, t) => s + (t.result_dollars || 0), 0) / subLosses) : 0;
        const subEv = subDecisive.length > 0 ? (subWr * subAvgWin) - ((1 - subWr) * subAvgLoss) : 0;

        modelStats.push({
          model: `└ ${subtype}`,
          subtype,
          totalTrades: subTrades.length,
          wins: subWins,
          losses: subLosses,
          winRate: subTrades.length > 0 ? (subWins / subTrades.length) * 100 : 0,
          totalPnL: subPnL,
          expectedValue: subEv,
          isSubrow: true,
        });
      });
    }
  });

  const mainStats = modelStats.filter(s => !s.isSubrow);
  const bestModel = mainStats.reduce((best, curr) => 
    curr.totalPnL > best.totalPnL ? curr : best, mainStats[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativa por Modelo</CardTitle>
        <CardDescription>
          Rendimiento de cada modelo de entrada
          {bestModel.totalTrades > 0 && (
            <> • Mejor modelo: <span className="font-semibold text-foreground">{bestModel.model}</span></>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo</TableHead>
              <TableHead className="text-center">Trades</TableHead>
              <TableHead className="text-center">TP</TableHead>
              <TableHead className="text-center">SL</TableHead>
              <TableHead className="text-center">Win Rate</TableHead>
              <TableHead className="text-right">P&L Total</TableHead>
              <TableHead className="text-right">Expected Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelStats.map((stat, idx) => (
              <TableRow key={idx} className={stat.isSubrow ? "bg-muted/30" : ""}>
                <TableCell className={cn("font-semibold", stat.isSubrow && "pl-6 text-muted-foreground text-sm")}>
                  {stat.model}
                </TableCell>
                <TableCell className="text-center">{stat.totalTrades}</TableCell>
                <TableCell className="text-center">
                  <span className="text-success font-medium">{stat.wins}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-destructive font-medium">{stat.losses}</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {stat.winRate >= 50 ? (
                      <TrendingUp className="h-3 w-3 text-success" />
                    ) : stat.totalTrades > 0 ? (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    ) : null}
                    <span className={cn(
                      "font-mono font-medium",
                      stat.totalTrades === 0 ? "text-muted-foreground" : 
                      stat.winRate >= 50 ? "text-success" : "text-destructive"
                    )}>
                      {stat.totalTrades > 0 ? `${stat.winRate.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono font-medium",
                  stat.totalTrades === 0 ? "text-muted-foreground" :
                  stat.totalPnL >= 0 ? "text-success" : "text-destructive"
                )}>
                  {stat.totalTrades > 0 ? `$${stat.totalPnL.toFixed(2)}` : "—"}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono font-medium",
                  stat.totalTrades === 0 ? "text-muted-foreground" :
                  stat.expectedValue >= 0 ? "text-success" : "text-destructive"
                )}>
                  {stat.totalTrades > 0 ? `$${stat.expectedValue.toFixed(2)}` : "—"}
                </TableCell>
              </TableRow>
            ))}
            {/* Total row */}
            <TableRow className="border-t-2 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-center">{actualTrades.length}</TableCell>
              <TableCell className="text-center text-success">
                {actualTrades.filter(t => t.result_type === "TP").length}
              </TableCell>
              <TableCell className="text-center text-destructive">
                {actualTrades.filter(t => t.result_type === "SL").length}
              </TableCell>
              <TableCell className="text-center font-mono">
                {actualTrades.length > 0 
                  ? `${((actualTrades.filter(t => t.result_type === "TP").length / actualTrades.length) * 100).toFixed(1)}%`
                  : "—"}
              </TableCell>
              <TableCell className={cn(
                "text-right font-mono",
                actualTrades.reduce((s, t) => s + (t.result_dollars || 0), 0) >= 0 ? "text-success" : "text-destructive"
              )}>
                ${actualTrades.reduce((s, t) => s + (t.result_dollars || 0), 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {(() => {
                  const allDecisive = actualTrades.filter(t => t.result_type === "TP" || t.result_type === "SL");
                  const allWins = actualTrades.filter(t => t.result_type === "TP");
                  const allLosses = actualTrades.filter(t => t.result_type === "SL");
                  if (allDecisive.length === 0) return "—";
                  const wr = allWins.length / allDecisive.length;
                  const avgW = allWins.length > 0 ? allWins.reduce((s, t) => s + (t.result_dollars || 0), 0) / allWins.length : 0;
                  const avgL = allLosses.length > 0 ? Math.abs(allLosses.reduce((s, t) => s + (t.result_dollars || 0), 0) / allLosses.length) : 0;
                  const ev = (wr * avgW) - ((1 - wr) * avgL);
                  return `$${ev.toFixed(2)}`;
                })()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
