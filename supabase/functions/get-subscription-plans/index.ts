
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { getApiSetting } from "../_shared/api-settings.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe public key - but don't fail if not found
    const stripePublicKey = await getApiSetting("STRIPE_PUBLIC_KEY");
    
    // Get all subscription plans from database
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    // Handle database error
    if (error) {
      console.error(`Error fetching subscription plans: ${error.message}`);
      return new Response(
        JSON.stringify({ 
          error: "Failed to retrieve subscription plans",
          // Provide fallback plans so UI doesn't break
          plans: [
            {
              id: "fallback-free",
              name: "Free",
              tier: "free",
              price_monthly: 0,
              price_yearly: 0,
              features: {
                feature1: { description: "5 AI prompts per month" },
                feature2: { description: "Basic prompt categories" },
                feature3: { description: "Standard support" }
              }
            },
            {
              id: "fallback-pro",
              name: "Pro",
              tier: "pro",
              price_monthly: 19.99,
              price_yearly: 199.99,
              features: {
                feature1: { description: "100+ specialized AI prompts" },
                feature2: { description: "Regular updates with new prompts" },
                feature3: { description: "Works with ChatGPT, Claude, Midjourney" },
                feature4: { description: "Organized by categories and use cases" }
              }
            }
          ]
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return plans and public key
    return new Response(
      JSON.stringify({
        plans: plans || [],
        stripePublicKey: stripePublicKey || ""
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error retrieving subscription plans:", error);
    
    // Return error with fallback plans
    return new Response(
      JSON.stringify({ 
        error: error.message,
        // Provide fallback plans so UI doesn't break
        plans: [
          {
            id: "fallback-free",
            name: "Free",
            tier: "free",
            price_monthly: 0,
            price_yearly: 0,
            features: {
              feature1: { description: "5 AI prompts per month" },
              feature2: { description: "Basic prompt categories" },
              feature3: { description: "Standard support" }
            }
          },
          {
            id: "fallback-pro",
            name: "Pro",
            tier: "pro",
            price_monthly: 19.99,
            price_yearly: 199.99,
            features: {
              feature1: { description: "100+ specialized AI prompts" },
              feature2: { description: "Regular updates with new prompts" },
              feature3: { description: "Works with ChatGPT, Claude, Midjourney" },
              feature4: { description: "Organized by categories and use cases" }
            }
          }
        ]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
