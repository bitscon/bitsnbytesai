
export const CREATE_SUBSCRIPTION_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  old_tier TEXT,
  new_tier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Add RLS policy to restrict access to admins
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Only admins can access this table
DROP POLICY IF EXISTS "Admin users can access subscription events" ON public.subscription_events;
CREATE POLICY "Admin users can access subscription events" 
  ON public.subscription_events 
  USING (is_admin_user());
`;

export const CREATE_PAYMENT_FAILURES_TABLE = `
CREATE TABLE IF NOT EXISTS public.payment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_id TEXT,
  payment_intent_id TEXT,
  amount NUMERIC,
  currency TEXT,
  reason TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Add RLS policy to restrict access to admins
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;

-- Only admins can access this table
DROP POLICY IF EXISTS "Admin users can access payment failures" ON public.payment_failures;
CREATE POLICY "Admin users can access payment failures" 
  ON public.payment_failures 
  USING (is_admin_user());
`;

export const CREATE_SUBSCRIPTION_EVENTS_FUNCTION = `
CREATE OR REPLACE FUNCTION public.create_subscription_events_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the subscription_events table if it doesn't exist
  ${CREATE_SUBSCRIPTION_EVENTS_TABLE}
END;
$$;
`;

export const CREATE_PAYMENT_FAILURES_FUNCTION = `
CREATE OR REPLACE FUNCTION public.create_payment_failures_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the payment_failures table if it doesn't exist
  ${CREATE_PAYMENT_FAILURES_TABLE}
END;
$$;
`;
