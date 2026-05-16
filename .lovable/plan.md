# Adaptar los filtros a los datos importados de Eric

## Buena noticia primero

Los filtros que ya tienes (`DashboardFilters.tsx`) **son 100% compatibles** con los datos de Eric tal cual están. No hay que cambiar nada para que funcionen:

| Filtro actual | Campo de Eric que ya filtra |
|---|---|
| Desde / Hasta (fecha) | `FECHA` |
| Hora desde / hasta | `HORA ENTRADA` |
| Todos los modelos (M1 / M3 / Continuación) | `MODELO` |
| Todos los patrones (Envolvente+Bloque / Envolvente+FVG / FVG único) | Derivado de `ENTRY_SUBTYPE` + `CONTINUATION_SUBTYPE` + `FVG_COUNT` vía `getEntryPattern()` |

Coinciden porque Eric usa exactamente los mismos enums que tu app. La única condición es que en la importación se respeten los nombres (M1, M3, Continuación / Envolvente + Bloque, Envolvente + FVG / valor numérico en FVG_COUNT).

## Qué se puede **añadir** para exprimir los datos de Eric

Eric trae 4 dimensiones que hoy no tienes como filtro y que valdría la pena exponer en la barra:

1. **Resultado** (TP / SL) — campo `RESULTADO`
2. **Tipo de operación** (Compra / Venta) — campo `TIPO`
3. **Noticia** (Con noticia / Sin noticia / Todos) — campo `NOTICIA` (T/F)
4. **Drawdown recorrido** (0% / 33% / 50% / 66% / 100%, multi-select) — campo `DRAWDOWN`
5. *(Opcional)* **Día de la semana** (Lun–Vie, multi-select) — campo `DIA`

Estos cinco filtros, combinados con los actuales, te permiten responder preguntas tipo:
- "¿Cuál es mi win rate solo en Continuación + Bloque, en días con noticia, los viernes?"
- "¿Cómo rinde M3 cuando el drawdown es 50% o más?"
- "¿Las ventas en la primera media hora tienen mejor EV que las compras?"

## Cómo se implementaría (sección técnica)

### Cambios en `DashboardFilters.tsx`

Añadir cuatro/cinco popovers más con el mismo patrón visual (botón outline + checkbox list), siguiendo el estilo de "Todos los modelos / Todos los patrones":

```text
[Filter] [Desde] [Hasta] [Hora—Hora] [Modelos▾] [Patrones▾]
        [Resultado▾] [Tipo▾] [Noticia▾] [Drawdown▾] [Día▾] [Limpiar]
```

Cada nuevo filtro sigue la misma convención que ya usas:
- `[]` vacío o "todos seleccionados" = sin filtrar
- Borde primary cuando hay selección parcial
- Badge resumen al final de la fila

### Extensión del contrato de props

```ts
interface DashboardFiltersProps {
  // ...existentes
  results: ("TP" | "SL")[];
  tradeTypes: ("Compra" | "Venta")[];
  newsFilter: "all" | "with" | "without";
  drawdownLevels: number[];   // [0, 0.33, 0.5, 0.66, 1]
  daysOfWeek: string[];       // ["Lunes",...,"Viernes"]
  onResultsChange / onTradeTypesChange / onNewsFilterChange / onDrawdownChange / onDaysChange
}
```

### Lógica de filtrado (en el hook/page que consume los trades)

Añadir cinco predicados extra al `.filter()` ya existente:

```ts
.filter(t => results.length === 0 || results.includes(t.result))
.filter(t => tradeTypes.length === 0 || tradeTypes.includes(t.trade_type))
.filter(t => newsFilter === "all"
  || (newsFilter === "with" && t.has_news)
  || (newsFilter === "without" && !t.has_news))
.filter(t => drawdownLevels.length === 0 || drawdownLevels.includes(t.drawdown))
.filter(t => daysOfWeek.length === 0 || daysOfWeek.includes(t.day_of_week))
```

### Pre-requisito de datos

El filtro de **Drawdown** depende de que en la importación se mapee `0 / 0.33 / 0.5 / 0.66 / 1` al enum de tu app (lo identificamos en el análisis anterior). Si tu enum guarda `"0%" | "33%" | "50%" | "66%" | "100%"` como string, el filtro trabaja con strings; si guarda decimales, con números. Cualquiera funciona, solo hay que decidir una vez.

## Decisión pendiente

Antes de implementar quiero confirmar contigo:

1. ¿Añadimos los **5** filtros nuevos (Resultado, Tipo, Noticia, Drawdown, Día) o solo un subconjunto?
2. ¿Aplica este nuevo set de filtros **solo al Dashboard** o también a Backtesting / Analytics / Streak Tracker / generación de PDF? (la barra `DashboardFilters` hoy es transversal a la mayoría de vistas analíticas)
