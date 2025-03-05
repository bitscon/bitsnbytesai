
import { supabase } from '@/integrations/supabase/client';

export const createAdminUser = async (email: string, password: string) => {
  try {
    console.log(`Creating admin user with email: ${email}`);
    
    // First, check if user exists and create if not
    const { data: userExists, error: checkError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (checkError && checkError.message.includes('Invalid login credentials')) {
      // User doesn't exist, create new account
      console.log('User does not exist, creating new account...');
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Admin User',
          },
        },
      });
      
      if (signUpError) {
        throw new Error(`Error creating user: ${signUpError.message}`);
      }
      
      console.log('User account created successfully');
    } else {
      console.log('User already exists');
    }
    
    // Make user an admin
    const { error: adminError } = await supabase.functions.invoke('create-admin-user', {
      method: 'POST',
      body: { email },
    });
    
    if (adminError) {
      throw new Error(`Error making user admin: ${adminError.message}`);
    }
    
    console.log(`Successfully made ${email} an admin user!`);
    return { success: true, message: `User ${email} is now an admin` };
  } catch (error) {
    console.error('Error in createAdminUser:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Execute immediately for the requested email/password
(async () => {
  const result = await createAdminUser('chad@bitscon.net', 'Adm1n');
  console.log('Operation result:', result);
})();
