-- Add notes column to trades table
ALTER TABLE public.trades 
ADD COLUMN notes TEXT;

-- Add notes column to backtest_trades table
ALTER TABLE public.backtest_trades 
ADD COLUMN notes TEXT;

-- Add comment to describe the columns
COMMENT ON COLUMN public.trades.notes IS 'User notes and comments about the trade';
COMMENT ON COLUMN public.backtest_trades.notes IS 'User notes and comments about the backtest trade';