const Papa = require("papaparse");

const rawCsv = `QUANTUM TRADING TRACKER - EXPORTACIÓN DE DATOS

=== RESUMEN GENERAL ===
P&L Total,$136000.00
Win Rate,43.7%
Total Operaciones,455
Trades Ganados (TP),199
Trades Perdidos (SL),256
Break Even,0
Promedio Ganancia,$1969.85
Promedio Pérdida,$1000.00
Expectativa,$298.90
Días Sin Entrada,0
Tasa de Ejecución,100.0%

=== ANÁLISIS POR MODELO ===
Modelo,Operaciones,P&L,Win Rate
M1,72,$24000.00,44.4%
  1 FVG,51,$15000.00,43.1%
  2 FVGs,18,$9000.00,50.0%
  3 FVGs,3,$0.00,33.3%
  Envolvente + Bloque,5,$1000.00,40.0%
  Envolvente + FVG,1,$-1000.00,0.0%
M3,231,$63000.00,42.9%
  1 FVG,136,$41000.00,43.4%
  2 FVGs,66,$0.00,34.8%
  3 FVGs,29,$22000.00,58.6%
  Envolvente + Bloque,27,$18000.00,55.6%
  Envolvente + FVG,14,$7000.00,50.0%
Continuación,152,$49000.00,44.7%
  Bloque,70,$8000.00,37.1%
  FVG,82,$41000.00,51.2%

=== ANÁLISIS POR DÍA ===
Día,Operaciones,P&L,Win Rate
Lunes,93,$33000.00,45.2%
Martes,110,$40000.00,46.4%
Miércoles,75,$33000.00,48.0%
Jueves,71,$16000.00,40.8%
Viernes,106,$14000.00,38.7%

=== ANÁLISIS POR SEMANA DEL MES ===
Semana,Operaciones,P&L,Win Rate
Semana 1,92,$16000.00,39.1%
Semana 2,118,$41000.00,45.8%
Semana 3,102,$39000.00,47.1%
Semana 4,107,$28000.00,42.1%
Semana 5,36,$12000.00,44.4%

=== DETALLE DE OPERACIONES ===
Fecha,Día,Semana,Hora Entrada,Hora Salida,Tipo,Modelo,FVG Count,Subtipo Entrada,Subtipo Continuación,Resultado,P&L,Max RR,Drawdown,Noticias,Descripción Noticias,Hora Noticias,Timing Ejecución,Notas,No Trade Day
2024-01-02,Martes,1,15:46:00,15:49:00,Venta,Continuación,,,Bloque,TP,$2000.00,,0.50,No,,,,,No
2024-01-02,Martes,1,16:12:00,16:12:00,Compra,M3,3,Envolvente + Bloque,,SL,$-1000.00,,1.00,No,,,,,No
2024-01-05,Viernes,1,15:41:00,15:50:00,Venta,M3,1,FVG,,SL,$-1000.00,,1.00,Sí,NFP,,,,No`;

let text = rawCsv;
text = text.replace(/^\uFEFF/, '');
const lines = text.split(/\r?\n/);
const headerIndex = lines.findIndex(line => {
  const u = line.toUpperCase();
  return u.includes("FECHA") && u.includes("TIPO");
});

if (headerIndex !== -1) {
  text = lines.slice(headerIndex).join("\n");
}

console.log("=== PARSED TEXT ===");
console.log(text);
console.log("===================");

const parsed = Papa.parse(text, {
  header: true,
  skipEmptyLines: "greedy",
  transformHeader: (h) => h,
});

console.log(parsed.errors);
console.log(parsed.data.length, "rows parsed");
