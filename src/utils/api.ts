
import { appLogger } from './logging';

// Create an API logger for API calls
export const apiLogger = {
  info: (message: string, data?: any) => appLogger.info(message, data, undefined, ['api']),
  warn: (message: string, data?: any) => appLogger.warn(message, data, undefined, ['api']),
  error: (message: string, data?: any, error?: Error) => appLogger.error(message, data, error, ['api']),
  debug: (message: string, data?: any) => appLogger.debug(message, data, undefined, ['api']),
  
  // API specific log methods
  request: (endpoint: string, method: string, data?: any) => {
    appLogger.info(`API Request: ${method} ${endpoint}`, data, undefined, ['api', 'request']);
  },
  
  response: (endpoint: string, method: string, status: number, data?: any, duration?: number) => {
    appLogger.info(
      `API Response: ${method} ${endpoint} (${status})`,
      { ...data, duration: duration ? `${duration}ms` : undefined },
      undefined,
      ['api', 'response']
    );
  },
  
  error_response: (endpoint: string, method: string, status: number, error?: any) => {
    appLogger.error(
      `API Error: ${method} ${endpoint} (${status})`,
      error,
      error instanceof Error ? error : new Error(JSON.stringify(error)),
      ['api', 'error']
    );
  }
};
