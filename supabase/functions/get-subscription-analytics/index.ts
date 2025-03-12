
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
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Extract authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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
        userId: user?.id 
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update logger with authenticated user ID
    const logger = createLogger('get-subscription-analytics', requestId, user.id);
    logger.info('User authenticated successfully', { isAdmin });

    // Parse request body
    const { startDate, endDate } = await req.json();
    logger.info('Processing analytics request', { startDate, endDate });

    // Fetch subscription data
    const data = await fetchSubscriptionData(startDate, endDate);
    logger.info('Successfully fetched subscription data');

    // Process and return the response
    const response = createResponse(data);
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
    });

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        requestId, // Include requestId for error tracking
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
