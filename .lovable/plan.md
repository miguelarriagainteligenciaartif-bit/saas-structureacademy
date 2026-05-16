## Objetivo

Crear una copia completa de los 455 trades de **Eric Ruiz** (`erick.bambino@hotmail.com`) en la cuenta de **otro usuario** (a confirmar), convirtiendo `entry_time`, `exit_time` y `news_time` de hora de **Madrid** a hora de **Nueva York**, respetando los cambios de horario de verano (DST) de cada zona.

Rango detectado: 455 trades entre **2024-01-02 y 2026-04-13**.

## Confirmaciones que necesito antes de ejecutar

1. **¿A qué cuenta copio los trades?** Veo estos candidatos en la base de datos:
   - `miguelarriaga@hotmail.com` (509 trades propios)
   - `arriagabringas@icloud.com` (455 trades — parece ya una copia previa)
   - O una cuenta nueva / vacía como `jasanti30@hotmail.com` (0 trades)
2. **¿Copio también los `account_id`?** Probablemente no, porque las cuentas (`accounts`) son del usuario origen. Mi propuesta por defecto: dejar `account_id = NULL` en la copia.
3. **¿Qué hago si el usuario destino ya tiene trades en esas mismas fechas?** Por defecto **no borro nada** y solo inserto los nuevos (con nuevos `id`).

## Reglas de conversión horaria (Madrid → Nueva York)

La diferencia entre Madrid y Nueva York es **normalmente -6h**, pero hay ~2 semanas al año en las que es **-5h** porque los cambios DST no coinciden:

- **Europa (Madrid)**: cambia el **último domingo de marzo** (a las 02:00 → 03:00) y el **último domingo de octubre** (a las 03:00 → 02:00).
- **EE.UU. (Nueva York)**: cambia el **segundo domingo de marzo** y el **primer domingo de noviembre**.

Ventanas con diferencia de **-5h** en lugar de -6h:
- Marzo: desde el 2º domingo de marzo (NY adelanta) hasta el último domingo de marzo (Madrid adelanta) → 2 semanas.
- Octubre/Noviembre: desde el último domingo de octubre (Madrid atrasa) hasta el 1er domingo de noviembre (NY atrasa) → ~1 semana.

Fechas exactas en el rango de los datos:

| Año | Ventana -5h (marzo) | Ventana -5h (oct/nov) |
|---|---|---|
| 2024 | 10 mar – 30 mar | 27 oct – 2 nov |
| 2025 | 09 mar – 29 mar | 26 oct – 1 nov |
| 2026 | 08 mar – 28 mar | 25 oct – 31 oct |

Fuera de esas ventanas → restar **6 horas**. Dentro → restar **5 horas**.

### Implementación técnica

En lugar de codificar manualmente las fechas, voy a usar PostgreSQL con timezones reales para evitar errores:

```sql
-- Para cada trade, construimos un timestamp en Madrid y lo convertimos a NY:
((date + entry_time) AT TIME ZONE 'Europe/Madrid') AT TIME ZONE 'America/New_York'
```

Esto le delega a Postgres el cálculo correcto del offset (incluyendo DST). Luego extraigo la nueva `date` y la nueva `entry_time` del resultado (y lo mismo para `exit_time`, `news_time`).

**Importante**: la conversión puede cambiar también la **fecha** del trade (ej. una entrada Madrid 03:30 pasa a NY 21:30 del día anterior). En esos casos también recalculo `day_of_week` y `week_of_month` con la nueva fecha NY.

## Pasos de ejecución (una vez confirmes el destino)

1. `INSERT INTO public.trades (...) SELECT ...` desde los 455 trades de Eric, con:
   - `id = gen_random_uuid()` (nuevos IDs)
   - `user_id = <usuario destino>`
   - `account_id = NULL`
   - `entry_time`, `exit_time`, `news_time`, `date`, `day_of_week`, `week_of_month` recalculados según la conversión TZ
   - resto de campos (modelo, subtipo, FVG, P&L, notas, etc.) **idénticos**
2. Verificación: contar filas insertadas (debe ser 455) y mostrar 5 ejemplos con horario original vs convertido para que valides.

## Lo que NO toco

- El esquema de la BD.
- Los trades originales de Eric (solo lectura).
- Las cuentas (`accounts`), checklists ni ninguna otra tabla.

---

**Para continuar necesito que me confirmes a qué usuario copio los trades** (de la lista del punto 1).
