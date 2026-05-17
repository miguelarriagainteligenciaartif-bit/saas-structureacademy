import { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isSameMonth,
  isSameDay,
  getWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEntryPattern } from "@/lib/entryPattern";

interface TradeRow {
  date: string;
  result_dollars: number | null;
  no_trade_day: boolean;
  entry_model: string | null;
  entry_subtype: string | null;
  continuation_subtype: string | null;
  fvg_count: number | null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatMoney = (n: number) => {
  const sign = n < 0 ? "-" : n > 0 ? "+" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCellMoney = (n: number) => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const modelAbbr = (m: string | null): string | null => {
  if (m === "M1") return "M1";
  if (m === "M3") return "M3";
  if (m === "Continuación") return "Cont";
  return null;
};

const patternAbbr = (p: string | null): string | null => {
  if (p === "Envolvente + Bloque") return "ENV+Bloq";
  if (p === "Envolvente + FVG") return "ENV+FVG";
  if (p === "FVG") return "FVG";
  return null;
};

export default function ForexCalendar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
    })();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("date, result_dollars, no_trade_day, entry_model, entry_subtype, continuation_subtype, fvg_count")
        .eq("user_id", user.id);
      if (!error && data) setTrades(data as TradeRow[]);
    })();
  }, [user]);

  // Aggregate trades by date string yyyy-MM-dd
  const tradesByDay = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number; entries: { model: string; pattern: string | null }[] }>();
    trades.forEach((t) => {
      if (!t.date || t.no_trade_day) return;
      const key = t.date.slice(0, 10);
      const prev = map.get(key) || { pnl: 0, count: 0, entries: [] };
      prev.pnl += t.result_dollars || 0;
      prev.count += 1;
      const mAbbr = modelAbbr(t.entry_model);
      if (mAbbr) {
        const pAbbr = patternAbbr(getEntryPattern(t));
        prev.entries.push({ model: mAbbr, pattern: pAbbr });
      }
      map.set(key, prev);
    });
    return map;
  }, [trades]);

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  }, [currentMonth]);

  // Month totals (only days within current month)
  const monthTotals = useMemo(() => {
    let pnl = 0;
    let count = 0;
    tradesByDay.forEach((v, key) => {
      const d = new Date(key + "T00:00:00");
      if (isSameMonth(d, currentMonth)) {
        pnl += v.pnl;
        count += v.count;
      }
    });
    return { pnl, count };
  }, [tradesByDay, currentMonth]);

  const today = new Date();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-medium capitalize text-foreground">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: es })}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subYears(currentMonth, 1))}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addYears(currentMonth, 1))}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => setCurrentMonth(startOfMonth(new Date()))}>
              This month
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-8 gap-2">
          {/* Header row */}
          {WEEKDAYS.map((d) => (
            <div key={d} className="rounded-md bg-card border border-border text-center py-2 text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          <div className="rounded-md bg-card border border-border text-center py-2 text-xs font-medium text-muted-foreground">
            Week Summary
          </div>

          {/* Weeks */}
          {weeks.map((week, wIdx) => {
            let weekPnl = 0;
            let weekDaysWithTrades = 0;
            week.forEach((day) => {
              const key = format(day, "yyyy-MM-dd");
              const v = tradesByDay.get(key);
              if (v && isSameMonth(day, currentMonth)) {
                weekPnl += v.pnl;
                weekDaysWithTrades += 1;
              }
            });

            return (
              <Fragment key={wIdx}>
                {week.map((day) => {
                  const inMonth = isSameMonth(day, currentMonth);
                  const key = format(day, "yyyy-MM-dd");
                  const v = tradesByDay.get(key);
                  const pnl = v?.pnl ?? 0;
                  const count = v?.count ?? 0;
                  const isProfit = pnl > 0;
                  const isLoss = pnl < 0;
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={key}
                      className={cn(
                        "relative rounded-md border min-h-[96px] p-2 flex flex-col transition-colors",
                        !inMonth && "opacity-40",
                        isProfit && "bg-success/15 border-success/40",
                        isLoss && "bg-destructive/15 border-destructive/40",
                        !isProfit && !isLoss && "bg-card border-border",
                        isToday && "ring-1 ring-primary",
                      )}
                    >
                      <div className="text-xs text-muted-foreground">{format(day, "d")}</div>
                      {v && v.entries.length > 0 && (
                        <div className="absolute top-1 right-1 flex flex-col items-end gap-0.5">
                          {v.entries.slice(0, 3).map((e, i) => (
                            <div key={i} className="leading-tight text-right">
                              <div className="text-[10px] font-semibold text-foreground">{e.model}</div>
                              {e.pattern && (
                                <div className="text-[9px] font-medium text-foreground">{e.pattern}</div>
                              )}
                            </div>
                          ))}
                          {v.entries.length > 3 && (
                            <div className="text-[9px] text-muted-foreground">+{v.entries.length - 3}</div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        {count > 0 ? (
                          <>
                            <div className={cn(
                              "font-semibold text-base",
                              isProfit && "text-success",
                              isLoss && "text-destructive",
                            )}>
                              {formatCellMoney(pnl)}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {count} trade{count === 1 ? "" : "s"}
                            </div>
                          </>
                        ) : inMonth ? (
                          <>
                            <div className="text-base font-medium text-muted-foreground">$0</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">No trades</div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {/* Week summary */}
                <div className="rounded-md border border-border bg-card p-2 flex flex-col items-center justify-center text-center min-h-[96px]">
                  <div className="text-xs text-muted-foreground">Week {wIdx + 1}</div>
                  <div className={cn(
                    "font-semibold text-base mt-1",
                    weekPnl > 0 && "text-success",
                    weekPnl < 0 && "text-destructive",
                  )}>
                    {formatCellMoney(weekPnl)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {weekDaysWithTrades} day{weekDaysWithTrades === 1 ? "" : "s"}
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>

        {/* Month summary */}
        <Card className="mt-4">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Month Summary
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Trades</div>
                <div className="text-xl font-semibold">{monthTotals.count}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Net P&L</div>
                <div className={cn(
                  "text-xl font-bold",
                  monthTotals.pnl > 0 && "text-success",
                  monthTotals.pnl < 0 && "text-destructive",
                )}>
                  {formatMoney(monthTotals.pnl)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
