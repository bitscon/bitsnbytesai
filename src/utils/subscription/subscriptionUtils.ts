
import { SubscriptionTier } from '@/types/subscription';
import { format } from 'date-fns';

/**
 * Gets the formatted display name for a subscription tier
 */
export const getTierName = (tier: SubscriptionTier): string => {
  switch (tier) {
    case 'free':
      return 'Free';
    case 'pro':
      return 'Pro';
    case 'premium':
      return 'Premium';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Unknown';
  }
};

/**
 * Formats a date string into a more readable format
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'MMM d, yyyy');
};

/**
 * Defines subscription tier levels for comparison
 */
export const tierLevels: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
  enterprise: 3
};

/**
 * Checks if a user's tier has access to a required tier
 */
export const checkTierAccess = (
  userTier: SubscriptionTier | undefined,
  requiredTier: SubscriptionTier
): boolean => {
  if (!userTier) return false;
  return tierLevels[userTier] >= tierLevels[requiredTier];
};
