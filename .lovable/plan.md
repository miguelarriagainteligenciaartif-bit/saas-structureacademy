## Objetivo

Separar conceptualmente **Modelo de entrada** (M1 / M3 / Continuación) de **Patrón de entrada** (Env+Bloque / Env+FVG / FVG único), para poder filtrar por patrón y ver cuántos trades hay de cada modelo dentro de ese patrón.

## Definición del patrón (derivado, sin tocar BD)

Para cada trade, el patrón se calcula así:

| Condición | Patrón |
|---|---|
| `fvg_count === 1` | **FVG único** |
| Modelo M1/M3 y `entry_subtype === "Envolvente + Bloque"` | **Envolvente + Bloque** |
| Modelo M1/M3 y `entry_subtype === "Envolvente + FVG"` | **Envolvente + FVG** |
| Modelo Continuación y `continuation_subtype === "Bloque"` | **Envolvente + Bloque** |
| Modelo Continuación y `continuation_subtype === "FVG"` | **Envolvente + FVG** |
| Resto | sin patrón (no aparece al filtrar) |

`fvg_count = 1` tiene prioridad sobre el subtype, según tu regla: "si solo hay 1 FVG, entras en ese FVG sea cual sea el patrón".

## Cambios en la UI

1. **Reemplazar** el filtro actual "Bloque / FVG" (Envolvente+Bloque/FVG) y el filtro separado "Tipo continuación" por **un único filtro "Patrón de entrada"** con cuatro opciones:
   - Todos los patrones
   - Envolvente + Bloque
   - Envolvente + FVG
   - FVG único

2. Este filtro se muestra **siempre que haya cualquier modelo seleccionado** (M1, M3 o Continuación).

3. El filtro de **FVGs (1/2/3)** se mantiene como dimensión independiente (M1/M3 únicamente, como ahora).

4. El badge activo y la etiqueta del filtro reflejan el nuevo nombre.

## Cambios en la lógica (Index.tsx)

- Crear helper `getEntryPattern(trade)` que devuelve `"Envolvente + Bloque" | "Envolvente + FVG" | "FVG único" | null` según la tabla anterior.
- Sustituir las dos comprobaciones actuales (`filterEntrySubtype` y `filterContinuationSubtype`) por **una sola**: `filterPattern !== "all" && getEntryPattern(t) !== filterPattern`.
- Esta comprobación se aplica a M1, M3 y Continuación por igual.

## Resultado

- La tabla **Comparativa por Modelo** ya desglosa M1 / M3 / Continuación, así que al aplicar el filtro de patrón verás directamente cuántos trades de cada modelo entraron con ese patrón, su WR, P&L y EV.
- No hace falta crear ninguna tabla nueva ni migración de BD.

## Archivos a tocar

- `src/components/DashboardFilters.tsx` — nuevo selector "Patrón de entrada", quitar selector de Continuación independiente.
- `src/pages/Index.tsx` — helper `getEntryPattern`, reemplazar lógica de filtrado, renombrar estado (`filterEntrySubtype` + `filterContinuationSubtype` → `filterPattern`), actualizar badges.

## Lo que NO cambia

- El esquema de la BD (`trades.entry_subtype` y `trades.continuation_subtype` siguen igual).
- El formulario de registro de trades.
- El resto de filtros (fecha, hora, modelo, FVG count, cuenta).
