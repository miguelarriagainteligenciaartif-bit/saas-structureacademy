import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ExternalLink, Pencil, ArrowLeft, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditTradeForm } from "@/components/EditTradeForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Trade {
  id: string;
  date: string;
  day_of_week: string;
  week_of_month: number | null;
  entry_time: string | null;
  exit_time: string | null;
  trade_type: string | null;
  result_type: string | null;
  entry_model: string | null;
  result_dollars: number | null;
  had_news: boolean;
  news_description: string | null;
  custom_news_description: string | null;
  news_time: string | null;
  execution_timing: string | null;
  no_trade_day: boolean;
  image_link: string | null;
  account_id: string | null;
  risk_percentage: number;
  asset?: string;
  drawdown?: number | null;
  max_rr?: number | null;
  notes?: string | null;
}

interface TradeDetailsDialogProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export const TradeDetailsDialog = ({ trade, open, onOpenChange, onUpdated }: TradeDetailsDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!trade) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("trades")
        .delete()
        .eq("id", trade.id);

      if (error) throw error;

      toast.success("Trade eliminado correctamente");
      onOpenChange(false);
      onUpdated?.();
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!trade) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setIsEditing(false);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle>{isEditing ? "Editar Operación" : "Detalles de la Operación"}</DialogTitle>
              <DialogDescription className="truncate">
                {trade.date} - {trade.day_of_week}
              </DialogDescription>
            </div>

            {isEditing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar este trade?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. El trade del {trade.date} será eliminado permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </DialogHeader>

        {isEditing ? (
          <div className="pt-2">
            <EditTradeForm
              trade={trade}
              onSuccess={() => {
                setIsEditing(false);
                onUpdated?.();
                onOpenChange(false);
              }}
              isBacktest={false}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center gap-4">
              {trade.no_trade_day ? (
                <Badge variant="outline" className="text-warning">Sin Entrada</Badge>
              ) : (
                <>
                  <Badge variant={trade.trade_type === "Compra" ? "default" : "secondary"}>
                    {trade.trade_type}
                  </Badge>
                  {trade.result_type === "TP" ? (
                    <div className="flex items-center gap-1 text-success">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-medium text-lg">TP</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-destructive">
                      <TrendingDown className="h-5 w-5" />
                      <span className="font-medium text-lg">SL</span>
                    </div>
                  )}
                  <span className={`font-mono font-bold text-lg ml-auto ${
                    (trade.result_dollars || 0) >= 0 ? "text-success" : "text-destructive"
                  }`}>
                    ${(trade.result_dollars || 0).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            {!trade.no_trade_day && (
              <>
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Activo</p>
                    <p className="font-medium">{trade.asset || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo de Entrada</p>
                    <Badge variant="outline">{trade.entry_model || "N/A"}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hora de Entrada</p>
                    <p className="font-medium">{trade.entry_time || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hora de Salida</p>
                    <p className="font-medium">{trade.exit_time || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Riesgo</p>
                    <p className="font-medium">{trade.risk_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Semana del Mes</p>
                    <p className="font-medium">Semana {trade.week_of_month || "N/A"}</p>
                  </div>
                  {trade.drawdown !== null && trade.drawdown !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">DrawDown Recorrido</p>
                      <p className="font-medium">{(trade.drawdown * 100).toFixed(0)}%</p>
                    </div>
                  )}
                  {trade.max_rr !== null && trade.max_rr !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">RR Máximo</p>
                      <p className="font-medium">{trade.max_rr}R</p>
                    </div>
                  )}
                </div>

                {/* News Info */}
                {trade.had_news && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Información de Noticias</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Noticia</p>
                        <p className="font-medium">
                          {trade.news_description === "Otra"
                            ? trade.custom_news_description
                            : trade.news_description || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hora de Noticia</p>
                        <p className="font-medium">{trade.news_time || "N/A"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Timing de Ejecución</p>
                        <p className="font-medium">{trade.execution_timing || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {trade.notes && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notas / Comentarios
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{trade.notes}</p>
                    </div>
                  </div>
                )}

                {/* TradingView Image */}
                {trade.image_link && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Chart</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={trade.image_link}
                        alt="Trade Chart"
                        className="w-full h-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
