UPDATE public.trades
SET entry_subtype = 'FVG'
WHERE user_id = '811024b5-af48-4b9b-8dcf-7a81dfe0cffb'
  AND fvg_count IN (1, 2)
  AND (entry_subtype IS DISTINCT FROM 'FVG');