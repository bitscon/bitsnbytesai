
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth token to ensure this is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is an admin by directly querying the admin_users table
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    const isAdmin = !!adminData;
    
    if (adminError || !isAdmin) {
      console.error("Admin check error:", adminError);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Stripe API key
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get request parameters
    const { direction = 'both' } = await req.json() || {};
    
    let result;
    
    if (direction === 'to_stripe' || direction === 'both') {
      // Sync our plans to Stripe
      const toStripeResult = await syncPlansToStripe(stripe);
      result = { ...result, to_stripe: toStripeResult };
    }
    
    if (direction === 'from_stripe' || direction === 'both') {
      // Sync Stripe products to our plans
      const fromStripeResult = await syncPlansFromStripe(stripe);
      result = { ...result, from_stripe: fromStripeResult };
    }

    return new Response(
      JSON.stringify({
        success: true,
        result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Check if user is an admin
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc('is_admin_user');
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error("Exception in checkIfUserIsAdmin:", error);
    return false;
  }
}

// Sync our subscription plans to Stripe
async function syncPlansToStripe(stripe: Stripe) {
  try {
    // Get all subscription plans from our database
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*');
    
    if (error) {
      throw new Error(`Error fetching plans: ${error.message}`);
    }
    
    const results = [];
    
    // Process each plan
    for (const plan of plans) {
      // Skip the free tier - no need to create a product for it
      if (plan.tier === 'free') {
        results.push({
          plan_id: plan.id,
          tier: plan.tier,
          status: 'skipped',
          message: 'Free tier does not need a Stripe product'
        });
        continue;
      }
      
      let product;
      
      // If we already have a product ID stored, retrieve and update that product
      if (plan.stripe_product_id) {
        try {
          product = await stripe.products.retrieve(plan.stripe_product_id);
          
          // Update the product if needed
          if (product.name !== plan.name || product.active !== plan.is_visible) {
            product = await stripe.products.update(plan.stripe_product_id, {
              name: plan.name,
              active: plan.is_visible,
              metadata: {
                tier: plan.tier,
                app_plan_id: plan.id,
                ...extractFeatureMetadata(plan.features)
              }
            });
            
            results.push({
              plan_id: plan.id,
              tier: plan.tier,
              status: 'updated',
              product_id: product.id
            });
          } else {
            results.push({
              plan_id: plan.id,
              tier: plan.tier,
              status: 'unchanged',
              product_id: product.id
            });
          }
        } catch (stripeError) {
          if (stripeError.code === 'resource_missing') {
            // Product not found, we'll create a new one
            product = null;
          } else {
            throw stripeError;
          }
        }
      }
      
      // If no product exists, create a new one
      if (!product) {
        product = await stripe.products.create({
          name: plan.name,
          active: plan.is_visible,
          metadata: {
            tier: plan.tier,
            app_plan_id: plan.id,
            ...extractFeatureMetadata(plan.features)
          }
        });
        
        // Update our plan with the new product ID
        await supabaseAdmin
          .from('subscription_plans')
          .update({ 
            stripe_product_id: product.id 
          })
          .eq('id', plan.id);
        
        results.push({
          plan_id: plan.id,
          tier: plan.tier,
          status: 'created',
          product_id: product.id
        });
      }
      
      // Check if prices need to be created/updated
      if (!plan.stripe_price_id_monthly) {
        // Create monthly price
        const monthlyPrice = await stripe.prices.create({
          unit_amount: Math.round(plan.price_monthly * 100), // Convert to cents
          currency: 'usd',
          recurring: { interval: 'month' },
          product: product.id,
          metadata: {
            app_plan_id: plan.id,
            tier: plan.tier,
            interval: 'month'
          }
        });
        
        // Update our plan with the new price ID
        await supabaseAdmin
          .from('subscription_plans')
          .update({ 
            stripe_price_id_monthly: monthlyPrice.id 
          })
          .eq('id', plan.id);
        
        results.push({
          plan_id: plan.id,
          tier: plan.tier,
          status: 'price_created',
          price_id: monthlyPrice.id,
          interval: 'month'
        });
      }
      
      if (!plan.stripe_price_id_yearly) {
        // Create yearly price
        const yearlyPrice = await stripe.prices.create({
          unit_amount: Math.round(plan.price_yearly * 100), // Convert to cents
          currency: 'usd',
          recurring: { interval: 'year' },
          product: product.id,
          metadata: {
            app_plan_id: plan.id,
            tier: plan.tier,
            interval: 'year'
          }
        });
        
        // Update our plan with the new price ID
        await supabaseAdmin
          .from('subscription_plans')
          .update({ 
            stripe_price_id_yearly: yearlyPrice.id 
          })
          .eq('id', plan.id);
        
        results.push({
          plan_id: plan.id,
          tier: plan.tier,
          status: 'price_created',
          price_id: yearlyPrice.id,
          interval: 'year'
        });
      }
      
      // Check if we need to create new prices due to price changes
      // (Stripe doesn't allow updating prices, we need to create new ones)
      let monthlyPriceChanged = false;
      let yearlyPriceChanged = false;
      
      if (plan.stripe_price_id_monthly) {
        try {
          const currentMonthlyPrice = await stripe.prices.retrieve(plan.stripe_price_id_monthly);
          if (currentMonthlyPrice.unit_amount !== Math.round(plan.price_monthly * 100)) {
            monthlyPriceChanged = true;
          }
        } catch (stripeError) {
          if (stripeError.code === 'resource_missing') {
            monthlyPriceChanged = true;
          } else {
            throw stripeError;
          }
        }
      }
      
      if (plan.stripe_price_id_yearly) {
        try {
          const currentYearlyPrice = await stripe.prices.retrieve(plan.stripe_price_id_yearly);
          if (currentYearlyPrice.unit_amount !== Math.round(plan.price_yearly * 100)) {
            yearlyPriceChanged = true;
          }
        } catch (stripeError) {
          if (stripeError.code === 'resource_missing') {
            yearlyPriceChanged = true;
          } else {
            throw stripeError;
          }
        }
      }
      
      // Create new prices if needed due to price changes
      if (monthlyPriceChanged) {
        // Archive old price
        if (plan.stripe_price_id_monthly) {
          await stripe.prices.update(plan.stripe_price_id_monthly, { active: false });
        }
        
        // Create new monthly price
        const newMonthlyPrice = await stripe.prices.create({
          unit_amount: Math.round(plan.price_monthly * 100), // Convert to cents
          currency: 'usd',
          recurring: { interval: 'month' },
          product: product.id,
          metadata: {
            app_plan_id: plan.id,
            tier: plan.tier,
            interval: 'month'
          }
        });
        
        // Update our plan with the new price ID
        await supabaseAdmin
          .from('subscription_plans')
          .update({ 
            stripe_price_id_monthly: newMonthlyPrice.id 
          })
          .eq('id', plan.id);
        
        results.push({
          plan_id: plan.id,
          tier: plan.tier,
          status: 'price_updated',
          old_price_id: plan.stripe_price_id_monthly,
          new_price_id: newMonthlyPrice.id,
          interval: 'month'
        });
      }
      
      if (yearlyPriceChanged) {
        // Archive old price
        if (plan.stripe_price_id_yearly) {
          await stripe.prices.update(plan.stripe_price_id_yearly, { active: false });
        }
        
        // Create new yearly price
        const newYearlyPrice = await stripe.prices.create({
          unit_amount: Math.round(plan.price_yearly * 100), // Convert to cents
          currency: 'usd',
          recurring: { interval: 'year' },
          product: product.id,
          metadata: {
            app_plan_id: plan.id,
            tier: plan.tier,
            interval: 'year'
          }
        });
        
        // Update our plan with the new price ID
        await supabaseAdmin
          .from('subscription_plans')
          .update({ 
            stripe_price_id_yearly: newYearlyPrice.id 
          })
          .eq('id', plan.id);
        
        results.push({
          plan_id: plan.id,
          tier: plan.tier,
          status: 'price_updated',
          old_price_id: plan.stripe_price_id_yearly,
          new_price_id: newYearlyPrice.id,
          interval: 'year'
        });
      }
    }
    
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error("Error in syncPlansToStripe:", error);
    throw error;
  }
}

// Sync Stripe products to our subscription plans
async function syncPlansFromStripe(stripe: Stripe) {
  try {
    // Get all active products from Stripe
    const stripeProducts = await stripe.products.list({
      active: true,
      limit: 100,
    });
    
    // Get all prices for these products
    const stripePrices = await stripe.prices.list({
      active: true,
      limit: 100,
    });
    
    // Get all our existing plans
    const { data: existingPlans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*');
    
    if (error) {
      throw new Error(`Error fetching plans: ${error.message}`);
    }
    
    const results = [];
    
    // Check each Stripe product
    for (const product of stripeProducts.data) {
      // Skip products without our app_plan_id metadata
      if (!product.metadata.app_plan_id && !product.metadata.tier) {
        continue;
      }
      
      // Find prices for this product
      const productPrices = stripePrices.data.filter(price => 
        price.product === product.id && price.active
      );
      
      // Group prices by interval
      const monthlyPrices = productPrices.filter(price => 
        price.recurring?.interval === 'month'
      );
      
      const yearlyPrices = productPrices.filter(price => 
        price.recurring?.interval === 'year'
      );
      
      const monthlyPrice = monthlyPrices.length > 0 ? monthlyPrices[0] : null;
      const yearlyPrice = yearlyPrices.length > 0 ? yearlyPrices[0] : null;
      
      // Check if we already have this plan in our database
      const existingPlan = existingPlans.find(plan => 
        plan.stripe_product_id === product.id || 
        (product.metadata.app_plan_id && plan.id === product.metadata.app_plan_id)
      );
      
      if (existingPlan) {
        // Update the existing plan
        const updateData = {
          name: product.name,
          is_visible: product.active,
          stripe_product_id: product.id,
          stripe_price_id_monthly: monthlyPrice?.id || existingPlan.stripe_price_id_monthly,
          stripe_price_id_yearly: yearlyPrice?.id || existingPlan.stripe_price_id_yearly,
          price_monthly: monthlyPrice ? (monthlyPrice.unit_amount || 0) / 100 : existingPlan.price_monthly,
          price_yearly: yearlyPrice ? (yearlyPrice.unit_amount || 0) / 100 : existingPlan.price_yearly,
          tier: product.metadata.tier || existingPlan.tier,
          updated_at: new Date().toISOString()
        };
        
        await supabaseAdmin
          .from('subscription_plans')
          .update(updateData)
          .eq('id', existingPlan.id);
        
        results.push({
          product_id: product.id,
          plan_id: existingPlan.id,
          status: 'updated',
          tier: updateData.tier
        });
      } else if (product.metadata.tier) {
        // Create a new plan in our database
        const features = {
          description: product.description || `${product.name} subscription plan`,
          feature1: { description: "Access to all features", value: true },
          feature2: { description: "Priority support", value: true }
        };
        
        const { data: newPlan, error: insertError } = await supabaseAdmin
          .from('subscription_plans')
          .insert({
            name: product.name,
            tier: product.metadata.tier,
            price_monthly: monthlyPrice ? (monthlyPrice.unit_amount || 0) / 100 : 0,
            price_yearly: yearlyPrice ? (yearlyPrice.unit_amount || 0) / 100 : 0,
            stripe_product_id: product.id,
            stripe_price_id_monthly: monthlyPrice?.id || null,
            stripe_price_id_yearly: yearlyPrice?.id || null,
            features: features,
            is_visible: product.active,
            metadata: Object.keys(product.metadata).reduce((obj, key) => {
              if (key !== 'tier' && key !== 'app_plan_id') {
                obj[key] = product.metadata[key];
              }
              return obj;
            }, {})
          })
          .select()
          .single();
        
        if (insertError) {
          throw new Error(`Error creating plan: ${insertError.message}`);
        }
        
        results.push({
          product_id: product.id,
          plan_id: newPlan.id,
          status: 'created',
          tier: newPlan.tier
        });
      }
    }
    
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error("Error in syncPlansFromStripe:", error);
    throw error;
  }
}

// Helper to extract feature metadata from a plan
function extractFeatureMetadata(features: any): Record<string, string> {
  const metadata: Record<string, string> = {};
  
  if (!features) return metadata;
  
  // Parse features if it's a string
  const parsedFeatures = typeof features === 'string'
    ? JSON.parse(features)
    : features;
  
  if (parsedFeatures.description) {
    metadata.description = parsedFeatures.description;
  }
  
  // Add a count of features
  const featureCount = Object.keys(parsedFeatures).filter(key => key !== 'description').length;
  metadata.feature_count = featureCount.toString();
  
  // Add up to 5 top features as metadata
  Object.entries(parsedFeatures)
    .filter(([key]) => key !== 'description')
    .slice(0, 5)
    .forEach(([key, value], index) => {
      if (typeof value === 'object' && value !== null && 'description' in value) {
        metadata[`feature_${index + 1}`] = (value as any).description;
      } else if (typeof value === 'string') {
        metadata[`feature_${index + 1}`] = value;
      }
    });
  
  return metadata;
}

serve(handler);
