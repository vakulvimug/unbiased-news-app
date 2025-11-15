-- Enable RLS on all tables
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Articles policies (public read)
CREATE POLICY "Anyone can view articles"
ON public.articles
FOR SELECT
USING (true);

-- Sources policies (public read)
CREATE POLICY "Anyone can view sources"
ON public.sources
FOR SELECT
USING (true);

-- Feedback policies (authenticated users can create)
CREATE POLICY "Authenticated users can create feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view feedback"
ON public.feedback
FOR SELECT
USING (true);