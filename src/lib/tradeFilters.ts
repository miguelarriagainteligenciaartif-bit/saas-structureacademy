import { getEntryPattern, ENTRY_PATTERNS } from "@/lib/entryPattern";

export interface FilterableTrade {
  date: string;
  entry_time: string | null;
  entry_model: string | null;
  entry_subtype: string | null;
  continuation_subtype: string | null;
  fvg_count: number | null;
  result_type: string | null;
  trade_type: string | null;
  had_news: boolean | null;
  drawdown: number | null;
  day_of_week: string | null;
}

export const ALL_MODELS = ["M1", "M3", "Continuación"];
export const ALL_FVG_COUNTS = [1, 2, 3];
export const ALL_RESULTS = ["TP", "SL"] as const;
export const ALL_TRADE_TYPES = ["Compra", "Venta"] as const;
export const ALL_DRAWDOWN_LEVELS = [0, 0.33, 0.5, 0.66, 1] as const;
export const ALL_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;
export type NewsFilter = "all" | "with" | "without";

export interface FilterState {
  dateFrom?: Date;
  dateTo?: Date;
  models: string[];
  timeFrom: string;
  timeTo: string;
  patterns: string[];
  fvgCounts: number[];
  results: string[];
  tradeTypes: string[];
  newsFilter: NewsFilter;
  drawdownLevels: number[];
  daysOfWeek: string[];
}

export const defaultFilterState = (): FilterState => ({
  dateFrom: undefined,
  dateTo: undefined,
  models: [...ALL_MODELS],
  timeFrom: "",
  timeTo: "",
  patterns: [],
  fvgCounts: [],
  results: [],
  tradeTypes: [],
  newsFilter: "all",
  drawdownLevels: [],
  daysOfWeek: [],
});

const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const approxEq = (a: number, b: number) => Math.abs(a - b) < 0.02;

export function applyTradeFilters<T extends FilterableTrade>(
  trades: T[],
  f: FilterState
): T[] {
  let out = trades;
  if (f.dateFrom) {
    const s = fmt(f.dateFrom);
    out = out.filter(t => t.date >= s);
  }
  if (f.dateTo) {
    const s = fmt(f.dateTo);
    out = out.filter(t => t.date <= s);
  }
  if (f.models.length > 0 && f.models.length < ALL_MODELS.length) {
    out = out.filter(t => t.entry_model && f.models.includes(t.entry_model));
  }
  if (f.timeFrom) out = out.filter(t => t.entry_time && t.entry_time >= f.timeFrom);
  if (f.timeTo) out = out.filter(t => t.entry_time && t.entry_time <= f.timeTo);
  if (f.patterns.length > 0 && f.patterns.length < ENTRY_PATTERNS.length) {
    out = out.filter(t => {
      const p = getEntryPattern(t);
      return p !== null && f.patterns.includes(p);
    });
  }
  if (f.fvgCounts.length > 0 && f.fvgCounts.length < ALL_FVG_COUNTS.length) {
    out = out.filter(t => t.fvg_count != null && f.fvgCounts.includes(t.fvg_count));
  }
  if (f.results.length > 0 && f.results.length < ALL_RESULTS.length) {
    out = out.filter(t => t.result_type && f.results.includes(t.result_type));
  }
  if (f.tradeTypes.length > 0 && f.tradeTypes.length < ALL_TRADE_TYPES.length) {
    out = out.filter(t => t.trade_type && f.tradeTypes.includes(t.trade_type));
  }
  if (f.newsFilter === "with") out = out.filter(t => !!t.had_news);
  else if (f.newsFilter === "without") out = out.filter(t => !t.had_news);
  if (f.drawdownLevels.length > 0 && f.drawdownLevels.length < ALL_DRAWDOWN_LEVELS.length) {
    out = out.filter(t => t.drawdown != null && f.drawdownLevels.some(l => approxEq(l, t.drawdown!)));
  }
  if (f.daysOfWeek.length > 0 && f.daysOfWeek.length < ALL_DAYS.length) {
    out = out.filter(t => t.day_of_week && f.daysOfWeek.includes(t.day_of_week));
  }
  return out;
}

export function hasActiveFilters(f: FilterState): boolean {
  return Boolean(
    f.dateFrom || f.dateTo ||
    (f.models.length > 0 && f.models.length < ALL_MODELS.length) ||
    f.timeFrom || f.timeTo ||
    (f.patterns.length > 0 && f.patterns.length < ENTRY_PATTERNS.length) ||
    (f.fvgCounts.length > 0 && f.fvgCounts.length < ALL_FVG_COUNTS.length) ||
    (f.results.length > 0 && f.results.length < ALL_RESULTS.length) ||
    (f.tradeTypes.length > 0 && f.tradeTypes.length < ALL_TRADE_TYPES.length) ||
    f.newsFilter !== "all" ||
    (f.drawdownLevels.length > 0 && f.drawdownLevels.length < ALL_DRAWDOWN_LEVELS.length) ||
    (f.daysOfWeek.length > 0 && f.daysOfWeek.length < ALL_DAYS.length)
  );
}
