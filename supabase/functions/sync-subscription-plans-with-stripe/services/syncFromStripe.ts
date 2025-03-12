
import { Stripe } from "https://esm.sh/stripe@12.5.0";
import { supabaseAdmin } from "../../_shared/supabase-admin.ts";

// Sync Stripe products to our subscription plans
export async function syncPlansFromStripe(stripeSecretKey: string) {
  try {
    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
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
        await updateExistingPlan(existingPlan, product, monthlyPrice, yearlyPrice, results);
      } else if (product.metadata.tier) {
        // Create a new plan in our database
        await createNewPlanFromStripeProduct(product, monthlyPrice, yearlyPrice, results);
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

// Update existing plan with Stripe data
async function updateExistingPlan(
  existingPlan: any, 
  product: Stripe.Product, 
  monthlyPrice: Stripe.Price | null, 
  yearlyPrice: Stripe.Price | null,
  results: any[]
) {
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
}

// Create new plan from Stripe product
async function createNewPlanFromStripeProduct(
  product: Stripe.Product, 
  monthlyPrice: Stripe.Price | null, 
  yearlyPrice: Stripe.Price | null,
  results: any[]
) {
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
