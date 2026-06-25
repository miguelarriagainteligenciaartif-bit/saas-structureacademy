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
  news_description?: string | null;
  drawdown: number | null;
  day_of_week: string | null;
}

export const ALL_MODELS = ["M1", "M3", "Continuación"];
export const ALL_FVG_COUNTS = [1, 2, 3];
export const ALL_RESULTS = ["TP", "SL"] as const;
export const ALL_TRADE_TYPES = ["Compra", "Venta"] as const;
export const ALL_DRAWDOWN_LEVELS = [0, 0.33, 0.5, 0.66, 1] as const;
export const ALL_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;
export const ALL_NEWS_TYPES = [
  "Miércoles previo a NFP",
  "Jueves previo a NFP",
  "NFP",
  "Flash PMI",
  "Federal Funds Rate",
  "Festivo Bancos",
] as const;
export type NewsFilter = "all" | "with" | "without";

// Valid (model, pattern) combinations. Continuación does not support direct "FVG".
export const VALID_PATTERNS_BY_MODEL: Record<string, string[]> = {
  M1: ["Envolvente + Bloque", "Envolvente + FVG", "FVG"],
  M3: ["Envolvente + Bloque", "Envolvente + FVG", "FVG"],
  "Continuación": ["Envolvente + Bloque", "Envolvente + FVG"],
};

export type ModelPatterns = Record<string, string[]>;

export function hasModelPatternRestriction(mp: ModelPatterns | undefined): boolean {
  if (!mp) return false;
  return Object.entries(mp).some(([m, ps]) => {
    const valid = VALID_PATTERNS_BY_MODEL[m] || [];
    if (ps.length !== valid.length) return true;
    return !valid.every(v => ps.includes(v));
  });
}

export interface FilterState {
  dateFrom?: Date;
  dateTo?: Date;
  models: string[];
  timeFrom: string;
  timeTo: string;
  /**
   * Per-model allowed patterns. If a model key is absent → all valid patterns
   * for that model are allowed (default). If present, only the listed patterns
   * are allowed for trades of that model.
   */
  modelPatterns: ModelPatterns;
  fvgCounts: number[];
  results: string[];
  tradeTypes: string[];
  newsFilter: NewsFilter;
  newsTypes: string[];
  drawdownLevels: number[];
  daysOfWeek: string[];
}

export const defaultFilterState = (): FilterState => ({
  dateFrom: undefined,
  dateTo: undefined,
  models: [...ALL_MODELS],
  timeFrom: "",
  timeTo: "",
  modelPatterns: {},
  fvgCounts: [],
  results: [],
  tradeTypes: [],
  newsFilter: "all",
  newsTypes: [...ALL_NEWS_TYPES],
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
  if (hasModelPatternRestriction(f.modelPatterns)) {
    const mp = f.modelPatterns;
    out = out.filter(t => {
      const m = t.entry_model;
      if (!m || !(m in mp)) return true; // model not restricted → keep
      const allowed = mp[m];
      const valid = VALID_PATTERNS_BY_MODEL[m] || [];
      if (allowed.length === valid.length && valid.every(v => allowed.includes(v))) return true;
      const p = getEntryPattern(t);
      return p !== null && allowed.includes(p);
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
  if (f.newsTypes.length > 0 && f.newsTypes.length < ALL_NEWS_TYPES.length) {
    out = out.filter(t => !!t.had_news && t.news_description != null && f.newsTypes.includes(t.news_description));
  }
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
    hasModelPatternRestriction(f.modelPatterns) ||
    (f.fvgCounts.length > 0 && f.fvgCounts.length < ALL_FVG_COUNTS.length) ||
    (f.results.length > 0 && f.results.length < ALL_RESULTS.length) ||
    (f.tradeTypes.length > 0 && f.tradeTypes.length < ALL_TRADE_TYPES.length) ||
    f.newsFilter !== "all" ||
    (f.newsTypes.length < ALL_NEWS_TYPES.length) ||
    (f.drawdownLevels.length > 0 && f.drawdownLevels.length < ALL_DRAWDOWN_LEVELS.length) ||
    (f.daysOfWeek.length > 0 && f.daysOfWeek.length < ALL_DAYS.length)
  );
}
