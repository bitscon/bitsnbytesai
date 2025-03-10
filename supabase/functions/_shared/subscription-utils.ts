import { supabaseAdmin } from "./supabase-admin.ts";

// Helper function to determine if the old tier is higher than the new tier
export const isDowngrade = (oldTier: string, newTier: string): boolean => {
  const tierLevels: Record<string, number> = {
    'free': 0,
    'pro': 1,
    'premium': 2,
    'enterprise': 3
  };

  return tierLevels[oldTier] > tierLevels[newTier];
};

// Helper function to determine tier from Stripe Price ID
export const determineTierFromStripePriceId = async (priceId: string): Promise<string> => {
  try {
    // Query our subscription_plans table to find the tier for this price ID
    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('tier')
      .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single();
    
    if (error || !data) {
      console.error('Error determining tier from price ID:', error);
      return 'free'; // Default to free tier if we can't determine
    }
    
    return data.tier;
  } catch (error) {
    console.error(`Error determining tier from price ID ${priceId}:`, error);
    return 'free'; // Default to free tier if we can't determine
  }
};

// Helper function to get a subscription plan by ID
export const getPlanById = async (planId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (error) {
      console.error('Error fetching plan by ID:', error);
      return null;
    }
    
    // Transform features if needed
    if (data && typeof data.features === 'string') {
      data.features = JSON.parse(data.features);
    }
    
    return data;
  } catch (error) {
    console.error(`Error in getPlanById for ${planId}:`, error);
    return null;
  }
};
