
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandling } from './use-error-handling';
import { subscribeToChanges, unsubscribeFromChanges } from '@/utils/supabase-realtime';
import { RealtimeChannel } from '@supabase/supabase-js';

// Define available tables as a union type
type SupabaseTables = 
  | 'prompt_categories'
  | 'admin_users'
  | 'api_settings'
  | 'payment_failures'
  | 'profiles'
  | 'prompts'
  | 'saved_prompts'
  | 'stripe_events'
  | 'subscription_events'
  | 'subscription_plans'
  | 'theme_settings'
  | 'user_prompt_usage'
  | 'user_purchases'
  | 'user_subscriptions'
  | 'active_subscriptions';

interface FetchOptions<T> {
  table: SupabaseTables; // Use the union type instead of string
  select?: string;
  order?: { column: string; ascending?: boolean };
  filter?: { column: string; value: any; operator?: string };
  limit?: number;
  single?: boolean;
  errorTitle?: string;
  formatResult?: (data: any) => T[];
}

export function useSupabaseQuery<T>(options: FetchOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const { error, isLoading, setIsLoading, handleError, withErrorHandling } = useErrorHandling({
    errorTitle: options.errorTitle || `Failed to load data from ${options.table}`,
  });

  // Default formatter just returns the data as is
  const defaultFormatter = useCallback((rawData: any) => rawData as T[], []);
  const formatter = options.formatResult || defaultFormatter;

  // Fetch data function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log(`Fetching data from ${options.table}...`);
      
      let query = supabase.from(options.table).select(options.select || '*');
      
      // Apply filter if provided
      if (options.filter) {
        const { column, value, operator = 'eq' } = options.filter;
        query = query[operator](column, value);
      }
      
      // Apply order if provided
      if (options.order) {
        const { column, ascending = true } = options.order;
        query = query.order(column, { ascending });
      }
      
      // Apply limit if provided
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      // Get single result if requested
      const { data: result, error } = options.single 
        ? await query.single() 
        : await query;
      
      if (error) {
        throw error;
      }
      
      const formattedData = formatter(options.single ? [result] : result);
      console.log(`Successfully fetched ${formattedData.length} items from ${options.table}`);
      setData(formattedData);
      
      return formattedData;
    } catch (error) {
      handleError(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [options, formatter, handleError, setIsLoading]);

  // Set up real-time subscription
  useEffect(() => {
    let subscription: RealtimeChannel | null = null;
    
    const setupSubscription = () => {
      subscription = subscribeToChanges(
        { 
          table: options.table,
          filter: options.filter 
            ? `${options.filter.column}=${options.filter.operator || 'eq'}.${options.filter.value}` 
            : undefined
        },
        () => {
          // Refetch data when there are changes
          fetchData();
        }
      );
    };
    
    // Initial fetch
    fetchData();
    
    // Setup subscription
    setupSubscription();
    
    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        unsubscribeFromChanges(subscription);
      }
    };
  }, [options.table, options.filter, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
