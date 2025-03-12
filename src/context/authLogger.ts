
import { appLogger } from '@/utils/logging';

// Create a logger specifically for auth operations
export const authLogger = {
  info: (message: string, data?: any) => appLogger.info(message, data, undefined, ['auth']),
  warn: (message: string, data?: any) => appLogger.warn(message, data, undefined, ['auth']),
  error: (message: string, data?: any, error?: Error) => appLogger.error(message, data, error, ['auth']),
  debug: (message: string, data?: any) => appLogger.debug(message, data, undefined, ['auth']),
  child: (context: Record<string, any>) => appLogger.child({ ...context, module: 'auth' })
};
