import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, Filter, Layers, X, Sigma, TrendingUp, ArrowLeftRight, Newspaper, Activity, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Fragment } from "react";
import {
  ALL_MODELS,
  ALL_FVG_COUNTS,
  ALL_RESULTS,
  ALL_TRADE_TYPES,
  ALL_DRAWDOWN_LEVELS,
  ALL_DAYS,
  VALID_PATTERNS_BY_MODEL,
  hasModelPatternRestriction,
  type ModelPatterns,
  NewsFilter,
} from "@/lib/tradeFilters";

const PATTERN_ROWS = ["Envolvente + Bloque", "Envolvente + FVG", "FVG"];
const DRAWDOWN_LABELS: Record<number, string> = {
  0: "0%",
  0.33: "33%",
  0.5: "50%",
  0.66: "66%",
  1: "100%",
};

interface DashboardFiltersProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  selectedModels: string[];
  timeFrom: string;
  timeTo: string;
  modelPatterns: ModelPatterns;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onModelsChange: (models: string[]) => void;
  onTimeFromChange: (time: string) => void;
  onTimeToChange: (time: string) => void;
  onModelPatternsChange: (value: ModelPatterns) => void;
  onClearFilters: () => void;
  // New optional filters (default to "all")
  fvgCounts?: number[];
  results?: string[];
  tradeTypes?: string[];
  newsFilter?: NewsFilter;
  drawdownLevels?: number[];
  daysOfWeek?: string[];
  onFvgCountsChange?: (v: number[]) => void;
  onResultsChange?: (v: string[]) => void;
  onTradeTypesChange?: (v: string[]) => void;
  onNewsFilterChange?: (v: NewsFilter) => void;
  onDrawdownLevelsChange?: (v: number[]) => void;
  onDaysOfWeekChange?: (v: string[]) => void;
}

export function DashboardFilters({
  dateFrom,
  dateTo,
  selectedModels,
  timeFrom,
  timeTo,
  modelPatterns,
  onDateFromChange,
  onDateToChange,
  onModelsChange,
  onTimeFromChange,
  onTimeToChange,
  onModelPatternsChange,
  onClearFilters,
  fvgCounts = [],
  results = [],
  tradeTypes = [],
  newsFilter = "all",
  drawdownLevels = [],
  daysOfWeek = [],
  onFvgCountsChange,
  onResultsChange,
  onTradeTypesChange,
  onNewsFilterChange,
  onDrawdownLevelsChange,
  onDaysOfWeekChange,
}: DashboardFiltersProps) {
  const isAllModels = selectedModels.length === ALL_MODELS.length;
  const patternsRestricted = hasModelPatternRestriction(modelPatterns);
  const allFvg = fvgCounts.length === 0 || fvgCounts.length === ALL_FVG_COUNTS.length;
  const allResults = results.length === 0 || results.length === ALL_RESULTS.length;
  const allTradeTypes = tradeTypes.length === 0 || tradeTypes.length === ALL_TRADE_TYPES.length;
  const allDrawdown = drawdownLevels.length === 0 || drawdownLevels.length === ALL_DRAWDOWN_LEVELS.length;
  const allDays = daysOfWeek.length === 0 || daysOfWeek.length === ALL_DAYS.length;
  const newsActive = newsFilter !== "all";

  const hasActive = !!(dateFrom || dateTo || !isAllModels || timeFrom || timeTo ||
    patternsRestricted || !allFvg || !allResults || !allTradeTypes ||
    !allDrawdown || !allDays || newsActive);

  // Show FVG filter only when M1 or M3 is in the selection
  const showFvgFilter = selectedModels.includes("M1") || selectedModels.includes("M3");
  // Show pattern filter when any model is selected
  const showPatternFilter = selectedModels.length > 0;
  // Only show currently selected models as columns of the matrix
  const visibleModels = ALL_MODELS.filter(m => selectedModels.includes(m));

  const toggleInList = <T,>(list: T[], all: T[], v: T, setter?: (vs: T[]) => void) => {
    if (!setter) return;
    const current = list.length === 0 ? [...all] : list;
    if (current.includes(v)) {
      if (current.length <= 1) return;
      setter(current.filter(x => x !== v));
    } else {
      setter([...current, v]);
    }
  };

  const isComboChecked = (m: string, p: string) => {
    const valid = VALID_PATTERNS_BY_MODEL[m] || [];
    if (!valid.includes(p)) return false;
    const allowed = modelPatterns[m];
    if (!allowed) return true; // default: all allowed
    return allowed.includes(p);
  };

  const toggleCombo = (m: string, p: string) => {
    const valid = VALID_PATTERNS_BY_MODEL[m] || [];
    if (!valid.includes(p)) return;
    const current = modelPatterns[m] ?? [...valid];
    const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
    const newMp: ModelPatterns = { ...modelPatterns };
    if (next.length === valid.length && valid.every(v => next.includes(v))) {
      delete newMp[m]; // back to default (all allowed)
    } else {
      newMp[m] = next;
    }
    onModelPatternsChange(newMp);
  };

  const togglePatternRow = (p: string) => {
    // Toggle a whole row across all visible models.
    const anyUnchecked = visibleModels.some(m => {
      const valid = VALID_PATTERNS_BY_MODEL[m] || [];
      return valid.includes(p) && !isComboChecked(m, p);
    });
    const newMp: ModelPatterns = { ...modelPatterns };
    visibleModels.forEach(m => {
      const valid = VALID_PATTERNS_BY_MODEL[m] || [];
      if (!valid.includes(p)) return;
      const current = newMp[m] ?? [...valid];
      const next = anyUnchecked
        ? (current.includes(p) ? current : [...current, p])
        : current.filter(x => x !== p);
      if (next.length === valid.length && valid.every(v => next.includes(v))) delete newMp[m];
      else newMp[m] = next;
    });
    onModelPatternsChange(newMp);
  };

  const toggleModel = (m: string) => {
    if (selectedModels.includes(m)) {
      if (selectedModels.length <= 1) return;
      onModelsChange(selectedModels.filter(x => x !== m));
    } else {
      onModelsChange([...selectedModels, m]);
    }
  };
  const toggleFvg = (n: number) => toggleInList(fvgCounts, ALL_FVG_COUNTS, n, onFvgCountsChange);
  const toggleResult = (r: string) => toggleInList(results, [...ALL_RESULTS], r, onResultsChange);
  const toggleType = (t: string) => toggleInList(tradeTypes, [...ALL_TRADE_TYPES], t, onTradeTypesChange);
  const toggleDrawdown = (l: number) => toggleInList(drawdownLevels, [...ALL_DRAWDOWN_LEVELS], l, onDrawdownLevelsChange);
  const toggleDay = (d: string) => toggleInList(daysOfWeek, [...ALL_DAYS], d, onDaysOfWeekChange);

  const modelsLabel = isAllModels ? "Todos los modelos" : selectedModels.join(" + ");
  const patternsLabel = patternsRestricted ? "Patrones personalizados" : "Todos los patrones";
  const restrictedSummary = (() => {
    if (!patternsRestricted) return "";
    return ALL_MODELS
      .filter(m => modelPatterns[m] !== undefined)
      .map(m => {
        const allowed = modelPatterns[m];
        const valid = VALID_PATTERNS_BY_MODEL[m] || [];
        if (allowed.length === valid.length && valid.every(v => allowed.includes(v))) return null;
        const short = (p: string) => p.replace("Envolvente + ", "Env+");
        const list = allowed.length === 0 ? "ninguno" : allowed.map(short).join(", ");
        return `${m}: ${list}`;
      })
      .filter(Boolean)
      .join(" · ");
  })();
  const fvgLabel = allFvg ? "Todos los FVG" : fvgCounts.map(n => `${n} FVG`).join(" / ");
  const resultsLabel = allResults ? "Todos los resultados" : results.join(" / ");
  const typesLabel = allTradeTypes ? "Compra y Venta" : tradeTypes.join(" / ");
  const newsLabel = newsFilter === "all" ? "Todas (con/sin noticia)" : newsFilter === "with" ? "Con noticia" : "Sin noticia";
  const drawdownLabel = allDrawdown ? "Todos los DD" : drawdownLevels.map(l => DRAWDOWN_LABELS[l] ?? `${Math.round(l*100)}%`).join(" / ");
  const daysLabel = allDays ? "Todos los días" : daysOfWeek.map(d => d.slice(0,3)).join(" / ");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Filter className="h-4 w-4 text-muted-foreground" />

      {/* Date From */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Desde"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateFrom} onSelect={onDateFromChange} initialFocus className="p-3 pointer-events-auto" locale={es} />
        </PopoverContent>
      </Popover>

      {/* Date To */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateTo ? format(dateTo, "dd/MM/yyyy") : "Hasta"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateTo} onSelect={onDateToChange} initialFocus className="p-3 pointer-events-auto" locale={es} />
        </PopoverContent>
      </Popover>

      {/* Time From */}
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Input type="time" value={timeFrom} onChange={e => onTimeFromChange(e.target.value)} className="w-[120px] h-9 text-sm" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground text-sm">—</span>
        <Input type="time" value={timeTo} onChange={e => onTimeToChange(e.target.value)} className="w-[120px] h-9 text-sm" />
      </div>

      {/* Models */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[180px]", !isAllModels && "border-primary text-primary")}>
              <Layers className="mr-2 h-4 w-4 text-primary" />{modelsLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-3" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Modelos</p>
            {ALL_MODELS.map(m => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={selectedModels.includes(m)} onCheckedChange={() => toggleModel(m)} />
                <span className="text-sm">{m}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Patterns */}
      {showPatternFilter && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[220px]", patternsRestricted && "border-primary text-primary")}>
              <Layers className="mr-2 h-4 w-4 text-primary" />{patternsLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto min-w-[320px] p-4" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Patrón × Modelo
              </p>
              <p className="text-xs text-muted-foreground">
                Marca/desmarca cada combinación de modelo y patrón de forma independiente.
              </p>
              <div
                className="grid gap-x-4 gap-y-2 items-center"
                style={{ gridTemplateColumns: `minmax(160px, auto) repeat(${visibleModels.length}, minmax(56px, auto))` }}
              >
                <div />
                {visibleModels.map(m => (
                  <div key={m} className="text-xs font-semibold text-center text-muted-foreground">
                    {m === "Continuación" ? "Cont." : m}
                  </div>
                ))}
                {PATTERN_ROWS.map(p => (
                  <Fragment key={p}>
                    <button
                      type="button"
                      onClick={() => togglePatternRow(p)}
                      className="text-sm text-left hover:text-primary transition-colors"
                      title="Click para alternar toda la fila"
                    >
                      {p}
                    </button>
                    {visibleModels.map(m => {
                      const valid = (VALID_PATTERNS_BY_MODEL[m] || []).includes(p);
                      return (
                        <div key={m} className="flex justify-center">
                          {valid ? (
                            <Checkbox
                              checked={isComboChecked(m, p)}
                              onCheckedChange={() => toggleCombo(m, p)}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                {patternsRestricted && (
                  <button
                    type="button"
                    onClick={() => onModelPatternsChange({})}
                    className="text-xs text-muted-foreground hover:text-foreground underline text-left"
                  >
                    Restablecer (todos los patrones en todos los modelos)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    onModelPatternsChange(
                      ALL_MODELS.reduce((acc, m) => ({ ...acc, [m]: [] }), {} as ModelPatterns)
                    )
                  }
                  className="text-xs text-muted-foreground hover:text-foreground underline text-left"
                >
                  Borrar (todos los patrones en todos los modelos)
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* FVG count */}
      {showFvgFilter && onFvgCountsChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[150px]", !allFvg && "border-primary text-primary")}>
              <Sigma className="mr-2 h-4 w-4 text-primary" />{fvgLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Cantidad de FVG</p>
              {ALL_FVG_COUNTS.map(n => {
                const effective = fvgCounts.length === 0 ? ALL_FVG_COUNTS : fvgCounts;
                return (
                  <label key={n} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={effective.includes(n)} onCheckedChange={() => toggleFvg(n)} />
                    <span className="text-sm">{n} FVG</span>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Result */}
      {onResultsChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[160px]", !allResults && "border-primary text-primary")}>
              <TrendingUp className="mr-2 h-4 w-4 text-primary" />{resultsLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Resultado</p>
              {ALL_RESULTS.map(r => {
                const effective = results.length === 0 ? [...ALL_RESULTS] : results;
                return (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={effective.includes(r)} onCheckedChange={() => toggleResult(r)} />
                    <span className="text-sm">{r}</span>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Trade Type */}
      {onTradeTypesChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[160px]", !allTradeTypes && "border-primary text-primary")}>
              <ArrowLeftRight className="mr-2 h-4 w-4 text-primary" />{typesLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Tipo de operación</p>
              {ALL_TRADE_TYPES.map(t => {
                const effective = tradeTypes.length === 0 ? [...ALL_TRADE_TYPES] : tradeTypes;
                return (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={effective.includes(t)} onCheckedChange={() => toggleType(t)} />
                    <span className="text-sm">{t}</span>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* News */}
      {onNewsFilterChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[180px]", newsActive && "border-primary text-primary")}>
              <Newspaper className="mr-2 h-4 w-4 text-primary" />{newsLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Noticias</p>
              <RadioGroup value={newsFilter} onValueChange={v => onNewsFilterChange(v as NewsFilter)}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="news-all" />
                  <Label htmlFor="news-all" className="text-sm cursor-pointer">Todas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="with" id="news-with" />
                  <Label htmlFor="news-with" className="text-sm cursor-pointer">Con noticia</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="without" id="news-without" />
                  <Label htmlFor="news-without" className="text-sm cursor-pointer">Sin noticia</Label>
                </div>
              </RadioGroup>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Drawdown */}
      {onDrawdownLevelsChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[170px]", !allDrawdown && "border-primary text-primary")}>
              <Activity className="mr-2 h-4 w-4 text-primary" />{drawdownLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Drawdown recorrido</p>
              {ALL_DRAWDOWN_LEVELS.map(l => {
                const effective = drawdownLevels.length === 0 ? [...ALL_DRAWDOWN_LEVELS] : drawdownLevels;
                return (
                  <label key={l} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={effective.includes(l)} onCheckedChange={() => toggleDrawdown(l)} />
                    <span className="text-sm">{DRAWDOWN_LABELS[l]}</span>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Day of week */}
      {onDaysOfWeekChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[170px]", !allDays && "border-primary text-primary")}>
              <CalendarDays className="mr-2 h-4 w-4 text-primary" />{daysLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Día de la semana</p>
              {ALL_DAYS.map(d => {
                const effective = daysOfWeek.length === 0 ? [...ALL_DAYS] : daysOfWeek;
                return (
                  <label key={d} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={effective.includes(d)} onCheckedChange={() => toggleDay(d)} />
                    <span className="text-sm">{d}</span>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear */}
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
          <X className="h-4 w-4 mr-1" />Limpiar
        </Button>
      )}

      {/* Active badges */}
      {hasActive && (
        <div className="flex gap-1 flex-wrap">
          {dateFrom && <Badge variant="secondary" className="text-xs">Desde: {format(dateFrom, "dd/MM/yy")}</Badge>}
          {dateTo && <Badge variant="secondary" className="text-xs">Hasta: {format(dateTo, "dd/MM/yy")}</Badge>}
          {timeFrom && <Badge variant="secondary" className="text-xs">Hora desde: {timeFrom}</Badge>}
          {timeTo && <Badge variant="secondary" className="text-xs">Hora hasta: {timeTo}</Badge>}
          {!isAllModels && <Badge variant="secondary" className="text-xs">Modelos: {selectedModels.join(" + ")}</Badge>}
          {patternsRestricted && <Badge variant="secondary" className="text-xs">Patrón → {restrictedSummary}</Badge>}
          {!allFvg && <Badge variant="secondary" className="text-xs">FVG: {fvgCounts.join(" / ")}</Badge>}
          {!allResults && <Badge variant="secondary" className="text-xs">Resultado: {results.join(" / ")}</Badge>}
          {!allTradeTypes && <Badge variant="secondary" className="text-xs">Tipo: {tradeTypes.join(" / ")}</Badge>}
          {newsActive && <Badge variant="secondary" className="text-xs">Noticia: {newsFilter === "with" ? "Con" : "Sin"}</Badge>}
          {!allDrawdown && <Badge variant="secondary" className="text-xs">DD: {drawdownLevels.map(l => DRAWDOWN_LABELS[l]).join(" / ")}</Badge>}
          {!allDays && <Badge variant="secondary" className="text-xs">Días: {daysOfWeek.map(d => d.slice(0,3)).join(" / ")}</Badge>}
        </div>
      )}
    </div>
  );
}
