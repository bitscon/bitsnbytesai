
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
    // Verify admin access using auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if the user is an admin
    const { data: adminCheck, error: adminError } = await supabaseAdmin.rpc('is_admin', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (adminError || !adminCheck) {
      console.error("Admin check error:", adminError);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get Stripe secret key from database
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
      console.error("Stripe secret key not found");
      return new Response(
        JSON.stringify({ error: "Stripe API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Initialize Stripe with the retrieved key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Fetch all subscription plans from our database
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });
    
    if (plansError) {
      console.error("Error fetching subscription plans:", plansError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscription plans" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Found ${plans.length} subscription plans to sync with Stripe`);
    
    const syncResults = [];
    
    // Loop through each plan and sync with Stripe
    for (const plan of plans) {
      try {
        // Skip free tier
        if (plan.tier === 'free') {
          syncResults.push({
            name: plan.name,
            tier: plan.tier,
            status: 'skipped',
            message: 'Free tier plans do not need Stripe products'
          });
          continue;
        }
        
        // Create or update the product in Stripe
        let stripeProduct;
        let productId = '';
        
        // Check if we already have a product ID in the metadata
        if (plan.stripe_product_id) {
          // Try to fetch the existing product
          try {
            stripeProduct = await stripe.products.retrieve(plan.stripe_product_id);
            productId = stripeProduct.id;
            
            // Update the product if it exists
            stripeProduct = await stripe.products.update(productId, {
              name: plan.name,
              description: `${plan.name} subscription plan`,
              metadata: {
                tier: plan.tier,
                plan_id: plan.id
              }
            });
            
            console.log(`Updated Stripe product: ${productId} for plan: ${plan.name}`);
          } catch (retrieveError) {
            // Product doesn't exist, create a new one
            console.log(`Stripe product not found: ${plan.stripe_product_id}, creating new one`);
            stripeProduct = await stripe.products.create({
              name: plan.name,
              description: `${plan.name} subscription plan`,
              metadata: {
                tier: plan.tier,
                plan_id: plan.id
              }
            });
            productId = stripeProduct.id;
            console.log(`Created new Stripe product: ${productId} for plan: ${plan.name}`);
          }
        } else {
          // Create a new product
          stripeProduct = await stripe.products.create({
            name: plan.name,
            description: `${plan.name} subscription plan`,
            metadata: {
              tier: plan.tier,
              plan_id: plan.id
            }
          });
          productId = stripeProduct.id;
          console.log(`Created new Stripe product: ${productId} for plan: ${plan.name}`);
        }
        
        // Now handle the prices
        let monthlyPriceId = plan.stripe_price_id_monthly;
        let yearlyPriceId = plan.stripe_price_id_yearly;
        
        // Create or update monthly price
        if (plan.price_monthly > 0) {
          if (!monthlyPriceId) {
            // Create new monthly price
            const monthlyPrice = await stripe.prices.create({
              product: productId,
              unit_amount: Math.round(plan.price_monthly * 100), // Convert to cents
              currency: 'usd',
              recurring: {
                interval: 'month'
              },
              metadata: {
                plan_id: plan.id,
                interval: 'month'
              }
            });
            monthlyPriceId = monthlyPrice.id;
            console.log(`Created monthly price: ${monthlyPriceId} for plan: ${plan.name}`);
          }
        }
        
        // Create or update yearly price
        if (plan.price_yearly > 0) {
          if (!yearlyPriceId) {
            // Create new yearly price
            const yearlyPrice = await stripe.prices.create({
              product: productId,
              unit_amount: Math.round(plan.price_yearly * 100), // Convert to cents
              currency: 'usd',
              recurring: {
                interval: 'year'
              },
              metadata: {
                plan_id: plan.id,
                interval: 'year'
              }
            });
            yearlyPriceId = yearlyPrice.id;
            console.log(`Created yearly price: ${yearlyPriceId} for plan: ${plan.name}`);
          }
        }
        
        // Update our database with Stripe IDs
        const { error: updateError } = await supabaseAdmin
          .from('subscription_plans')
          .update({
            stripe_product_id: productId,
            stripe_price_id_monthly: monthlyPriceId,
            stripe_price_id_yearly: yearlyPriceId,
            updated_at: new Date().toISOString()
          })
          .eq('id', plan.id);
        
        if (updateError) {
          console.error(`Error updating plan ${plan.id} with Stripe IDs:`, updateError);
          syncResults.push({
            name: plan.name,
            tier: plan.tier,
            status: 'error',
            message: `Failed to update database: ${updateError.message}`
          });
        } else {
          syncResults.push({
            name: plan.name,
            tier: plan.tier,
            status: 'success',
            product_id: productId,
            monthly_price_id: monthlyPriceId,
            yearly_price_id: yearlyPriceId
          });
        }
      } catch (planError) {
        console.error(`Error syncing plan ${plan.name}:`, planError);
        syncResults.push({
          name: plan.name,
          tier: plan.tier,
          status: 'error',
          message: planError instanceof Error ? planError.message : 'Unknown error'
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        message: "Subscription plans sync completed",
        results: syncResults
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error syncing subscription plans with Stripe:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
