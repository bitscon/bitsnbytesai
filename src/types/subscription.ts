
export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise';

export interface SubscriptionFeature {
  description: string;
  [key: string]: any;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  stripe_product_id?: string;
  features: any; // Kept as any to allow for various formats from the database
  created_at?: string;
  updated_at?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
}

export interface PromptUsage {
  count: number;
  month: number;
  year: number;
}

// Helper functions for subscription management
export const getTierLevel = (tier: SubscriptionTier): number => {
  const tierLevels: Record<SubscriptionTier, number> = {
    'free': 0,
    'pro': 1,
    'premium': 2,
    'enterprise': 3
  };
  
  return tierLevels[tier] || 0;
};

export const isUpgrade = (currentTier: SubscriptionTier, newTier: SubscriptionTier): boolean => {
  return getTierLevel(newTier) > getTierLevel(currentTier);
};

export const isDowngrade = (currentTier: SubscriptionTier, newTier: SubscriptionTier): boolean => {
  return getTierLevel(newTier) < getTierLevel(currentTier);
};

export const getChangeType = (currentTier: SubscriptionTier, newTier: SubscriptionTier): 'upgrade' | 'downgrade' | 'same' => {
  if (isUpgrade(currentTier, newTier)) return 'upgrade';
  if (isDowngrade(currentTier, newTier)) return 'downgrade';
  return 'same';
};
