import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        username,
        full_name,
        avatar_url,
        website,
        updated_at
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching profile:", error);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: any) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error("Error updating profile:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error updating profile:", error);
    return false;
  }
};

export const getSubscription = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching subscription:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching subscription:", error);
    return null;
  }
};

export const createSubscription = async (userId: string, priceId: string, tier: string) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([
        { user_id: userId, price_id: priceId, tier: tier },
      ]);

    if (error) {
      console.error("Error creating subscription:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error creating subscription:", error);
    return null;
  }
};

export const updateSubscription = async (subscriptionId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId);

    if (error) {
      console.error("Error updating subscription:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error updating subscription:", error);
    return null;
  }
};

export const deleteSubscription = async (subscriptionId: string) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (error) {
      console.error("Error deleting subscription:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error deleting subscription:", error);
    return null;
  }
};

export const getActiveProductsWithPrices = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, prices(*)')
      .eq('active', true)
      .eq('prices.active', true)
      .order('metadata->order')
      .order('prices(unit_amount)', { ascending: false });

    if (error) {
      console.error("Error fetching products with prices:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching products with prices:", error);
    return null;
  }
};
