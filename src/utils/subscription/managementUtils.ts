
import { invokeSupabaseFunction } from './paymentUtils';

/**
 * Manages an existing subscription (cancel, reactivate, open portal)
 */
export async function manageStripeSubscription(
  action: 'portal' | 'cancel' | 'reactivate',
  userId: string,
  customerId?: string,
  subscriptionId?: string
): Promise<{ success: boolean; message?: string; url?: string }> {
  try {
    const body: any = { 
      action,
      userId
    };
    
    if (customerId) body.customerId = customerId;
    if (subscriptionId) body.subscriptionId = subscriptionId;
    
    const result = await invokeSupabaseFunction('manage-subscription', { body });
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    const data = result.data;
    
    if (action === 'portal' && data?.url) {
      return { success: true, url: data.url };
    }
    
    return { 
      success: true, 
      message: action === 'cancel' 
        ? 'Subscription will be canceled at the end of the current billing period' 
        : 'Subscription has been reactivated'
    };
    
  } catch (error: any) {
    console.error(`Error in manageStripeSubscription (${action}):`, error);
    return { success: false, message: error.message };
  }
}

/**
 * Changes an existing subscription to a new plan
 */
export async function changeStripeSubscription(
  subscriptionId: string,
  userId: string,
  priceId: string,
  interval: 'month' | 'year'
): Promise<{ success: boolean; message?: string }> {
  try {
    const result = await invokeSupabaseFunction('update-subscription', {
      subscriptionId,
      userId,
      priceId,
      interval
    });
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    return { 
      success: true, 
      message: 'Subscription updated successfully' 
    };
    
  } catch (error: any) {
    console.error('Error in changeStripeSubscription:', error);
    return { success: false, message: error.message };
  }
}
