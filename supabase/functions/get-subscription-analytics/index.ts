
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authenticateUser } from "./auth.ts";
import { fetchSubscriptionData } from "./analytics.ts";
import { createLogger } from "../_shared/logging.ts";
import { createResponse } from "./response.ts";

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const logger = createLogger('get-subscription-analytics', requestId);
  
  try {
    logger.info('Function invoked', { 
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });
    
    // Handle CORS
    if (req.method === "OPTIONS") {
      logger.info('Handling CORS preflight request');
      return new Response(null, { headers: corsHeaders });
    }

    // Extract authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    logger.info('Authenticating user');
    const { user, error: authError, isAdmin } = await authenticateUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user || !isAdmin) {
      logger.warn('Authentication failed', { 
        error: authError?.message,
        isAdmin,
        userId: user?.id,
        requestId
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update logger with authenticated user ID
    const userLogger = createLogger('get-subscription-analytics', requestId, user.id);
    userLogger.info('User authenticated successfully', { 
      userId: user.id, 
      email: user.email,
      isAdmin
    });

    // Parse request body
    const { startDate, endDate } = await req.json();
    userLogger.info('Processing analytics request', { 
      startDate, 
      endDate,
      requestId,
      userId: user.id
    });

    // Fetch subscription data
    const startTime = performance.now();
    const data = await fetchSubscriptionData(startDate, endDate);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    userLogger.info('Successfully fetched subscription data', {
      duration: `${duration.toFixed(2)}ms`,
      dataPoints: {
        tierDistribution: data.tierDistribution?.length || 0,
        newSubscriptions: data.newSubscriptions?.length || 0,
        subscriptionChanges: data.subscriptionChanges?.length || 0,
        paymentFailures: data.paymentFailures?.length || 0,
        activeSubscriptions: data.activeSubscriptions?.length || 0,
      }
    });

    // Process and return the response
    const response = createResponse(data);
    userLogger.info('Analytics response created successfully', {
      metrics: Object.keys(response.metrics),
      charts: Object.keys(response.charts),
      tables: Object.keys(response.tables),
      requestId
    });
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Unexpected error in analytics function', error as Error, {
      path: req.url,
      method: req.method,
      requestId
    });

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        requestId,
        message: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
