import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.5.0?target=deno'
import { upsertSubscription } from '../_shared/supabase.ts'
import { getApiSetting } from "../_shared/api-settings.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      console.error("Stripe secret key not found");
      return new Response(
        JSON.stringify({ error: "Stripe secret key not found" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()

    let event
    try {
      const webhookSecret = await getApiSetting("STRIPE_WEBHOOK_SECRET");

      if (!webhookSecret) {
        console.error("Stripe webhook secret not found");
        return new Response(
          JSON.stringify({ error: "Stripe webhook secret not found" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(err.message, { status: 400 })
    }

    try {
      await handleEvent(event);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error: any) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      return new Response(JSON.stringify({ 
        received: true, 
        warning: "Event received but processing encountered an error",
        error: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error: any) {
    console.error("Fatal webhook error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}

const handleEvent = async (event: any) => {
  const { type, data } = event;
  console.log(`Processing webhook event: ${type}`);

  // Extract user_id from metadata or customer object
  let userId: string | null = null;
  try {
    userId = await getUserIdFromEvent(event);
    if (!userId) {
      console.warn(`No user ID found for event ${type}, id: ${event.id}`);
    }
  } catch (error) {
    console.error('Error extracting user ID from event:', error);
    // Continue processing - we'll handle missing user IDs in the event handlers
  }
  
  try {
    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data.object, userId);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(data.object, userId);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data.object, userId);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data.object, userId);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(data.object, userId);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(data.object, userId);
        break;
        
      default:
        console.log(`Unhandled event type ${type}`)
    }
    
  } catch (error) {
    console.error(`Error handling webhook event ${type}:`, error);
    // Re-throw to be handled by the main try/catch
    throw error;
  }
};

const handleCheckoutSessionCompleted = async (session: any, userId: string | null) => {
  try {
    console.log(`Processing checkout session ${session.id}`);
    
    // Check if this was a subscription update by looking at metadata
    if (session.mode === "subscription" && session.metadata?.existing_subscription_id) {
      const existingSubId = session.metadata.existing_subscription_id;
      console.log(`This appears to be an update to existing subscription ${existingSubId}`);
      
      // Get the new subscription ID
      let newSubscriptionId: string | null = null;
      
      if (session.subscription) {
        newSubscriptionId = session.subscription;
      }
      
      // If we have both IDs and they don't match, this might be a replacement subscription
      if (newSubscriptionId && newSubscriptionId !== existingSubId) {
        console.log(`New subscription ID ${newSubscriptionId} differs from existing ID ${existingSubId}`);
        
        // Get the user ID if not already provided
        if (!userId && session.metadata?.user_id) {
          userId = session.metadata.user_id;
        }
        
        if (!userId) {
          console.warn(`No user ID found for checkout session ${session.id}, cannot update database`);
          return;
        }
        
        // Update our database with the new subscription ID
        const { error: updateError } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            stripe_subscription_id: newSubscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('stripe_subscription_id', existingSubId);
          
        if (updateError) {
          console.error(`Error updating subscription ID for user ${userId}:`, updateError);
        } else {
          console.log(`Successfully updated subscription ID from ${existingSubId} to ${newSubscriptionId} for user ${userId}`);
        }
      }
    }
    
    // Other checkout session processing can happen here
  } catch (error) {
    console.error(`Error in handleCheckoutSessionCompleted for session ${session?.id}:`, error);
    throw error;
  }
};

const getUserIdFromEvent = async (event: any): Promise<string | null> => {
  try {
    let userId = null;

    if (event.data.object.metadata?.user_id) {
      // Extract user_id from metadata
      userId = event.data.object.metadata.user_id;
      console.log(`Found user_id in metadata: ${userId}`);
      return userId;
    } 
    
    if (event.data.object.customer) {
      // If user_id is not in metadata, try to get it from the customer object
      const customerId = event.data.object.customer;
      console.log(`Looking up user_id from customer ID: ${customerId}`);

      // Retrieve the customer object from Stripe
      const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");

      if (!stripeSecretKey) {
        console.error("Stripe secret key not found when looking up customer");
        return null;
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.metadata?.user_id) {
          userId = customer.metadata.user_id;
          console.log(`Found user_id in customer metadata: ${userId}`);
        } else {
          console.log(`No user_id found in customer metadata for customer: ${customerId}`);
        }
      } catch (error) {
        console.error(`Error retrieving customer ${customerId}:`, error);
      }
    }

    return userId;
  } catch (error) {
    console.error('Error in getUserIdFromEvent:', error);
    return null;
  }
};

const handleSubscriptionCreated = async (subscription: any, userId: string | null) => {
  if (!userId) {
    console.log('No user found for subscription creation');
    return;
  }

  try {
    const tier = await determineTierFromStripePriceId(subscription.items.data[0].price.id);

    await upsertSubscription({
      userId: userId,
      tier: tier,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    });
    
    console.log(`Successfully created subscription for user ${userId}, tier: ${tier}`);
  } catch (error) {
    console.error(`Error in handleSubscriptionCreated for user ${userId}:`, error);
    throw error; // Re-throw to be handled by the main try/catch
  }
}

const handleSubscriptionUpdated = async (subscription: any, userId: string | null) => {
  if (!userId) {
    console.log('No user found for subscription update');
    return;
  }
  
  try {
    // Get existing subscription
    const { data: existingSubscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (error) {
      console.error(`Error fetching existing subscription ${subscription.id}:`, error);
      throw error;
    }
    
    if (existingSubscription) {
      // Determine if this is an upgrade, downgrade, or cancellation
      let eventType = 'update';
      let oldTier = existingSubscription.tier;
      let newTier = await determineTierFromStripePriceId(subscription.items.data[0].price.id);
      
      if (oldTier !== newTier) {
        if (tierLevels[oldTier] < tierLevels[newTier]) {
          eventType = 'upgrade';
        } else if (tierLevels[oldTier] > tierLevels[newTier]) {
          eventType = 'downgrade';
        }
        
        // Log the subscription change event
        try {
          const { error: eventError } = await supabaseAdmin.from('subscription_events').insert({
            user_id: userId,
            event_type: eventType,
            old_tier: oldTier,
            new_tier: newTier,
            metadata: {
              subscription_id: subscription.id,
              cancel_at_period_end: subscription.cancel_at_period_end
            }
          });
          
          if (eventError) {
            console.error(`Error logging subscription event for user ${userId}:`, eventError);
          } else {
            console.log(`Successfully logged ${eventType} event for user ${userId}: ${oldTier} -> ${newTier}`);
          }
        } catch (eventInsertError) {
          console.error(`Error inserting subscription event for user ${userId}:`, eventInsertError);
          // Continue processing - don't fail the whole update if event logging fails
        }
      }
      
      // If the subscription is set to cancel at period end and it wasn't before
      if (subscription.cancel_at_period_end && !existingSubscription.cancel_at_period_end) {
        try {
          const { error: cancelEventError } = await supabaseAdmin.from('subscription_events').insert({
            user_id: userId,
            event_type: 'cancel_scheduled',
            old_tier: oldTier,
            new_tier: oldTier, // Same tier, just scheduled to cancel
            metadata: {
              subscription_id: subscription.id,
              cancel_at: subscription.cancel_at
            }
          });
          
          if (cancelEventError) {
            console.error(`Error logging cancel_scheduled event for user ${userId}:`, cancelEventError);
          } else {
            console.log(`Successfully logged cancel_scheduled event for user ${userId}`);
          }
        } catch (cancelEventInsertError) {
          console.error(`Error inserting cancel_scheduled event for user ${userId}:`, cancelEventInsertError);
          // Continue processing
        }
      }
      
      // Update subscription in database
      try {
        await upsertSubscription({
          userId: userId,
          tier: newTier,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        });
        console.log(`Successfully updated subscription for user ${userId}`);
      } catch (upsertError) {
        console.error(`Error updating subscription for user ${userId}:`, upsertError);
        throw upsertError;
      }
    } else {
      console.warn(`No existing subscription found for update with ID ${subscription.id}`);
      // Try to create a new subscription as a fallback
      try {
        const newTier = await determineTierFromStripePriceId(subscription.items.data[0].price.id);
        await upsertSubscription({
          userId: userId,
          tier: newTier,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        });
        console.log(`Created new subscription for user ${userId} as fallback during update`);
      } catch (createError) {
        console.error(`Error creating fallback subscription for user ${userId}:`, createError);
        throw createError;
      }
    }
  } catch (error) {
    console.error(`Error in handleSubscriptionUpdated for user ${userId}:`, error);
    throw error;
  }
};

const handleSubscriptionDeleted = async (subscription: any, userId: string | null) => {
  if (!userId) {
    console.log('No user found for subscription deletion');
    return;
  }
  
  try {
    // Get existing subscription
    const { data: existingSubscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (error) {
      console.error(`Error fetching subscription ${subscription.id} for deletion:`, error);
      throw error;
    }
    
    if (existingSubscription) {
      // Log the cancellation event
      try {
        const { error: eventError } = await supabaseAdmin.from('subscription_events').insert({
          user_id: userId,
          event_type: 'cancel',
          old_tier: existingSubscription.tier,
          new_tier: 'free',
          metadata: {
            subscription_id: subscription.id,
            reason: 'subscription_deleted'
          }
        });
        
        if (eventError) {
          console.error(`Error logging cancel event for user ${userId}:`, eventError);
        } else {
          console.log(`Successfully logged cancel event for user ${userId}`);
        }
      } catch (eventInsertError) {
        console.error(`Error inserting cancel event for user ${userId}:`, eventInsertError);
        // Continue processing - don't fail the deletion if event logging fails
      }
      
      // Update subscription in database to free tier as fallback
      try {
        // First try to delete the subscription
        const { error: deleteError } = await supabaseAdmin
          .from('user_subscriptions')
          .delete()
          .eq('stripe_subscription_id', subscription.id);
          
        if (deleteError) {
          console.error(`Error deleting subscription ${subscription.id}:`, deleteError);
          // Fallback: set to free tier instead of deleting
          await upsertSubscription({
            userId: userId,
            tier: 'free',
            stripeCustomerId: existingSubscription.stripe_customer_id,
            stripeSubscriptionId: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
          });
          console.log(`Fallback: Set user ${userId} to free tier instead of deleting subscription`);
        } else {
          console.log(`Successfully deleted subscription ${subscription.id} for user ${userId}`);
        }
      } catch (deleteOrUpsertError) {
        console.error(`Error handling subscription deletion for user ${userId}:`, deleteOrUpsertError);
        throw deleteOrUpsertError;
      }
    } else {
      console.warn(`No existing subscription found for deletion with ID ${subscription.id}`);
    }
  } catch (error) {
    console.error(`Error in handleSubscriptionDeleted for user ${userId}:`, error);
    throw error;
  }
};

const handlePaymentFailed = async (invoice: any, userId: string | null) => {
  try {
    console.log(`Payment failed for invoice ${invoice.id}`);
    
    // Try to get user ID from invoice if not provided
    if (!userId) {
      try {
        // Try to get user from subscription
        if (invoice.subscription) {
          const { data: subscriptionData } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single();
            
          if (subscriptionData?.user_id) {
            userId = subscriptionData.user_id;
            console.log(`Found user ID ${userId} from subscription ${invoice.subscription}`);
          }
        }
        
        // If still no user ID, try to get from customer
        if (!userId && invoice.customer) {
          const { data: subscriptionsData } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', invoice.customer)
            .single();
            
          if (subscriptionsData?.user_id) {
            userId = subscriptionsData.user_id;
            console.log(`Found user ID ${userId} from customer ${invoice.customer}`);
          }
        }
        
        if (!userId) {
          console.warn(`Could not determine user for invoice ${invoice.id}`);
          // Continue processing with null user_id - we'll handle this below
        }
      } catch (userLookupError) {
        console.error(`Error looking up user for invoice ${invoice.id}:`, userLookupError);
        // Continue processing with null user_id
      }
    }
    
    // Prepare payment failure record
    const paymentFailureData = {
      user_id: userId || '00000000-0000-0000-0000-000000000000', // Use a placeholder UUID if no user ID
      subscription_id: invoice.subscription,
      payment_intent_id: invoice.payment_intent,
      amount: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency,
      reason: invoice.last_payment_error?.message || 'Unknown reason',
      metadata: {
        invoice_id: invoice.id,
        customer_id: invoice.customer,
        attempt_count: invoice.attempt_count,
        next_payment_attempt: invoice.next_payment_attempt ? 
          new Date(invoice.next_payment_attempt * 1000).toISOString() : null
      }
    };
    
    try {
      // Log the payment failure
      const { data, error } = await supabaseAdmin
        .from('payment_failures')
        .insert(paymentFailureData);
        
      if (error) {
        console.error(`Error logging payment failure for invoice ${invoice.id}:`, error);
        throw error;
      }
      
      console.log(`Successfully logged payment failure for invoice ${invoice.id}`);
      
      // TODO: Add code to send email notification to user and/or admin
      // This would be implemented in a separate edge function
      
    } catch (insertError) {
      console.error(`Error inserting payment failure record for invoice ${invoice.id}:`, insertError);
      // Log critical error but don't throw - we want to continue processing other events
    }
  } catch (error) {
    console.error(`Fatal error in handlePaymentFailed for invoice ${invoice?.id}:`, error);
    throw error;
  }
};

const handlePaymentIntentFailed = async (paymentIntent: any, userId: string | null) => {
  try {
    console.log(`Payment intent failed: ${paymentIntent.id}`);
    
    // Try to find the user from the payment intent metadata if not provided
    if (!userId) {
      try {
        if (paymentIntent.metadata?.user_id) {
          userId = paymentIntent.metadata.user_id;
          console.log(`Found user ID ${userId} from payment intent metadata`);
        } else if (paymentIntent.customer) {
          const { data: subscriptionsData } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', paymentIntent.customer)
            .single();
            
          if (subscriptionsData?.user_id) {
            userId = subscriptionsData.user_id;
            console.log(`Found user ID ${userId} from customer ${paymentIntent.customer}`);
          }
        }
        
        if (!userId) {
          console.warn(`Could not determine user for payment intent ${paymentIntent.id}`);
          // Continue processing with null user_id - we'll handle this below
        }
      } catch (userLookupError) {
        console.error(`Error looking up user for payment intent ${paymentIntent.id}:`, userLookupError);
        // Continue processing with null user_id
      }
    }
    
    // Get subscription ID if available
    let subscriptionId = paymentIntent.metadata?.subscription_id;
    if (!subscriptionId && paymentIntent.invoice) {
      try {
        const stripeSecretKey = await getApiSetting("STRIPE_SECRET_KEY");
        if (stripeSecretKey) {
          const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
          });
          
          const invoice = await stripe.invoices.retrieve(paymentIntent.invoice);
          subscriptionId = invoice.subscription;
          console.log(`Found subscription ID ${subscriptionId} from invoice ${paymentIntent.invoice}`);
        }
      } catch (invoiceLookupError) {
        console.error(`Error looking up invoice ${paymentIntent.invoice}:`, invoiceLookupError);
        // Continue without subscription ID
      }
    }
    
    // Prepare payment failure record
    const paymentFailureData = {
      user_id: userId || '00000000-0000-0000-0000-000000000000', // Use a placeholder UUID if no user ID
      subscription_id: subscriptionId,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      reason: paymentIntent.last_payment_error?.message || 'Unknown reason',
      metadata: {
        customer_id: paymentIntent.customer,
        error_code: paymentIntent.last_payment_error?.code,
        payment_method: paymentIntent.last_payment_error?.payment_method?.type,
        decline_code: paymentIntent.last_payment_error?.decline_code
      }
    };
    
    try {
      // Log the payment failure
      const { data, error } = await supabaseAdmin
        .from('payment_failures')
        .insert(paymentFailureData);
        
      if (error) {
        console.error(`Error logging payment intent failure ${paymentIntent.id}:`, error);
        throw error;
      }
      
      console.log(`Successfully logged payment intent failure ${paymentIntent.id}`);
      
      // TODO: Add code to send email notification to user and/or admin
      // This would be implemented in a separate edge function
      
    } catch (insertError) {
      console.error(`Error inserting payment failure record for payment intent ${paymentIntent.id}:`, insertError);
      // Log critical error but don't throw - we want to continue processing other events
    }
  } catch (error) {
    console.error(`Fatal error in handlePaymentIntentFailed for payment intent ${paymentIntent?.id}:`, error);
    throw error;
  }
};

const tierLevels: Record<string, number> = {
  'free': 0,
  'pro': 1,
  'premium': 2,
  'enterprise': 3
};

const determineTierFromStripePriceId = async (priceId: string) => {
  try {
    // Query our subscription_plans table to find the tier for this price ID
    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('tier')
      .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single();
    
    if (error || !data) {
      console.error('Error determining tier from price ID:', error);
      return 'free'; // Default to free tier if we can't determine
    }
    
    return data.tier;
  } catch (error) {
    console.error(`Error determining tier from price ID ${priceId}:`, error);
    return 'free'; // Default to free tier if we can't determine
  }
};

serve(handler)
