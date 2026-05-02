-- Funding accounts table (evaluaciones y cuentas live)
CREATE TABLE public.funding_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  funding_company TEXT NOT NULL,
  account_label TEXT,
  account_type TEXT NOT NULL DEFAULT 'evaluation', -- 'evaluation' | 'live'
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'passed' | 'live' | 'failed' | 'closed'
  account_size NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  purchase_date DATE,
  passed_date DATE,
  funded_date DATE,
  closed_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.funding_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own funding accounts"
  ON public.funding_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own funding accounts"
  ON public.funding_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own funding accounts"
  ON public.funding_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own funding accounts"
  ON public.funding_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_funding_accounts_updated_at
  BEFORE UPDATE ON public.funding_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_funding_accounts_user ON public.funding_accounts(user_id);
CREATE INDEX idx_funding_accounts_status ON public.funding_accounts(status);

-- Payouts table (retiros recibidos de cuentas live)
CREATE TABLE public.funding_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  funding_account_id UUID NOT NULL REFERENCES public.funding_accounts(id) ON DELETE CASCADE,
  payout_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.funding_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payouts"
  ON public.funding_payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payouts"
  ON public.funding_payouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payouts"
  ON public.funding_payouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payouts"
  ON public.funding_payouts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_funding_payouts_updated_at
  BEFORE UPDATE ON public.funding_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_funding_payouts_user ON public.funding_payouts(user_id);
CREATE INDEX idx_funding_payouts_account ON public.funding_payouts(funding_account_id);