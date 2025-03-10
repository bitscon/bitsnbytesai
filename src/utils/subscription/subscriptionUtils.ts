
import { SubscriptionTier } from '@/types/subscription';

/**
 * Checks if a user tier has access to a required tier
 */
export function hasTierAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierLevels: Record<SubscriptionTier, number> = {
    'free': 0,
    'pro': 1,
    'premium': 2,
    'enterprise': 3
  };
  
  return tierLevels[userTier] >= tierLevels[requiredTier];
}

/**
 * Gets a user-friendly name for a subscription tier
 */
export function getTierName(tier: SubscriptionTier): string {
  const tierNames: Record<SubscriptionTier, string> = {
    'free': 'Free',
    'pro': 'Pro',
    'premium': 'Premium',
    'enterprise': 'Enterprise'
  };
  
  return tierNames[tier] || 'Unknown';
}

/**
 * Formats a date string in a user-friendly format
 */
export function formatDate(date?: string): string {
  if (!date) return 'N/A';
  
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Calculates the percentage saved with yearly billing
 */
export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  if (monthlyPrice <= 0 || yearlyPrice <= 0) return 0;
  
  const monthlyCostPerYear = monthlyPrice * 12;
  const savings = monthlyCostPerYear - yearlyPrice;
  
  return Math.round((savings / monthlyCostPerYear) * 100);
}

/**
 * Checks if a tier change is an upgrade, downgrade, or the same
 */
export function getTierChangeType(
  currentTier: SubscriptionTier, 
  newTier: SubscriptionTier
): 'upgrade' | 'downgrade' | 'same' {
  const tierLevels: Record<SubscriptionTier, number> = {
    'free': 0,
    'pro': 1,
    'premium': 2,
    'enterprise': 3
  };
  
  if (tierLevels[newTier] > tierLevels[currentTier]) {
    return 'upgrade';
  } else if (tierLevels[newTier] < tierLevels[currentTier]) {
    return 'downgrade';
  } else {
    return 'same';
  }
}

/**
 * Gets the appropriate text for a tier change button
 */
export function getTierActionText(
  newTier: SubscriptionTier, 
  currentTier: SubscriptionTier | undefined
): string {
  if (!currentTier) return `Subscribe to ${getTierName(newTier)}`;
  
  const changeType = getTierChangeType(currentTier, newTier);
  
  switch (changeType) {
    case 'upgrade':
      return `Upgrade to ${getTierName(newTier)}`;
    case 'downgrade':
      return `Downgrade to ${getTierName(newTier)}`;
    case 'same':
      return `Change to ${getTierName(newTier)}`;
  }
}
