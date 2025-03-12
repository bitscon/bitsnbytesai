
import { supabase } from '@/integrations/supabase/client';
import { appLogger } from '@/utils/logging';

const dbLogger = appLogger.child({ component: 'SupabaseClient' });

/**
 * Enhanced Supabase client with logging capabilities
 */
export const loggedSupabase = {
  /**
   * Wrapped Supabase query methods with performance logging
   */
  from: (table: string) => {
    const query = supabase.from(table);
    
    // Create wrapped versions of the query methods with logging
    const originalSelect = query.select.bind(query);
    const originalInsert = query.insert.bind(query);
    const originalUpdate = query.update.bind(query);
    const originalDelete = query.delete.bind(query);
    
    // Wrap the select method
    query.select = function(...args: any[]) {
      dbLogger.debug(`DB Query: SELECT from ${table}`, { 
        table,
        operation: 'select',
        args
      });
      
      const startTime = performance.now();
      const result = originalSelect(...args);
      
      // Wrap the original then to capture the response
      const originalThen = result.then.bind(result);
      result.then = function(onfulfilled, onrejected) {
        return originalThen(
          (data) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            if (data.error) {
              dbLogger.error(`DB Error: SELECT from ${table} failed`, 
                new Error(data.error.message), { 
                  table,
                  operation: 'select',
                  duration,
                  args,
                  code: data.error.code,
                  details: data.error.details,
                  hint: data.error.hint
                }
              );
            } else {
              const rowCount = data.data ? data.data.length : 0;
              dbLogger.debug(`DB Result: SELECT from ${table} returned ${rowCount} rows`, { 
                table,
                operation: 'select',
                duration,
                rowCount,
                args
              });
              
              // Log slow queries
              if (duration > 1000) { // 1 second threshold
                dbLogger.warn(`Slow DB Query: SELECT from ${table} took ${duration.toFixed(2)}ms`, { 
                  table,
                  operation: 'select',
                  duration,
                  args
                });
              }
            }
            
            return onfulfilled ? onfulfilled(data) : data;
          },
          (error) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            dbLogger.error(`DB Error: SELECT from ${table} failed`, 
              error as Error, { 
                table,
                operation: 'select',
                duration,
                args
              }
            );
            
            return onrejected ? onrejected(error) : Promise.reject(error);
          }
        );
      };
      
      return result;
    };
    
    // Wrap the insert method
    query.insert = function(...args: any[]) {
      dbLogger.debug(`DB Query: INSERT into ${table}`, { 
        table,
        operation: 'insert',
        args
      });
      
      const startTime = performance.now();
      const result = originalInsert(...args);
      
      // Wrap the original then to capture the response
      const originalThen = result.then.bind(result);
      result.then = function(onfulfilled, onrejected) {
        return originalThen(
          (data) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            if (data.error) {
              dbLogger.error(`DB Error: INSERT into ${table} failed`, 
                new Error(data.error.message), { 
                  table,
                  operation: 'insert',
                  duration,
                  args,
                  code: data.error.code,
                  details: data.error.details,
                  hint: data.error.hint
                }
              );
            } else {
              const rowCount = data.data ? data.data.length : 0;
              dbLogger.info(`DB Result: INSERT into ${table} successful`, { 
                table,
                operation: 'insert',
                duration,
                rowCount,
                args
              });
            }
            
            return onfulfilled ? onfulfilled(data) : data;
          },
          (error) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            dbLogger.error(`DB Error: INSERT into ${table} failed`, 
              error as Error, { 
                table,
                operation: 'insert',
                duration,
                args
              }
            );
            
            return onrejected ? onrejected(error) : Promise.reject(error);
          }
        );
      };
      
      return result;
    };
    
    // Implement similar wrappers for update and delete
    // ... (similar implementation as select and insert)
    
    return query;
  },
  
  // Add other Supabase methods like auth, storage, etc. with logging
  auth: {
    ...supabase.auth,
    
    // Override sign in to add logging
    signIn: async (...args: any[]) => {
      dbLogger.info('Auth: Sign in attempt', { method: args[0]?.email ? 'email' : 'other' });
      
      try {
        const result = await supabase.auth.signIn(...args);
        
        if (result.error) {
          dbLogger.error('Auth: Sign in failed', 
            new Error(result.error.message), { 
              message: result.error.message
            }
          );
        } else {
          dbLogger.info('Auth: Sign in successful', { 
            userId: result.data?.user?.id
          });
        }
        
        return result;
      } catch (error) {
        dbLogger.error('Auth: Sign in failed with exception', 
          error as Error
        );
        throw error;
      }
    },
    
    // Override sign up to add logging
    signUp: async (...args: any[]) => {
      dbLogger.info('Auth: Sign up attempt', { email: args[0]?.email });
      
      try {
        const result = await supabase.auth.signUp(...args);
        
        if (result.error) {
          dbLogger.error('Auth: Sign up failed', 
            new Error(result.error.message), { 
              message: result.error.message
            }
          );
        } else {
          dbLogger.info('Auth: Sign up successful', { 
            userId: result.data?.user?.id,
            isConfirmed: !result.data?.user?.confirmed_at
          });
        }
        
        return result;
      } catch (error) {
        dbLogger.error('Auth: Sign up failed with exception', 
          error as Error
        );
        throw error;
      }
    }
  },
  
  // Add logging for edge function invocations
  functions: {
    ...supabase.functions,
    
    invoke: async (functionName: string, options?: { body?: any }) => {
      dbLogger.info(`Function: Invoking edge function ${functionName}`, { 
        functionName,
        body: options?.body
      });
      
      const startTime = performance.now();
      
      try {
        const result = await supabase.functions.invoke(functionName, options);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (result.error) {
          dbLogger.error(`Function: Edge function ${functionName} failed`, 
            new Error(result.error.message), { 
              functionName,
              duration,
              message: result.error.message,
              statusCode: result.error.status
            }
          );
        } else {
          dbLogger.info(`Function: Edge function ${functionName} completed`, { 
            functionName,
            duration,
            statusCode: 200
          });
        }
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        dbLogger.error(`Function: Edge function ${functionName} failed with exception`, 
          error as Error, { 
            functionName,
            duration
          }
        );
        throw error;
      }
    }
  }
};
