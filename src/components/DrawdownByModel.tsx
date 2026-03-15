import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

// Retracement levels to analyze
const RETRACEMENT_LEVELS = [0, 0.10, 0.20, 0.25, 0.30, 0.33, 0.382, 0.50, 0.618, 0.66, 0.75, 0.786];

type ModelOption = "all" | "M1" | "M3" | "Continuación" | "Cont. Bloque" | "Cont. FVG";

const MODEL_OPTIONS: { value: ModelOption; label: string }[] = [
  { value: "all", label: "Todos los modelos" },
  { value: "M1", label: "M1" },
  { value: "M3", label: "M3" },
  { value: "Continuación", label: "Continuación (todos)" },
  { value: "Cont. Bloque", label: "Continuación — Bloque" },
  { value: "Cont. FVG", label: "Continuación — FVG" },
];

function filterByModel(trades: Trade[], model: ModelOption): Trade[] {
  if (model === "all") return trades;
  if (model === "M1") return trades.filter(t => t.entry_model === "M1");
  if (model === "M3") return trades.filter(t => t.entry_model === "M3");
  if (model === "Continuación") return trades.filter(t => t.entry_model === "Continuación");
  if (model === "Cont. Bloque") return trades.filter(t => t.entry_model === "Continuación" && t.continuation_subtype === "Bloque");
  if (model === "Cont. FVG") return trades.filter(t => t.entry_model === "Continuación" && t.continuation_subtype === "FVG");
  return trades;
}

export function DrawdownByModel({ trades }: DrawdownByModelProps) {
  const [selectedModel, setSelectedModel] = useState<ModelOption>("all");

  const actualTrades = trades.filter(t => !t.no_trade_day);
  const modelTrades = filterByModel(actualTrades, selectedModel);

  // Only TP trades with drawdown data
  const tpTrades = modelTrades.filter(t => t.result_type === "TP" && t.drawdown !== null && t.drawdown !== undefined);
  const totalTPs = tpTrades.length;

  // For each retracement level, count how many TPs had drawdown >= that level
  const levelData = RETRACEMENT_LEVELS.map(level => {
    const count = tpTrades.filter(t => t.drawdown! >= level).length;
    const percent = totalTPs > 0 ? (count / totalTPs) * 100 : 0;
    return {
      level,
      label: level === 0 ? "0 (sin retroceso)" : level.toFixed(level % 0.1 === 0 ? 1 : 3),
      count,
      percent,
    };
  });

  // Also compute per-model breakdown when "all" is selected
  const modelBreakdown = selectedModel === "all"
    ? ["M1", "M3", "Continuación"].map(model => {
        const mTrades = actualTrades.filter(t => t.entry_model === model && t.result_type === "TP" && t.drawdown !== null);
        return { model, total: mTrades.length };
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5" />
              Retroceso por Modelo (solo TPs)
            </CardTitle>
            <CardDescription>
              ¿Cuántos TPs alcanzan cada nivel de retroceso antes de llegar a TP? Los SL son siempre 100% retroceso.
            </CardDescription>
          </div>
          <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as ModelOption)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-sm">
            Total TPs con datos: <span className="font-bold ml-1">{totalTPs}</span>
          </Badge>
          {modelBreakdown && modelBreakdown.map(m => (
            <Badge key={m.model} variant="outline" className="text-sm">
              {m.model}: <span className="font-bold ml-1">{m.total}</span>
            </Badge>
          ))}
        </div>

        {totalTPs === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay TPs con datos de retroceso para el modelo seleccionado
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Nivel de Retroceso</TableHead>
                <TableHead className="text-center">TPs que llegan</TableHead>
                <TableHead className="text-center">% del Total</TableHead>
                <TableHead className="w-[300px]">Distribución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levelData.map((row) => (
                <TableRow key={row.level}>
                  <TableCell className="font-mono font-semibold">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-lg">{row.count}</span>
                    <span className="text-muted-foreground text-sm ml-1">/ {totalTPs}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-mono font-medium",
                      row.percent >= 50 ? "text-success" : "text-destructive"
                    )}>
                      {row.percent.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={row.percent} className="h-3" />
                      <span className="text-xs text-muted-foreground w-10 text-right">{row.percent.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
