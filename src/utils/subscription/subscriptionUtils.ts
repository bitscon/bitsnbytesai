
import { format, isValid } from 'date-fns';
import { SubscriptionTier } from '@/types/subscription';

/**
 * Formats a date string for display
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  if (!isValid(date)) {
    return 'Invalid date';
  }
  
  return format(date, 'MMM d, yyyy');
};

/**
 * Gets a human-readable name for a subscription tier
 */
export const getTierName = (tier: SubscriptionTier): string => {
  const tierNames: Record<SubscriptionTier, string> = {
    'free': 'Free',
    'pro': 'Pro',
    'premium': 'Premium',
    'enterprise': 'Enterprise'
  };
  
  return tierNames[tier] || tier;
};

/**
 * Checks if the user has sufficient tier access for a required tier
 */
export const hasTierAccess = (userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean => {
  const tierLevels: Record<SubscriptionTier, number> = {
    'free': 0,
    'pro': 1,
    'premium': 2,
    'enterprise': 3
  };
  
  return tierLevels[userTier] >= tierLevels[requiredTier];
};

/**
 * Calculate discount percentage between monthly and yearly pricing
 */
export const calculateYearlyDiscount = (monthlyPrice: number, yearlyPrice: number): number => {
  if (monthlyPrice <= 0 || yearlyPrice <= 0) return 0;
  
  const monthlyTotal = monthlyPrice * 12;
  const yearlyTotal = yearlyPrice;
  
  if (yearlyTotal >= monthlyTotal) return 0;
  
  const savings = monthlyTotal - yearlyTotal;
  const discountPercentage = (savings / monthlyTotal) * 100;
  
  return Math.round(discountPercentage);
};

/**
 * Format a currency value
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
