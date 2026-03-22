import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface DashboardFiltersProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  selectedModel: string;
  timeFrom: string;
  timeTo: string;
  fvgCount: string;
  entrySubtype: string;
  continuationSubtype: string;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onModelChange: (model: string) => void;
  onTimeFromChange: (time: string) => void;
  onTimeToChange: (time: string) => void;
  onFvgCountChange: (value: string) => void;
  onEntrySubtypeChange: (value: string) => void;
  onContinuationSubtypeChange: (value: string) => void;
  onClearFilters: () => void;
}

export function DashboardFilters({
  dateFrom,
  dateTo,
  selectedModel,
  timeFrom,
  timeTo,
  fvgCount,
  entrySubtype,
  continuationSubtype,
  onDateFromChange,
  onDateToChange,
  onModelChange,
  onTimeFromChange,
  onTimeToChange,
  onFvgCountChange,
  onEntrySubtypeChange,
  onContinuationSubtypeChange,
  onClearFilters,
}: DashboardFiltersProps) {
  const hasActiveFilters = dateFrom || dateTo || selectedModel !== "all" || timeFrom || timeTo || fvgCount !== "all" || entrySubtype !== "all" || continuationSubtype !== "all";

  const showM1M3Filters = selectedModel === "all" || selectedModel === "M1" || selectedModel === "M3";
  const showContinuationFilter = selectedModel === "all" || selectedModel === "Continuación";

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

      {/* Model Filter */}
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Modelo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los modelos</SelectItem>
          <SelectItem value="M1">M1</SelectItem>
          <SelectItem value="M3">M3</SelectItem>
          <SelectItem value="Continuación">Continuación</SelectItem>
        </SelectContent>
      </Select>

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

      {/* Entry Subtype Filter (M1/M3) */}
      {showM1M3Filters && (
        <Select value={entrySubtype} onValueChange={onEntrySubtypeChange}>
          <SelectTrigger className="w-[190px] h-9">
            <SelectValue placeholder="Tipo entrada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="Envolvente + Bloque">Envolvente + Bloque</SelectItem>
            <SelectItem value="Envolvente + FVG">Envolvente + FVG</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Continuation Subtype Filter */}
      {showContinuationFilter && (
        <Select value={continuationSubtype} onValueChange={onContinuationSubtypeChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Tipo continuación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda continuación</SelectItem>
            <SelectItem value="Bloque">Bloque</SelectItem>
            <SelectItem value="FVG">FVG</SelectItem>
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
          {selectedModel !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Modelo: {selectedModel}
            </Badge>
          )}
          {fvgCount !== "all" && (
            <Badge variant="secondary" className="text-xs">
              FVGs: {fvgCount}
            </Badge>
          )}
          {entrySubtype !== "all" && (
            <Badge variant="secondary" className="text-xs">
              {entrySubtype}
            </Badge>
          )}
          {continuationSubtype !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Cont: {continuationSubtype}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
