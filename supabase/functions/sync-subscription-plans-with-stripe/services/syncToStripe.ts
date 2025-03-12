
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { supabaseAdmin } from "../../_shared/supabase-admin.ts";
import { extractFeatureMetadata } from "../utils/metadataUtils.ts";

// Sync our subscription plans to Stripe
export async function syncPlansToStripe(stripeSecretKey: string) {
  try {
    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

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
      
      // Process pricing information
      await processPlanPricing(stripe, plan, product.id, results);
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

// Helper function to process plan pricing (creating or updating prices)
async function processPlanPricing(stripe: Stripe, plan: any, productId: string, results: any[]) {
  // Check if we need to create monthly price
  if (!plan.stripe_price_id_monthly) {
    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      unit_amount: Math.round(plan.price_monthly * 100), // Convert to cents
      currency: 'usd',
      recurring: { interval: 'month' },
      product: productId,
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
  
  // Check if we need to create yearly price
  if (!plan.stripe_price_id_yearly) {
    // Create yearly price
    const yearlyPrice = await stripe.prices.create({
      unit_amount: Math.round(plan.price_yearly * 100), // Convert to cents
      currency: 'usd',
      recurring: { interval: 'year' },
      product: productId,
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
  
  // Check for price changes that require new prices
  await handlePriceChanges(stripe, plan, productId, results);
}

// Handle price changes (create new prices and archive old ones)
async function handlePriceChanges(stripe: Stripe, plan: any, productId: string, results: any[]) {
  let monthlyPriceChanged = false;
  let yearlyPriceChanged = false;
  
  // Check if monthly price has changed
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
  
  // Check if yearly price has changed
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
  
  // Create new monthly price if needed
  if (monthlyPriceChanged) {
    // Archive old price
    if (plan.stripe_price_id_monthly) {
      await stripe.prices.update(plan.stripe_price_id_monthly, { active: false });
    }
    
    // Create new monthly price
    const newMonthlyPrice = await stripe.prices.create({
      unit_amount: Math.round(plan.price_monthly * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
      product: productId,
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
  
  // Create new yearly price if needed
  if (yearlyPriceChanged) {
    // Archive old price
    if (plan.stripe_price_id_yearly) {
      await stripe.prices.update(plan.stripe_price_id_yearly, { active: false });
    }
    
    // Create new yearly price
    const newYearlyPrice = await stripe.prices.create({
      unit_amount: Math.round(plan.price_yearly * 100),
      currency: 'usd',
      recurring: { interval: 'year' },
      product: productId,
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
