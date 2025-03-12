
import { appLogger } from '@/utils/logging';

const authLogger = appLogger.child({ component: 'AuthContext' });

/**
 * Logger for authentication-related events
 */
export const authEvents = {
  /**
   * Log user sign in
   */
  logSignIn: (userId: string, email: string, method: 'email' | 'oauth' | 'token' = 'email') => {
    authLogger.info('User signed in', {
      userId,
      email,
      method,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log user sign out
   */
  logSignOut: (userId: string, email: string) => {
    authLogger.info('User signed out', {
      userId,
      email,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log failed sign in attempt
   */
  logSignInFailed: (email: string, error: string) => {
    authLogger.warn('Sign in failed', {
      email,
      error,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log user registration
   */
  logUserRegistered: (userId: string, email: string) => {
    authLogger.info('New user registered', {
      userId,
      email,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log email verification status
   */
  logEmailVerification: (userId: string, email: string, verified: boolean) => {
    authLogger.info(`Email verification ${verified ? 'successful' : 'pending'}`, {
      userId,
      email,
      verified,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log password reset request
   */
  logPasswordResetRequest: (email: string) => {
    authLogger.info('Password reset requested', {
      email,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log password reset completion
   */
  logPasswordResetComplete: (userId: string, email: string) => {
    authLogger.info('Password reset completed', {
      userId,
      email,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log user session refresh
   */
  logSessionRefresh: (userId: string) => {
    authLogger.debug('User session refreshed', {
      userId,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log admin role change
   */
  logAdminRoleChange: (userId: string, email: string, isAdmin: boolean, changedBy: string) => {
    authLogger.info(`User admin role ${isAdmin ? 'granted' : 'revoked'}`, {
      userId,
      email,
      isAdmin,
      changedBy,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log access of sensitive resources
   */
  logSensitiveAccess: (userId: string, resource: string, allowed: boolean) => {
    const level = allowed ? 'info' : 'warn';
    const method = allowed ? 'logSensitiveAccess' : 'logSensitiveAccessDenied';
    
    authLogger[level](`Resource access ${allowed ? 'granted' : 'denied'}: ${resource}`, {
      userId,
      resource,
      allowed,
      timestamp: new Date().toISOString()
    });
  }
};
