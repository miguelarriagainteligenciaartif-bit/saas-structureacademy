
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS fvg_count integer NULL;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS entry_subtype text NULL;
