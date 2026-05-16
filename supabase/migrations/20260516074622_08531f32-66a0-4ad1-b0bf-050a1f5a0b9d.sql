-- Allow NULL on fields that are meaningless for no_trade_day records
ALTER TABLE public.trades ALTER COLUMN entry_model DROP NOT NULL;
ALTER TABLE public.trades ALTER COLUMN trade_type DROP NOT NULL;
ALTER TABLE public.trades ALTER COLUMN result_type DROP NOT NULL;
ALTER TABLE public.trades ALTER COLUMN entry_time DROP NOT NULL;

-- Clean up historical "no trade day" records ONLY for user miguelarriaga.com
-- (user_id 811024b5-af48-4b9b-8dcf-7a81dfe0cffb)
UPDATE public.trades
SET entry_model = NULL,
    trade_type = NULL,
    result_type = NULL,
    entry_time = NULL
WHERE user_id = '811024b5-af48-4b9b-8dcf-7a81dfe0cffb'
  AND no_trade_day = true;