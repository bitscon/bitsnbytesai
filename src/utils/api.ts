
import { appLogger } from '@/utils/logging';

const apiLogger = appLogger.child({ component: 'APIClient' });

/**
 * Enhanced fetch with logging for API requests
 */
export async function fetchWithLogging(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  // Log the request
  apiLogger.info(`API Request: ${options.method || 'GET'} ${url}`, {
    requestId,
    headers: options.headers,
    method: options.method || 'GET',
    url
  });
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Clone the response to read its body
    const clonedResponse = response.clone();
    let responseBody;
    
    // Only attempt to parse JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseBody = await clonedResponse.json();
      } catch (e) {
        // If JSON parsing fails, don't include the body
        responseBody = 'Failed to parse JSON response';
      }
    }
    
    // Log successful response
    if (response.ok) {
      apiLogger.info(`API Response: ${response.status} ${options.method || 'GET'} ${url}`, {
        requestId,
        status: response.status,
        duration,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody
      });
    } else {
      // Log error response
      apiLogger.error(`API Error: ${response.status} ${options.method || 'GET'} ${url}`, 
        new Error(`HTTP Error ${response.status}`), {
          requestId,
          status: response.status,
          statusText: response.statusText,
          duration,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody
        }
      );
    }
    
    return response;
  } catch (error) {
    // Log network or other errors
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    apiLogger.error(`API Request Failed: ${options.method || 'GET'} ${url}`, 
      error as Error, {
        requestId,
        duration,
        request: {
          url,
          method: options.method || 'GET',
          headers: options.headers
        }
      }
    );
    
    throw error;
  }
}
