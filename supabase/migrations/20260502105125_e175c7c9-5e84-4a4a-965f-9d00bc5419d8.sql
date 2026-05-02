CREATE TABLE public.funding_company_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  funding_company TEXT NOT NULL,
  total_evaluations INTEGER NOT NULL DEFAULT 0,
  total_passed INTEGER NOT NULL DEFAULT 0,
  total_failed INTEGER NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, funding_company)
);

ALTER TABLE public.funding_company_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company summary"
  ON public.funding_company_summary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own company summary"
  ON public.funding_company_summary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own company summary"
  ON public.funding_company_summary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own company summary"
  ON public.funding_company_summary FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_funding_company_summary_updated_at
  BEFORE UPDATE ON public.funding_company_summary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_funding_company_summary_user ON public.funding_company_summary(user_id);