
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

export const VALIDATE_SUBSCRIPTION = `
-- Function to validate subscription data integrity
CREATE OR REPLACE FUNCTION public.validate_subscription_data(user_uuid UUID)
RETURNS TABLE (
  validation_check TEXT,
  result BOOLEAN,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_user_subscription BOOLEAN;
  has_events BOOLEAN;
  subscription_tier TEXT;
  event_count INTEGER;
BEGIN
  -- Check if user has a subscription record
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions 
    WHERE user_id = user_uuid
  ) INTO has_user_subscription;
  
  -- Return first validation result
  validation_check := 'User has subscription record';
  result := has_user_subscription;
  details := CASE WHEN has_user_subscription 
               THEN 'User has a subscription record' 
               ELSE 'User is missing a subscription record'
             END;
  RETURN NEXT;
  
  -- If no subscription record, exit early
  IF NOT has_user_subscription THEN
    RETURN;
  END IF;
  
  -- Check if subscription tier is valid
  SELECT tier INTO subscription_tier
  FROM public.user_subscriptions
  WHERE user_id = user_uuid;
  
  validation_check := 'Subscription tier is valid';
  result := subscription_tier IN ('free', 'pro', 'premium', 'enterprise');
  details := CASE WHEN result 
               THEN 'User has valid tier: ' || subscription_tier
               ELSE 'User has invalid tier: ' || COALESCE(subscription_tier, 'NULL')
             END;
  RETURN NEXT;
  
  -- Check if paid subscription has Stripe data
  IF subscription_tier != 'free' THEN
    validation_check := 'Paid subscription has Stripe data';
    result := EXISTS (
      SELECT 1 FROM public.user_subscriptions
      WHERE user_id = user_uuid
        AND stripe_customer_id IS NOT NULL
        AND stripe_subscription_id IS NOT NULL
    );
    details := CASE WHEN result 
                 THEN 'Paid subscription has valid Stripe data'
                 ELSE 'Paid subscription is missing Stripe data'
               END;
    RETURN NEXT;
  END IF;
  
  -- Check if user has subscription events
  SELECT EXISTS (
    SELECT 1 FROM public.subscription_events
    WHERE user_id = user_uuid
  ) INTO has_events;
  
  SELECT COUNT(*) INTO event_count
  FROM public.subscription_events
  WHERE user_id = user_uuid;
  
  validation_check := 'User has subscription event history';
  result := has_events;
  details := CASE WHEN has_events 
               THEN 'User has ' || event_count || ' subscription events' 
               ELSE 'User has no subscription events'
             END;
  RETURN NEXT;
  
  -- Check for payment failures if any
  validation_check := 'Payment failure tracking';
  result := EXISTS (
    SELECT 1 FROM public.payment_failures
    WHERE user_id = user_uuid
  );
  details := CASE WHEN result 
               THEN 'User has payment failure records' 
               ELSE 'No payment failures detected for user'
             END;
  RETURN NEXT;
  
  -- Add more validation checks as needed...
END;
$$;
`;
