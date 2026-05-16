import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Grid3x3 } from "lucide-react";
import { getEntryPattern, ENTRY_PATTERNS, type EntryPattern } from "@/lib/entryPattern";
import { cn } from "@/lib/utils";

interface MinTrade {
  entry_model: string | null;
  entry_subtype: string | null;
  continuation_subtype: string | null;
  fvg_count: number | null;
  result_type: string | null;
  result_dollars: number | null;
  no_trade_day?: boolean;
}

interface Props {
  trades: MinTrade[];
}

type ModelKey = "M1" | "M3" | "Continuación";
const MODELS: ModelKey[] = ["M1", "M3", "Continuación"];
const FVG_COLS = [1, 2, 3] as const;

interface CellStats {
  n: number;
  tp: number;
  sl: number;
  pnl: number;
}

const empty = (): CellStats => ({ n: 0, tp: 0, sl: 0, pnl: 0 });

export function PatternModelFvgMatrix({ trades }: Props) {
  const actual = trades.filter(t => !t.no_trade_day);

  // matrix[pattern][model][fvg|"all"] = CellStats
  const matrix: Record<string, Record<string, Record<string, CellStats>>> = {};
  ENTRY_PATTERNS.forEach(p => {
    matrix[p] = {};
    MODELS.forEach(m => {
      matrix[p][m] = { "1": empty(), "2": empty(), "3": empty(), all: empty() };
    });
  });

  for (const t of actual) {
    const pattern = getEntryPattern(t);
    const model = t.entry_model as ModelKey | null;
    if (!pattern || !model || !MODELS.includes(model)) continue;
    const fvgKey = t.fvg_count === 1 || t.fvg_count === 2 || t.fvg_count === 3
      ? String(t.fvg_count)
      : null;
    const buckets = [matrix[pattern][model].all];
    if (model !== "Continuación" && fvgKey) buckets.push(matrix[pattern][model][fvgKey]);
    for (const b of buckets) {
      b.n += 1;
      if (t.result_type === "TP") b.tp += 1;
      else if (t.result_type === "SL") b.sl += 1;
      b.pnl += t.result_dollars || 0;
    }
  }

  const colTotals: Record<string, CellStats> = {};
  MODELS.forEach(m => {
    ["1", "2", "3", "all"].forEach(k => {
      colTotals[`${m}|${k}`] = empty();
    });
  });
  const rowTotals: Record<string, CellStats> = {};
  ENTRY_PATTERNS.forEach(p => { rowTotals[p] = empty(); });

  ENTRY_PATTERNS.forEach(p => {
    MODELS.forEach(m => {
      (["1","2","3","all"] as const).forEach(k => {
        const c = matrix[p][m][k];
        const tot = colTotals[`${m}|${k}`];
        tot.n += c.n; tot.tp += c.tp; tot.sl += c.sl; tot.pnl += c.pnl;
        if (k === "all") {
          const rt = rowTotals[p];
          rt.n += c.n; rt.tp += c.tp; rt.sl += c.sl; rt.pnl += c.pnl;
        }
      });
    });
  });

  const grandTotal = empty();
  ENTRY_PATTERNS.forEach(p => {
    grandTotal.n += rowTotals[p].n;
    grandTotal.tp += rowTotals[p].tp;
    grandTotal.sl += rowTotals[p].sl;
    grandTotal.pnl += rowTotals[p].pnl;
  });

  const winRate = (c: CellStats) => {
    const dec = c.tp + c.sl;
    return dec > 0 ? (c.tp / dec) * 100 : 0;
  };

  const renderCell = (c: CellStats, faded = false) => {
    if (c.n === 0) return <span className="text-muted-foreground/40">—</span>;
    const wr = winRate(c);
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("font-semibold tabular-nums cursor-help", faded && "text-muted-foreground")}>
              {c.n}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-0.5">
              <div>Trades: <span className="font-semibold">{c.n}</span></div>
              <div>TP / SL: {c.tp} / {c.sl}</div>
              <div>Win Rate: {wr.toFixed(1)}%</div>
              <div>P&L: <span className={cn(c.pnl >= 0 ? "text-success" : "text-destructive")}>${c.pnl.toFixed(0)}</span></div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-primary" />
          Matriz Patrón × Modelo × FVG
        </CardTitle>
        <CardDescription>
          Cantidad de trades por patrón de entrada, modelo y número de FVG. Pasa el cursor sobre cada celda para ver Win Rate y P&L. Respeta los filtros activos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="align-bottom min-w-[180px]">Patrón</TableHead>
                <TableHead colSpan={4} className="text-center border-l">M1</TableHead>
                <TableHead colSpan={4} className="text-center border-l">M3</TableHead>
                <TableHead colSpan={1} className="text-center border-l">Continuación</TableHead>
                <TableHead rowSpan={2} className="text-center align-bottom border-l">Total</TableHead>
              </TableRow>
              <TableRow>
                {(["M1","M3"] as const).flatMap(m => [
                  <TableHead key={`${m}-1`} className="text-center text-xs border-l">1 FVG</TableHead>,
                  <TableHead key={`${m}-2`} className="text-center text-xs">2 FVG</TableHead>,
                  <TableHead key={`${m}-3`} className="text-center text-xs">3 FVG</TableHead>,
                  <TableHead key={`${m}-all`} className="text-center text-xs font-semibold">Total</TableHead>,
                ])}
                <TableHead className="text-center text-xs border-l">—</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(ENTRY_PATTERNS as readonly EntryPattern[]).map(p => (
                <TableRow key={p}>
                  <TableCell className="font-medium">{p}</TableCell>
                  {(["M1","M3"] as const).flatMap(m => [
                    <TableCell key={`${p}-${m}-1`} className="text-center border-l">{renderCell(matrix[p][m]["1"])}</TableCell>,
                    <TableCell key={`${p}-${m}-2`} className="text-center">{renderCell(matrix[p][m]["2"])}</TableCell>,
                    <TableCell key={`${p}-${m}-3`} className="text-center">{renderCell(matrix[p][m]["3"])}</TableCell>,
                    <TableCell key={`${p}-${m}-all`} className="text-center bg-muted/30">{renderCell(matrix[p][m].all)}</TableCell>,
                  ])}
                  <TableCell className="text-center border-l bg-muted/30">{renderCell(matrix[p]["Continuación"].all)}</TableCell>
                  <TableCell className="text-center border-l bg-muted/50 font-semibold">{renderCell(rowTotals[p])}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 font-semibold">
                <TableCell>Total</TableCell>
                {(["M1","M3"] as const).flatMap(m => [
                  <TableCell key={`tot-${m}-1`} className="text-center border-l">{renderCell(colTotals[`${m}|1`])}</TableCell>,
                  <TableCell key={`tot-${m}-2`} className="text-center">{renderCell(colTotals[`${m}|2`])}</TableCell>,
                  <TableCell key={`tot-${m}-3`} className="text-center">{renderCell(colTotals[`${m}|3`])}</TableCell>,
                  <TableCell key={`tot-${m}-all`} className="text-center bg-muted/50">{renderCell(colTotals[`${m}|all`])}</TableCell>,
                ])}
                <TableCell className="text-center border-l bg-muted/50">{renderCell(colTotals["Continuación|all"])}</TableCell>
                <TableCell className="text-center border-l bg-muted/60">{renderCell(grandTotal)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
