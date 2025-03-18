
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseTables } from '@/hooks/use-supabase-query';

// Type for subscription options
export interface SubscriptionOptions {
  table: SupabaseTables;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

// Type for callback function
export type SubscriptionCallback = (payload: any) => void;

// Map to track active subscriptions
const activeSubscriptions = new Map<string, RealtimeChannel>();

/**
 * Creates a unique channel name based on subscription options
 */
const createChannelName = (options: SubscriptionOptions): string => {
  const { table, schema = 'public', event = '*', filter = '' } = options;
  return `${schema}-${table}-${event}-${filter}-${Date.now()}`;
};

/**
 * Subscribe to real-time changes
 */
export const subscribeToChanges = (
  options: SubscriptionOptions,
  callback: SubscriptionCallback
): RealtimeChannel => {
  const { table, schema = 'public', event = '*', filter = '' } = options;
  const channelName = createChannelName(options);
  
  // Clean up any existing channels with the same name to avoid duplicates
  if (activeSubscriptions.has(channelName)) {
    supabase.removeChannel(activeSubscriptions.get(channelName)!);
    activeSubscriptions.delete(channelName);
  }
  
  console.log(`Setting up real-time subscription for ${table}`);
  
  // Create a new channel
  const channel = supabase.channel(channelName);
  
  // The correct way to set up postgres changes listener
  channel
    .on(
      'postgres_changes',
      {
        event: event,
        schema: schema,
        table: table,
        filter: filter || undefined
      },
      (payload) => {
        console.log(`Received change event for ${table}:`, payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`Subscription status for ${table}:`, status);
    });
  
  activeSubscriptions.set(channelName, channel);
  
  return channel;
};

/**
 * Unsubscribe from real-time changes
 */
export const unsubscribeFromChanges = (subscription: RealtimeChannel): void => {
  // Find the channel name for this subscription
  let channelNameToRemove: string | undefined;
  
  activeSubscriptions.forEach((sub, name) => {
    if (sub === subscription) {
      channelNameToRemove = name;
    }
  });
  
  if (channelNameToRemove) {
    console.log(`Cleaning up subscription for ${channelNameToRemove}`);
    activeSubscriptions.delete(channelNameToRemove);
  }
  
  supabase.removeChannel(subscription);
};

/**
 * Clean up all active subscriptions
 */
export const cleanupAllSubscriptions = (): void => {
  console.log(`Cleaning up all ${activeSubscriptions.size} active subscriptions`);
  
  activeSubscriptions.forEach((subscription) => {
    supabase.removeChannel(subscription);
  });
  
  activeSubscriptions.clear();
};
