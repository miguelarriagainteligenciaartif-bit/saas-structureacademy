ALTER TABLE public.backtest_strategies
  ADD COLUMN IF NOT EXISTS entry_models text[] NOT NULL DEFAULT ARRAY['M1','M3','Continuación']::text[];