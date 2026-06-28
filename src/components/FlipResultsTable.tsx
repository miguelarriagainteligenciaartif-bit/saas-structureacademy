import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SimulationResult } from "@/utils/flipX5Simulator";
import { TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FlipResultsTableProps {
  result: SimulationResult;
}

export const FlipResultsTable = ({ result }: FlipResultsTableProps) => {
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatPnL = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${formatCurrency(value)}`;
  };

  return (
    <Card className="p-6 bg-card/30 border-border/50">
      <h3 className="text-lg font-semibold mb-4">Detalle de Trades</h3>
      
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">#</TableHead>
              <TableHead className="text-center">Fecha</TableHead>
              <TableHead className="text-center">Ciclo</TableHead>
              <TableHead className="text-center">Resultado</TableHead>
              <TableHead className="text-right">Riesgo Trad.</TableHead>
              <TableHead className="text-right">P&L Trad.</TableHead>
              <TableHead className="text-right">Balance Trad.</TableHead>
              <TableHead className="text-right">Riesgo Apal.</TableHead>
              <TableHead className="text-right">P&L Apal.</TableHead>
              <TableHead className="text-right">Balance Apal.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.trades.map((trade) => (
              <TableRow key={trade.tradeNumber}>
                <TableCell className="text-center font-medium">
                  {trade.tradeNumber}
                </TableCell>
                <TableCell className="text-center text-muted-foreground whitespace-nowrap">
                  {trade.date ? format(parseISO(trade.date), "dd/MM/yyyy") : "—"}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {trade.cycle}
                </TableCell>
                <TableCell className="text-center">
                  {trade.result === 'TP' ? (
                    <div className="inline-flex items-center gap-1 text-success">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-semibold">TP</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-destructive">
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-semibold">SL</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(trade.riskTraditional)}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  trade.pnlTraditional >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {formatPnL(trade.pnlTraditional)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(trade.balanceTraditional)}
                </TableCell>
                <TableCell className="text-right text-primary">
                  {formatCurrency(trade.riskLeveraged)}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  trade.pnlLeveraged >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {formatPnL(trade.pnlLeveraged)}
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {formatCurrency(trade.balanceLeveraged)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
};
