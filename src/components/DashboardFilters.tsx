import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, Filter, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_MODELS = ["M1", "M3", "Continuación"];
const ALL_PATTERNS = ["Envolvente + Bloque", "Envolvente + FVG", "FVG único"];

interface DashboardFiltersProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  selectedModels: string[];
  timeFrom: string;
  timeTo: string;
  fvgCount: string;
  pattern: string;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onModelsChange: (models: string[]) => void;
  onTimeFromChange: (time: string) => void;
  onTimeToChange: (time: string) => void;
  onFvgCountChange: (value: string) => void;
  onPatternChange: (value: string) => void;
  onClearFilters: () => void;
}

export function DashboardFilters({
  dateFrom,
  dateTo,
  selectedModels,
  timeFrom,
  timeTo,
  fvgCount,
  pattern,
  onDateFromChange,
  onDateToChange,
  onModelsChange,
  onTimeFromChange,
  onTimeToChange,
  onFvgCountChange,
  onPatternChange,
  onClearFilters,
}: DashboardFiltersProps) {
  const isAllSelected = selectedModels.length === ALL_MODELS.length;
  const hasActiveFilters = dateFrom || dateTo || !isAllSelected || timeFrom || timeTo || fvgCount !== "all" || pattern !== "all";

  const showM1M3Filters = selectedModels.includes("M1") || selectedModels.includes("M3");
  // Pattern filter applies to any selected model (M1/M3 via entry_subtype,
  // Continuación via continuation_subtype, "FVG único" via fvg_count===1)
  const showPatternFilter = selectedModels.length > 0;

  const toggleModel = (model: string) => {
    if (selectedModels.includes(model)) {
      // Don't allow deselecting all
      if (selectedModels.length <= 1) return;
      onModelsChange(selectedModels.filter(m => m !== model));
    } else {
      onModelsChange([...selectedModels, model]);
    }
  };

  const modelsLabel = isAllSelected
    ? "Todos los modelos"
    : selectedModels.join(" + ");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Filter className="h-4 w-4 text-muted-foreground" />
      
      {/* Date From */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal",
              !dateFrom && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Desde"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateFrom}
            onSelect={onDateFromChange}
            initialFocus
            className="p-3 pointer-events-auto"
            locale={es}
          />
        </PopoverContent>
      </Popover>

      {/* Date To */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal",
              !dateTo && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateTo ? format(dateTo, "dd/MM/yyyy") : "Hasta"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateTo}
            onSelect={onDateToChange}
            initialFocus
            className="p-3 pointer-events-auto"
            locale={es}
          />
        </PopoverContent>
      </Popover>

      {/* Time From */}
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Input
          type="time"
          value={timeFrom}
          onChange={(e) => onTimeFromChange(e.target.value)}
          placeholder="Hora desde"
          className="w-[120px] h-9 text-sm"
        />
      </div>

      {/* Time To */}
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground text-sm">—</span>
        <Input
          type="time"
          value={timeTo}
          onChange={(e) => onTimeToChange(e.target.value)}
          placeholder="Hora hasta"
          className="w-[120px] h-9 text-sm"
        />
      </div>

      {/* Model Multi-Select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal min-w-[180px]",
              !isAllSelected && "border-primary text-primary"
            )}
          >
            <Layers className="mr-2 h-4 w-4" />
            {modelsLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-3" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Modelos</p>
            {ALL_MODELS.map((model) => (
              <label
                key={model}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={selectedModels.includes(model)}
                  onCheckedChange={() => toggleModel(model)}
                />
                <span className="text-sm">{model}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* FVG Count Filter (M1/M3) */}
      {showM1M3Filters && (
        <Select value={fvgCount} onValueChange={onFvgCountChange}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="FVGs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos FVGs</SelectItem>
            <SelectItem value="1">1 FVG</SelectItem>
            <SelectItem value="2">2 FVGs</SelectItem>
            <SelectItem value="3">3 FVGs</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Entry Pattern Filter — transversal across M1/M3/Continuación */}
      {showPatternFilter && (
        <Select value={pattern} onValueChange={onPatternChange}>
          <SelectTrigger className="w-[220px] h-9">
            <SelectValue placeholder="Patrón de entrada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los patrones</SelectItem>
            {ALL_PATTERNS.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      )}

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex gap-1 flex-wrap">
          {dateFrom && (
            <Badge variant="secondary" className="text-xs">
              Desde: {format(dateFrom, "dd/MM/yy")}
            </Badge>
          )}
          {dateTo && (
            <Badge variant="secondary" className="text-xs">
              Hasta: {format(dateTo, "dd/MM/yy")}
            </Badge>
          )}
          {timeFrom && (
            <Badge variant="secondary" className="text-xs">
              Hora desde: {timeFrom}
            </Badge>
          )}
          {timeTo && (
            <Badge variant="secondary" className="text-xs">
              Hora hasta: {timeTo}
            </Badge>
          )}
          {!isAllSelected && (
            <Badge variant="secondary" className="text-xs">
              Modelos: {selectedModels.join(" + ")}
            </Badge>
          )}
          {fvgCount !== "all" && (
            <Badge variant="secondary" className="text-xs">
              FVGs: {fvgCount}
            </Badge>
          )}
          {pattern !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Patrón: {pattern}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
