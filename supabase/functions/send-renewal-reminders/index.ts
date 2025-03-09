
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get days before renewal from request, default to 3 days
    const { daysBeforeRenewal = 3 } = await req.json().catch(() => ({}));
    
    console.log(`Sending renewal reminders for subscriptions renewing in ${daysBeforeRenewal} days`);
    
    // Calculate the target date for renewal reminders
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeRenewal);
    const targetDateStr = targetDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Find subscriptions that renew on the target date
    const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        id, 
        user_id, 
        tier, 
        stripe_customer_id, 
        stripe_subscription_id, 
        current_period_end
      `)
      .not('stripe_subscription_id', 'is', null)
      .gte('current_period_end', `${targetDateStr}T00:00:00.000Z`)
      .lte('current_period_end', `${targetDateStr}T23:59:59.999Z`);
    
    if (subscriptionError) {
      console.error("Error retrieving subscriptions:", subscriptionError);
      return new Response(
        JSON.stringify({ success: false, error: subscriptionError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Found ${subscriptions.length} subscriptions renewing on ${targetDateStr}`);
    
    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sentCount: 0, message: "No subscriptions renewing on target date" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Get subscription plan details
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*');
    
    if (plansError) {
      console.error("Error retrieving subscription plans:", plansError);
      return new Response(
        JSON.stringify({ success: false, error: plansError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Create a map of plans by tier for easy lookup
    const plansByTier = plans.reduce((acc, plan) => {
      acc[plan.tier] = plan;
      return acc;
    }, {});
    
    // Process each subscription and send a reminder email
    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          const plan = plansByTier[subscription.tier];
          if (!plan) {
            console.error(`No plan found for tier: ${subscription.tier}`);
            return { success: false, userId: subscription.user_id, error: "Plan not found" };
          }
          
          // Format renewal date
          const renewalDate = new Date(subscription.current_period_end).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          // Determine if subscription is monthly or yearly and get appropriate price
          // This is a simplification - in a real app, you'd get this from Stripe API
          const isYearly = true; // Assuming yearly by default, adjust as needed
          const amount = isYearly ? plan.price_yearly : plan.price_monthly;
          const currency = "USD"; // Adjust based on your app's currency
          
          // Generate Stripe portal URL
          const origin = new URL(req.url).origin;
          const portalUrl = `${origin}/subscription`;
          
          // Send the email using the send-subscription-email function
          const response = await fetch(`${origin}/functions/v1/send-subscription-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
            },
            body: JSON.stringify({
              userId: subscription.user_id,
              emailType: "renewal_reminder",
              data: {
                subscriptionName: plan.name,
                renewalDate,
                amount: (amount / 100).toFixed(2), // Convert cents to dollars
                currency,
                portalUrl
              }
            })
          });
          
          const result = await response.json();
          return { success: result.success, userId: subscription.user_id, emailId: result.emailId };
        } catch (error) {
          console.error(`Error processing subscription ${subscription.id}:`, error);
          return { success: false, userId: subscription.user_id, error: error.message };
        }
      })
    );
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        totalProcessed: subscriptions.length,
        sentCount: successful,
        failedCount: failed,
        details: results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing renewal reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
