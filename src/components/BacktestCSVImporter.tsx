import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

type DateFormat = "auto" | "dmy" | "mdy";

interface CsvRow {
  [key: string]: string | undefined;
}

interface ParsedTrade {
  date: string;
  day_of_week: string;
  week_of_month: number;
  entry_time: string;
  exit_time: string | null;
  trade_type: string;
  entry_model: string;
  result_type: string;
  result_dollars: number;
  had_news: boolean;
  news_description: string | null;
  max_rr: number | null;
  drawdown: number | null;
  image_link: string | null;
  no_trade_day: boolean;
  risk_percentage: number;
  asset: string;
}

interface PreviewRow {
  parsed: ParsedTrade;
  rawFecha: string;
  rawMes: string;
}

interface BacktestCSVImporterProps {
  onSuccess: () => void;
  strategyId: string;
}

const normalizeHeader = (v: any) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const MONTH_MAP: Record<string, number> = {
  JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6,
  JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
  ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6,
  JULIO: 7, AGOSTO: 8, SEPTIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12,
};

/** Parse dates like "October 2, 2025" or "2 de octubre de 2025" */
const parseNaturalDate = (raw: string): string | null => {
  const cleaned = raw.replace(/"/g, "").trim();
  // "Month Day, Year"
  const match1 = cleaned.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (match1) {
    const month = MONTH_MAP[match1[1].toUpperCase()];
    if (month) return parseDateFromParts(parseInt(match1[3]), month, parseInt(match1[2]));
  }
  // "Day de Month de Year"
  const match2 = cleaned.match(/^(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})$/i);
  if (match2) {
    const month = MONTH_MAP[match2[2].toUpperCase()];
    if (month) return parseDateFromParts(parseInt(match2[3]), month, parseInt(match2[1]));
  }
  // ISO "YYYY-MM-DD"
  const match3 = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match3) return `${match3[1]}-${match3[2]}-${match3[3]}`;
  return null;
};

/** Flexible column lookup: tries multiple aliases */
const COLUMN_ALIASES: Record<string, string[]> = {
  FECHA: ["FECHA", "FECHA OPERATIVA", "DATE", "TRADE DATE"],
  DIA: ["DIA", "DAY", "DAY OF WEEK"],
  SEMANA: ["SEMANA", "WEEK", "WEEK OF MONTH"],
  HORA_ENTRADA: ["HORA ENTRADA", "ENTRY TIME", "HORA"],
  HORA_SALIDA: ["HORA SALIDA EN 1:2", "HORA SALIDA", "EXIT TIME"],
  TIPO: ["TIPO", "DIRECCION", "DIRECTION", "SIDE", "TYPE"],
  MODELO: ["MODELO", "MODEL", "ENTRY MODEL", "EDUCADOR", "EDUCATOR"],
  RESULTADO: ["RESULTADO", "RESULT", "OUTCOME"],
  PNL: ["P&L", "PNL", "PROFIT", "PROFIT/LOSS", "R'S", "RS", "R S"],
  NOTICIA: ["NOTICIA", "NEWS"],
  RR_MAX: ["RR MAXIMO", "RR MAX", "MAX RR"],
  DRAWDOWN: ["DRAWDOWN", "DD"],
  LINK: ["LINK M1 (EJECUCION)", "LINK", "LINK TRADINGVIEW", "IMAGE", "SCREENSHOT"],
  ASSET: ["PAR OPERADO", "PAR", "ASSET", "SYMBOL", "INSTRUMENT", "TICKER"],
  MES: ["MES", "MONTH"],
};

const formatYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseDateFromParts = (year: number, month: number, day: number) => {
  const d = new Date(year, month - 1, day, 12, 0, 0, 0);
  return formatYmd(d);
};

const parseWeekOfMonth = (semana: string | undefined): number => {
  if (!semana) return 1;
  const cleaned = semana.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (cleaned.includes("1")) return 1;
  if (cleaned.includes("2")) return 2;
  if (cleaned.includes("3")) return 3;
  if (cleaned.includes("4")) return 4;
  if (cleaned.includes("5")) return 5;
  return 1;
};

const parseTime = (timeValue: any): string => {
  if (!timeValue) return "09:30:00";
  if (typeof timeValue === "string") {
    const match = timeValue.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const seconds = match[3] || "00";
      const lower = timeValue.toLowerCase();
      if (lower.includes("pm") && hours < 12) hours += 12;
      if (lower.includes("am") && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
    }
  }
  return "09:30:00";
};

const parsePnL = (value: any): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const str = String(value).replace(/[$,]/g, "").replace(/\s/g, "").trim();
  const num = parseFloat(str);
  return Number.isFinite(num) ? num : 0;
};

const parseNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const str = String(value).replace(/[^0-9.-]/g, "");
  const num = parseFloat(str);
  return Number.isFinite(num) ? num : null;
};

const mapTradeType = (tipo: string | undefined): string => {
  if (!tipo) return "Compra";
  const t = tipo.toUpperCase();
  if (t === "BUY" || t === "LONG" || t === "COMPRA") return "Compra";
  if (t === "SELL" || t === "SHORT" || t === "VENTA") return "Venta";
  return "Compra";
};

const mapDayOfWeek = (dia: string | undefined): string => {
  if (!dia) return "Lunes";
  const d = dia.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (d.includes("LUN") || d.includes("MON")) return "Lunes";
  if (d.includes("MAR") || d.includes("TUE")) return "Martes";
  if (d.includes("MIE") || d.includes("WED")) return "Miércoles";
  if (d.includes("JUE") || d.includes("THU")) return "Jueves";
  if (d.includes("VIE") || d.includes("FRI")) return "Viernes";
  return "Lunes";
};

const mapResultType = (resultado: string | undefined, pnl: number): string => {
  if (resultado) {
    const r = resultado.toUpperCase();
    if (r.includes("TP") || r.includes("WIN") || r.includes("PROFIT")) return "TP";
    if (r.includes("SL") || r.includes("LOSS") || r.includes("STOP")) return "SL";
    if (r.includes("BE") || r.includes("BREAK")) return "Break Even";
  }
  return pnl >= 0 ? "TP" : "SL";
};

const mapEntryModel = (modelo: string | undefined): string => {
  if (!modelo) return "M1";
  const m = modelo.toUpperCase();
  if (m.includes("M1")) return "M1";
  if (m.includes("M3")) return "M3";
  if (m.includes("CONT") || m.includes("CONTINUATION")) return "Continuación";
  return modelo;
};

const parseFechaWithMesGuarantee = (rawFecha: string, rawMes: string, fmt: Exclude<DateFormat, "auto">): string | null => {
  const parts = String(rawFecha ?? "").trim().split("/");
  if (parts.length !== 3) return null;
  const a = parseInt(parts[0], 10);
  const b = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(year)) return null;
  if (year < 100) year += year > 50 ? 1900 : 2000;
  const mes = parseInt(String(rawMes ?? ""), 10);
  if (!Number.isFinite(mes) || mes < 1 || mes > 12) return null;
  const day = fmt === "dmy" ? a : b;
  if (!Number.isFinite(day) || day < 1 || day > 31) return null;
  return parseDateFromParts(year, mes, day);
};

export function BacktestCSVImporter({ onSuccess, strategyId }: BacktestCSVImporterProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [dateFormat, setDateFormat] = useState<DateFormat>("auto");
  const [isDragging, setIsDragging] = useState(false);
  const [rawRows, setRawRows] = useState<CsvRow[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [rValue, setRValue] = useState<number>(1000);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const detectedAuto = useMemo<Exclude<DateFormat, "auto">>(() => {
    if (dateFormat !== "auto") return dateFormat;
    let dmyVotes = 0;
    let mdyVotes = 0;
    for (const r of rawRows.slice(0, 80)) {
      const rawFecha = String(getValue(r, "FECHA") ?? "").trim();
      if (!rawFecha.includes("/")) continue;
      const parts = rawFecha.split("/");
      if (parts.length !== 3) continue;
      const a = parseInt(parts[0], 10);
      const b = parseInt(parts[1], 10);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      if (a > 12 && a <= 31) dmyVotes += 2;
      if (b > 12 && b <= 31) mdyVotes += 2;
    }
    return mdyVotes > dmyVotes ? "mdy" : "dmy";
  }, [dateFormat, rawRows]);

  function getValue(row: CsvRow, aliasKey: string) {
    const aliases = COLUMN_ALIASES[aliasKey];
    if (aliases) {
      for (const alias of aliases) {
        const desired = normalizeHeader(alias);
        for (const [k, v] of Object.entries(row)) {
          if (normalizeHeader(k) === desired) return v;
        }
      }
      return undefined;
    }
    // Fallback: direct header match
    const desired = normalizeHeader(aliasKey);
    for (const [k, v] of Object.entries(row)) {
      if (normalizeHeader(k) === desired) return v;
    }
    return undefined;
  }

  const resetState = () => {
    setErrors([]);
    setProgress(0);
    setRawRows([]);
    setPreviewRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseRowToTrade = (r: CsvRow, fmt: Exclude<DateFormat, "auto">): ParsedTrade | null => {
    const rawFecha = String(getValue(r, "FECHA") ?? "").trim();
    if (!rawFecha) return null;

    const rawMes = String(getValue(r, "MES") ?? "").trim();
    let dateStr: string | null = null;

    // Try MES-guaranteed first
    if (rawMes) dateStr = parseFechaWithMesGuarantee(rawFecha, rawMes, fmt);

    // Try natural language date ("October 2, 2025", "2 de octubre de 2025")
    if (!dateStr) dateStr = parseNaturalDate(rawFecha);

    // Try DD/MM/YYYY or MM/DD/YYYY
    if (!dateStr) {
      const parts = rawFecha.split("/");
      if (parts.length === 3) {
        const a = parseInt(parts[0], 10);
        const b = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(year)) {
          if (year < 100) year += year > 50 ? 1900 : 2000;
          const day = fmt === "dmy" ? a : b;
          const month = fmt === "dmy" ? b : a;
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            dateStr = parseDateFromParts(year, month, day);
          }
        }
      }
    }

    if (!dateStr) return null;
    const year = parseInt(dateStr.split("-")[0], 10);
    if (year < 2000) return null;

    // Derive day of week from parsed date
    const parsedDate = new Date(dateStr + "T12:00:00");
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const derivedDay = dayNames[parsedDate.getDay()] || "Lunes";

    const pnl = parsePnL(getValue(r, "PNL")) * rValue;
    const asset = getValue(r, "ASSET") ?? "";
    return {
      date: dateStr,
      day_of_week: getValue(r, "DIA") ? mapDayOfWeek(getValue(r, "DIA")) : derivedDay,
      week_of_month: parseWeekOfMonth(getValue(r, "SEMANA")),
      entry_time: parseTime(getValue(r, "HORA_ENTRADA")),
      exit_time: getValue(r, "HORA_SALIDA") ? parseTime(getValue(r, "HORA_SALIDA")) : null,
      trade_type: mapTradeType(getValue(r, "TIPO")),
      entry_model: mapEntryModel(getValue(r, "MODELO")),
      result_type: mapResultType(getValue(r, "RESULTADO"), pnl),
      result_dollars: pnl,
      had_news: false,
      news_description: getValue(r, "NOTICIA") && !String(getValue(r, "NOTICIA")).toUpperCase().includes("NO NEWS") ? String(getValue(r, "NOTICIA")) : null,
      max_rr: parseNumber(getValue(r, "RR_MAX")),
      drawdown: parseNumber(getValue(r, "DRAWDOWN")),
      image_link: getValue(r, "LINK") ?? null,
      no_trade_day: false,
      risk_percentage: 1,
      asset: asset || "Nasdaq 100",
    };
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setErrors([]);
    setRawRows([]);
    setPreviewRows([]);
    setIsDragging(false);

    try {
      const text = await file.text();
      const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: "greedy" });
      if (parsed.errors?.length) {
        setErrors(parsed.errors.slice(0, 5).map((e) => `CSV: ${e.message}`));
      }
      const rows = (parsed.data ?? []).filter((r) => Object.keys(r ?? {}).length > 0);
      setRawRows(rows);

      const fmt = dateFormat === "auto" ? detectedAuto : dateFormat;
      const previews: PreviewRow[] = [];
      let valid = 0;

      for (const r of rows) {
        const trade = parseRowToTrade(r, fmt);
        if (!trade) continue;
        valid++;
        if (previews.length < 50) {
          previews.push({
            parsed: trade,
            rawFecha: String(getValue(r, "FECHA") ?? "").trim(),
            rawMes: String(getValue(r, "MES") ?? "").trim(),
          });
        }
      }

      toast.info(`CSV: ${rows.length} filas · ${valid} operaciones válidas`);
      setPreviewRows(previews);
      if (valid === 0) {
        setErrors((prev) => [...prev, "No se pudieron detectar operaciones válidas."]);
      }
    } catch (err) {
      console.error("CSV read error:", err);
      setErrors(["Error al leer el archivo. Asegúrate de que es un CSV válido."]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!loading && !importing) setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (loading || importing) return;
    const file = e.dataTransfer.files[0];
    if (!file?.name.toLowerCase().endsWith('.csv')) { toast.error("Por favor, arrastra un archivo CSV"); return; }
    await processFile(file);
  };

  const handleImport = async () => {
    if (previewRows.length === 0) return;
    setImporting(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Debes iniciar sesión"); return; }

      const fmt = dateFormat === "auto" ? detectedAuto : dateFormat;
      const parsedTrades: ParsedTrade[] = [];
      for (const r of rawRows) {
        const trade = parseRowToTrade(r, fmt);
        if (trade) parsedTrades.push(trade);
      }

      const batchSize = 50;
      let imported = 0;
      const importErrors: string[] = [];
      const totalBatches = Math.ceil(parsedTrades.length / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const batch = parsedTrades.slice(i * batchSize, (i + 1) * batchSize);
        const insertData = batch.map((trade) => ({
          ...trade,
          user_id: user.id,
          strategy_id: strategyId,
        }));

        const { error } = await supabase.from("backtest_trades").insert(insertData);
        if (error) {
          importErrors.push(`Lote ${i + 1}: ${error.message}`);
        } else {
          imported += batch.length;
        }
        setProgress(Math.round(((i + 1) / totalBatches) * 100));
      }

      if (importErrors.length > 0) {
        toast.error(`Errores: ${importErrors.length} lotes fallaron`);
        setErrors(importErrors);
      } else {
        toast.success(`Se importaron ${imported} operaciones de backtesting`);
        setOpen(false);
        resetState();
        onSuccess();
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Error durante la importación");
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Operaciones de Backtesting desde CSV
          </DialogTitle>
          <DialogDescription>Sube un archivo CSV con tus operaciones de backtesting. Se asignarán a la estrategia seleccionada.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardContent className="pt-6">
              <div ref={dropZoneRef} className="flex items-center justify-center w-full" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/10" : "hover:bg-muted/50"}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`h-8 w-8 mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="mb-2 text-sm text-muted-foreground">
                      {isDragging ? <span className="font-semibold text-primary">Suelta el archivo aquí</span> : <><span className="font-semibold">Click para seleccionar</span> o arrastra un archivo</>}
                    </p>
                    <p className="text-xs text-muted-foreground">.csv</p>
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={handleFileSelect} disabled={loading || importing} />
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Formato de fecha</p>
              <p className="text-xs text-muted-foreground">Si tus fechas son tipo 7/8/2025, selecciona el formato correcto.</p>
            </div>
            <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as DateFormat)}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detectar</SelectItem>
                <SelectItem value="dmy">Día/Mes/Año</SelectItem>
                <SelectItem value="mdy">Mes/Día/Año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Valor de 1R en dólares</p>
              <p className="text-xs text-muted-foreground">Si la columna R's muestra múltiplos (ej: 1R = $1,000), ajusta aquí.</p>
            </div>
            <input
              type="number"
              min={1}
              value={rValue}
              onChange={(e) => setRValue(parseFloat(e.target.value) || 1)}
              className="w-full sm:w-[220px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {loading && <div className="text-center py-4"><p className="text-muted-foreground">Procesando archivo...</p></div>}

          {errors.length > 0 && (
            <Card className="border-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />Errores encontrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {errors.slice(0, 6).map((err, i) => <li key={i}>• {err}</li>)}
                  {errors.length > 6 && <li>...y {errors.length - 6} más</li>}
                </ul>
              </CardContent>
            </Card>
          )}

          {previewRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Vista previa ({Math.min(previewRows.length, 50)} filas)
                </CardTitle>
                <CardDescription>
                  Auto: <span className="font-medium">{detectedAuto === "dmy" ? "Día/Mes/Año" : "Mes/Día/Año"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>CSV</TableHead>
                        <TableHead>Día</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead className="text-right">P&L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.slice(0, 10).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-mono">{r.parsed.date}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{r.rawFecha}</TableCell>
                          <TableCell className="text-xs">{r.parsed.day_of_week}</TableCell>
                          <TableCell className="text-xs">{r.parsed.asset}</TableCell>
                          <TableCell><Badge variant={r.parsed.trade_type === "Compra" ? "default" : "secondary"} className="text-xs">{r.parsed.trade_type}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{r.parsed.entry_model}</Badge></TableCell>
                          <TableCell><Badge variant={r.parsed.result_type === "TP" ? "default" : "destructive"} className="text-xs">{r.parsed.result_type}</Badge></TableCell>
                          <TableCell className={`text-right text-xs font-mono ${r.parsed.result_dollars >= 0 ? "text-success" : "text-destructive"}`}>${r.parsed.result_dollars.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">Importando... {progress}%</p>
            </div>
          )}

          {!importing && previewRows.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetState}><X className="h-4 w-4 mr-2" />Cancelar</Button>
              <Button onClick={handleImport}><Upload className="h-4 w-4 mr-2" />Importar</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
