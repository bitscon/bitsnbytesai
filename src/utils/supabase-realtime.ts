
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionCallbacks {
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onError?: (error: any) => void;
}

/**
 * Subscribes to real-time changes on a specific table
 * @param table The table name to subscribe to
 * @param callbacks Object containing callbacks for insert, update, delete events
 * @param schema Optional schema name, defaults to "public"
 * @returns A function to unsubscribe from the real-time changes
 */
export function subscribeToTable(
  table: string, 
  callbacks: SubscriptionCallbacks, 
  schema = 'public'
): () => void {
  let channel: RealtimeChannel | null = null;
  
  try {
    channel = supabase
      .channel(`table-changes-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema,
          table,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && callbacks.onInsert) {
            callbacks.onInsert(payload);
          } else if (payload.eventType === 'UPDATE' && callbacks.onUpdate) {
            callbacks.onUpdate(payload);
          } else if (payload.eventType === 'DELETE' && callbacks.onDelete) {
            callbacks.onDelete(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED' && callbacks.onError) {
          callbacks.onError(`Failed to subscribe: ${status}`);
        }
      });
  } catch (error) {
    if (callbacks.onError) {
      callbacks.onError(error);
    }
  }

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}
