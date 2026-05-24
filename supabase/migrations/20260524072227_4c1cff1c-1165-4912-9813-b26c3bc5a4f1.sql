ALTER TABLE public.backtest_strategies
ADD COLUMN IF NOT EXISTS entry_patterns text[] NOT NULL DEFAULT ARRAY['Envolvente + Bloque','Envolvente + FVG','FVG']::text[];

ALTER TABLE public.backtest_trades
ADD COLUMN IF NOT EXISTS entry_pattern text;