import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const ASSET_OPTIONS = ["Nasdaq 100", "Oro", "BTC", "EUR/USD", "GBP/USD", "Petróleo", "S&P 500", "Otro"] as const;
const DAY_OPTIONS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;
const TRADE_TYPE_OPTIONS = ["Compra", "Venta"] as const;
const RESULT_TYPE_OPTIONS = ["TP", "SL"] as const;
const DRAWDOWN_OPTIONS = ["0", "0.33", "0.50", "0.66", "0.90", "1.00"] as const;
const NEWS_DESCRIPTION_OPTIONS = ["NFP", "CPI", "PMI Servicios", "PMI Manufacturing", "PCE", "Flash PMI", "FOMC", "Ventas Minoristas", "Otra"] as const;
const NEWS_TIME_OPTIONS = ["08:30", "09:45", "10:00"] as const;
const EXECUTION_TIMING_OPTIONS = ["Antes de noticia", "Después de noticia"] as const;
const ENTRY_MODEL_OPTIONS = ["M1", "M3", "Continuación"] as const;
const CONTINUATION_SUBTYPE_OPTIONS = ["Bloque", "FVG"] as const;

type DrawdownOption = (typeof DRAWDOWN_OPTIONS)[number];

const formSchema = z.object({
  no_trade_day: z.boolean().default(false),
  account_id: z.string().optional(),
  asset: z.enum(ASSET_OPTIONS).default("Nasdaq 100"),
  date: z.string().min(1, "Fecha requerida").refine((val) => {
    const inputDate = new Date(val + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate <= today;
  }, { message: "La fecha no puede ser futura" }),
  day_of_week: z.enum(DAY_OPTIONS),
  entry_time: z.string().optional(),
  exit_time: z.string().optional(),
  trade_type: z.enum(TRADE_TYPE_OPTIONS).optional(),
  result_type: z.enum(RESULT_TYPE_OPTIONS).optional(),
  drawdown: z.enum(DRAWDOWN_OPTIONS).optional(),
  max_rr: z.union([
    z.string(),
    z.number(),
  ]).optional(),
  had_news: z.boolean().default(false),
  news_description: z.enum(NEWS_DESCRIPTION_OPTIONS).optional(),
  custom_news_description: z.string().optional(),
  news_time: z.enum(NEWS_TIME_OPTIONS).optional(),
  execution_timing: z.enum(EXECUTION_TIMING_OPTIONS).optional(),
  entry_model: z.enum(ENTRY_MODEL_OPTIONS).optional(),
  continuation_subtype: z.enum(CONTINUATION_SUBTYPE_OPTIONS).optional(),
  result_dollars: z.string().optional(),
  image_link: z.string().url().optional().or(z.literal("")),
  risk_percentage: z.string().default("1"),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.no_trade_day) return;
  
  if (!data.entry_time) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Hora de entrada requerida",
      path: ["entry_time"],
    });
  }
  if (!data.trade_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tipo de operación requerido",
      path: ["trade_type"],
    });
  }
  if (!data.result_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Resultado requerido",
      path: ["result_type"],
    });
  }
  if (!data.entry_model) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Modelo de entrada requerido",
      path: ["entry_model"],
    });
  }
  if (!data.result_dollars) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Resultado en dólares requerido",
      path: ["result_dollars"],
    });
  }
});

interface EditTradeFormProps {
  trade: any;
  onSuccess: () => void;
  isBacktest?: boolean;
}

export const EditTradeForm = ({ trade, onSuccess, isBacktest = false }: EditTradeFormProps) => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  const formattedDrawdown = trade.drawdown != null ? Number(trade.drawdown).toFixed(2).replace(/^0\.00$/, "0") : undefined;
  const normalizedDrawdown = DRAWDOWN_OPTIONS.includes(formattedDrawdown as DrawdownOption)
    ? (formattedDrawdown as DrawdownOption)
    : undefined;

  const normalizedContinuationSubtype = CONTINUATION_SUBTYPE_OPTIONS.includes(trade.continuation_subtype)
    ? trade.continuation_subtype
    : undefined;

  const normalizedNewsDescription = trade.had_news
    ? (NEWS_DESCRIPTION_OPTIONS.includes(trade.news_description)
        ? trade.news_description
        : trade.news_description
          ? "Otra"
          : undefined)
    : undefined;

  const normalizedCustomNewsDescription = normalizedNewsDescription === "Otra"
    ? (trade.custom_news_description || trade.news_description || "")
    : (trade.custom_news_description || "");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      no_trade_day: trade.no_trade_day || false,
      had_news: trade.had_news || false,
      result_dollars: trade.result_dollars?.toString() || "0",
      account_id: trade.account_id || "",
      risk_percentage: trade.risk_percentage?.toString() || "1",
      asset: ASSET_OPTIONS.includes(trade.asset) ? trade.asset : "Nasdaq 100",
      entry_time: trade.entry_time || "",
      exit_time: trade.exit_time || "",
      trade_type: TRADE_TYPE_OPTIONS.includes(trade.trade_type) ? trade.trade_type : undefined,
      result_type: RESULT_TYPE_OPTIONS.includes(trade.result_type) ? trade.result_type : undefined,
      drawdown: normalizedDrawdown,
      max_rr: trade.max_rr?.toString() || undefined,
      entry_model: ENTRY_MODEL_OPTIONS.includes(trade.entry_model) ? trade.entry_model : undefined,
      image_link: trade.image_link || "",
      news_description: normalizedNewsDescription,
      custom_news_description: normalizedCustomNewsDescription,
      news_time: trade.had_news && NEWS_TIME_OPTIONS.includes(trade.news_time) ? trade.news_time : undefined,
      execution_timing: trade.had_news && EXECUTION_TIMING_OPTIONS.includes(trade.execution_timing) ? trade.execution_timing : undefined,
      date: trade.date || "",
      day_of_week: DAY_OPTIONS.includes(trade.day_of_week) ? trade.day_of_week : undefined,
      notes: trade.notes || "",
      continuation_subtype: normalizedContinuationSubtype,
    },
  });

  const noTradeDay = form.watch("no_trade_day");
  const hadNews = form.watch("had_news");
  const newsDescription = form.watch("news_description");
  const watchedDate = form.watch("date");

  // Auto-update day_of_week when date changes
  useEffect(() => {
    if (watchedDate) {
      const date = new Date(watchedDate + "T12:00:00");
      const dayIndex = date.getDay();
      const days: Record<number, "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes"> = {
        1: "Lunes",
        2: "Martes",
        3: "Miércoles",
        4: "Jueves",
        5: "Viernes",
      };
      if (days[dayIndex]) {
        form.setValue("day_of_week", days[dayIndex]);
      }
    }
  }, [watchedDate, form]);

  useEffect(() => {
    if (!isBacktest) {
      loadAccounts();
    }
  }, [isBacktest]);

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("is_active", true)
      .order("name");
    
    if (!error && data) {
      setAccounts(data);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const tradeDate = new Date(values.date);
      const dayOfMonth = tradeDate.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);

      const tableName = isBacktest ? "backtest_trades" : "trades";
      const hasNews = values.had_news && !values.no_trade_day;

      const updateData: any = {
        no_trade_day: values.no_trade_day,
        asset: values.asset,
        date: values.date,
        day_of_week: values.day_of_week,
        week_of_month: weekOfMonth,
        entry_time: values.no_trade_day ? "00:00:00" : (values.entry_time || "00:00:00"),
        exit_time: values.exit_time || null,
        trade_type: values.no_trade_day ? "Compra" : values.trade_type,
        result_type: values.no_trade_day ? "TP" : values.result_type,
        drawdown: values.drawdown ? parseFloat(values.drawdown) : null,
        max_rr: values.max_rr ? parseFloat(values.max_rr.toString()) : null,
        had_news: hasNews,
        news_description: hasNews ? (values.news_description || null) : null,
        custom_news_description: hasNews ? (values.custom_news_description || null) : null,
        news_time: hasNews ? (values.news_time || null) : null,
        execution_timing: hasNews ? (values.execution_timing || null) : null,
        entry_model: values.no_trade_day ? "M1" : values.entry_model,
        continuation_subtype: values.entry_model === "Continuación" ? (values.continuation_subtype || null) : null,
        result_dollars: values.no_trade_day ? 0 : (values.result_dollars ? parseFloat(values.result_dollars) : 0),
        image_link: values.image_link || null,
        risk_percentage: values.risk_percentage ? parseFloat(values.risk_percentage) : 1,
        notes: values.notes || null,
      };

      if (!isBacktest) {
        updateData.account_id = values.account_id || null;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", trade.id);

      if (error) throw error;

      toast.success(`Operación ${isBacktest ? 'de backtesting' : ''} actualizada exitosamente`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
        console.error("Form validation errors:", JSON.stringify(errors, null, 2));
        const firstError = Object.entries(errors)[0];
        if (firstError) {
          toast.error(`Error en campo "${firstError[0]}": ${firstError[1]?.message || "valor inválido"}`);
        }
      })} className="space-y-4">
        <FormField
          control={form.control}
          name="no_trade_day"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-warning/20 bg-warning/5 p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-warning">Día sin entrada</FormLabel>
                <p className="text-sm text-muted-foreground">Marcar si ese día no hubo operación</p>
              </div>
            </FormItem>
          )}
        />

        {!isBacktest && (
          <FormField
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una cuenta (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.broker})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="asset"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Activo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona activo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["Nasdaq 100", "Oro", "BTC", "EUR/USD", "GBP/USD", "Petróleo", "S&P 500", "Otro"].map((asset) => (
                      <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="day_of_week"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Día de la Semana</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona día" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entry_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Entrada {!noTradeDay && <span className="text-destructive">*</span>}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} disabled={noTradeDay} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exit_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Salida</FormLabel>
                <FormControl>
                  <Input type="time" {...field} disabled={noTradeDay} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trade_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Operación {!noTradeDay && <span className="text-destructive">*</span>}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={noTradeDay}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Compra">Compra</SelectItem>
                    <SelectItem value="Venta">Venta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="result_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resultado {!noTradeDay && <span className="text-destructive">*</span>}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={noTradeDay}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="TP o SL" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TP">TP (Take Profit)</SelectItem>
                    <SelectItem value="SL">SL (Stop Loss)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="drawdown"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DrawDown Recorrido</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={noTradeDay}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona DrawDown" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">0 (Directo sin retroceso)</SelectItem>
                    <SelectItem value="0.33">0.33 (33%)</SelectItem>
                    <SelectItem value="0.50">0.50 (50%)</SelectItem>
                    <SelectItem value="0.66">0.66 (66%)</SelectItem>
                    <SelectItem value="0.90">0.90 (90%)</SelectItem>
                    <SelectItem value="1.00">Full (SL completo)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_rr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RR Máximo Alcanzado</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="Ej: 3.5" 
                    {...field}
                    value={field.value || ''}
                    disabled={noTradeDay}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entry_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo de Entrada {!noTradeDay && <span className="text-destructive">*</span>}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={noTradeDay}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona modelo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="M1">M1</SelectItem>
                    <SelectItem value="M3">M3</SelectItem>
                    <SelectItem value="Continuación">Continuación</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("entry_model") === "Continuación" && !noTradeDay && (
            <FormField
              control={form.control}
              name="continuation_subtype"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtipo Continuación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bloque o FVG" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Bloque">Bloque</SelectItem>
                      <SelectItem value="FVG">FVG</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="result_dollars"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resultado en Dólares {!noTradeDay && <span className="text-destructive">*</span>}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ej: -50 o 100" 
                    {...field} 
                    disabled={noTradeDay}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="risk_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Riesgo (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} disabled={noTradeDay} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="had_news"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={noTradeDay} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Hubo Noticias</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {hadNews && !noTradeDay && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <FormField
              control={form.control}
              name="news_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Noticia</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo de noticia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["NFP", "CPI", "PMI Servicios", "PMI Manufacturing", "PCE", "Flash PMI", "FOMC", "Ventas Minoristas", "Otra"].map((news) => (
                        <SelectItem key={news} value={news}>{news}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {newsDescription === "Otra" && (
              <FormField
                control={form.control}
                name="custom_news_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de Noticia Personalizada</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe la noticia..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="news_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de la Noticia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona hora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="08:30">08:30</SelectItem>
                        <SelectItem value="09:45">09:45</SelectItem>
                        <SelectItem value="10:00">10:00</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="execution_timing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timing de Ejecución</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="¿Antes o después?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Antes de noticia">Antes de noticia</SelectItem>
                        <SelectItem value="Después de noticia">Después de noticia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="image_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link de Imagen (TradingView)</FormLabel>
              <FormControl>
                <Input 
                  type="url" 
                  placeholder="https://..." 
                  {...field} 
                  disabled={noTradeDay}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas / Comentarios (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Añade tus notas, observaciones o comentarios sobre esta operación..." 
                  className="min-h-[100px] resize-y"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Guardando..." : "Actualizar Operación"}
        </Button>
      </form>
    </Form>
  );
};
