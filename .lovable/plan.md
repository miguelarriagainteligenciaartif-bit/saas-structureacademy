# Adaptar el sistema de filtros para los datos de Eric

## Objetivo

Permitir filtrar y analizar la base de Eric con la misma profundidad que su CSV original: por modelo, patrón, cantidad de FVG, resultado, tipo, noticia, drawdown y día de la semana — sin perder ningún trade en el proceso.

## Cambios

### 1. Corregir el mapeo de patrón de entrada (`src/lib/entryPattern.ts`)

Eric usa el subtipo `"FVG"` solo (sin "Envolvente +") en M1/M3. Hoy esos 50 trades quedan fuera del filtro de patrones.

Nueva regla:
- `fvg_count === 1` → `"FVG único"` (prioridad, igual que ahora)
- M1/M3 con `entry_subtype === "FVG"` y `fvg_count >= 2` → `"Envolvente + FVG"` (nuevo)
- Resto: igual que hoy

### 2. Ampliar `DashboardFilters.tsx` con 6 filtros nuevos

Manteniendo el patrón visual actual (botón outline + popover con checkboxes):

1. **Cantidad de FVG** — multi-select 1 / 2 / 3 (se oculta si solo Continuación)
2. **Resultado** — multi-select TP / SL
3. **Tipo de operación** — multi-select Compra / Venta
4. **Noticia** — Todos / Con noticia / Sin noticia
5. **Drawdown recorrido** — multi-select 0% / 33% / 50% / 66% / 100%
6. **Día de la semana** — multi-select Lun–Vie

Cada uno se aplica con AND, igual que los actuales. Badges resumen y botón "Limpiar" se extienden para incluirlos.

### 3. Cablear los filtros en las páginas que usan la barra

`src/pages/Index.tsx`, `src/pages/Analytics.tsx`, `src/pages/StreakTracker.tsx`:
- Añadir estados y props correspondientes.
- Extender el `.filter()` con los 6 nuevos predicados.
- El filtro de patrones se sigue evaluando con el nuevo `getEntryPattern` corregido.

### 4. Nueva matriz **Patrón × Modelo × FVG** en el Dashboard

Componente `PatternModelFvgMatrix.tsx` en `src/components/`, ubicado en el Dashboard (Index) bajo las StatsCards. Tabla pivote en vivo que respeta los filtros activos:

```text
                          M1            M3            Cont.   Total
                       1   2   3      1   2   3       —
Envolvente + Bloque    -   2   2      -   6  10       -       20
Envolvente + FVG       -   8   -      -  43   8      56      115
FVG único             38   -   -     99   -   -       -      137
Total                 38  10   2     99  49  18      56      ...
```

Cada celda muestra cantidad de trades. Tooltip opcional con Win Rate y EV de esa celda.

## Sección técnica

### Contrato extendido de `DashboardFiltersProps`

```ts
interface DashboardFiltersProps {
  // ...existentes
  fvgCounts: number[];                       // []  = todos
  results: ("TP" | "SL")[];
  tradeTypes: ("Compra" | "Venta")[];
  newsFilter: "all" | "with" | "without";
  drawdownLevels: number[];                  // [0, 0.33, 0.5, 0.66, 1]
  daysOfWeek: string[];
  onFvgCountsChange / onResultsChange / onTradeTypesChange /
  onNewsFilterChange / onDrawdownChange / onDaysChange
}
```

### Predicados de filtrado (cliente, sobre el array `trades`)

```ts
.filter(t => fvgCounts.length === 0 || fvgCounts.includes(t.fvg_count))
.filter(t => results.length === 0 || results.includes(t.result_type))
.filter(t => tradeTypes.length === 0 || tradeTypes.includes(t.trade_type))
.filter(t => newsFilter === "all"
  || (newsFilter === "with" && t.had_news)
  || (newsFilter === "without" && !t.had_news))
.filter(t => drawdownLevels.length === 0 || drawdownLevels.includes(t.drawdown))
.filter(t => daysOfWeek.length === 0 || daysOfWeek.includes(t.day_of_week))
```

### Datos requeridos

Todos los campos ya existen en la tabla `trades` (`fvg_count`, `result_type`, `trade_type`, `had_news`, `drawdown`, `day_of_week`). **No hay migración ni cambio de esquema.**

## Fuera de alcance

- Importador de CSV de Eric (se trata aparte cuando vayas a importar).
- Cambios en Backtesting (su esquema no tiene `fvg_count` ni `entry_subtype` según las memorias del proyecto).
- PDF / Reportes (se replicarán los filtros en una iteración posterior si lo pides).
