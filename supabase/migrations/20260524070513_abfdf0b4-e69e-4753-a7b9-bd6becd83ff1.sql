ALTER TABLE public.backtest_trades
  ALTER COLUMN entry_time DROP NOT NULL,
  ALTER COLUMN trade_type DROP NOT NULL,
  ALTER COLUMN entry_model DROP NOT NULL,
  ALTER COLUMN result_type DROP NOT NULL,
  ALTER COLUMN result_dollars DROP NOT NULL;