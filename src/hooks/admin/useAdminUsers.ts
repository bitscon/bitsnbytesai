
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionTier } from "@/types/subscription";

interface AdminUser {
  id: string;
  email: string;
  full_name?: string | null;
  created_at: string;
}

interface RegularUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_admin?: boolean;
  subscription_tier?: SubscriptionTier;
  is_manual_subscription?: boolean;
}

interface CreateUserData {
  email: string;
  name: string;
  password: string;
  subscriptionTier?: SubscriptionTier;
  isManualSubscription?: boolean;
}

export function useAdminUsers() {
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [regularUsers, setRegularUsers] = useState<RegularUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  
  // Promote user state
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(""); // Clear any previous errors
      
      // Fetch admin users using the edge function - IMPORTANT: use POST method with a body instead of GET with a body
      const { data: adminResponse, error: adminError } = await supabase.functions.invoke(
        "check-admin-status",
        {
          method: "POST", // Changed from GET to POST since we need to send a body
          body: { action: "list_admins" }
        }
      );

      if (adminError) {
        console.error("Error fetching admin users:", adminError);
        throw new Error(adminError.message);
      }

      console.log("Admin users response:", adminResponse);
      setAdminUsers(adminResponse?.admin_users || []);
      
      // Fetch all profiles (users) with their subscription info
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at");
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw new Error(profilesError.message);
      }
      
      // Get subscription information for all users
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from("user_subscriptions")
        .select("user_id, tier, is_manually_created");
        
      if (subscriptionsError) {
        console.error("Error fetching subscriptions:", subscriptionsError);
      }
      
      // Create a map of user_id to subscription info
      const subscriptionMap = new Map();
      subscriptionsData?.forEach(sub => {
        subscriptionMap.set(sub.user_id, {
          tier: sub.tier,
          is_manually_created: sub.is_manually_created
        });
      });
      
      // Filter out admin users to get regular users, but mark those who are admins
      const adminIds = new Set((adminResponse?.admin_users || []).map(admin => admin.id));
      const regularUsersData = (profilesData || []).map(user => {
        const subInfo = subscriptionMap.get(user.id);
        return {
          ...user,
          is_admin: adminIds.has(user.id),
          subscription_tier: subInfo?.tier || "free",
          is_manual_subscription: subInfo?.is_manually_created || false
        };
      });
      
      setRegularUsers(regularUsersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      const errorMessage = (error as Error).message || "Failed to load users. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addAdminUser = async () => {
    if (!newUserEmail) {
      setError("Please enter an email address.");
      return;
    }

    try {
      setIsAdding(true);
      setError("");
      setSuccess("");

      // Add auth header to the request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session found. Please log in again.");
      }

      const { error } = await supabase.functions.invoke("create-admin-user", {
        method: "POST",
        body: { 
          email: newUserEmail,
          makeAdmin: true
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw new Error(error.message);

      // Success
      setSuccess(`${newUserEmail} has been added as an admin.`);
      setNewUserEmail("");
      toast({
        title: "Success",
        description: `${newUserEmail} has been added as an admin.`,
      });

      // Refresh admin users list
      fetchUsers();
    } catch (error) {
      console.error("Error adding admin user:", error);
      setError(`Failed to add admin: ${(error as Error).message}`);
      toast({
        title: "Error",
        description: `Failed to add admin: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };
  
  const createRegularUser = async (userData: CreateUserData) => {
    if (!userData.email || !userData.password || !userData.name) {
      setError("Please fill all required fields.");
      return;
    }
    
    try {
      setIsAdding(true);
      setError("");
      setSuccess("");
      
      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session found. Please log in again.");
      }
      
      // If manual subscription is selected, use the create-admin-user function which now supports subscription assignment
      if (userData.isManualSubscription && userData.subscriptionTier) {
        const { error } = await supabase.functions.invoke("create-admin-user", {
          method: "POST",
          body: { 
            email: userData.email,
            fullName: userData.name,
            password: userData.password,
            subscriptionTier: userData.subscriptionTier,
            isManualSubscription: true,
            makeAdmin: false
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) throw new Error(error.message);
      } else {
        // Create user with Supabase auth
        const { error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: { full_name: userData.name }
        });
        
        if (error) throw new Error(error.message);
      }
      
      setSuccess(`User ${userData.email} has been created successfully.`);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      
      toast({
        title: "Success",
        description: `User ${userData.email} has been created successfully.`,
      });
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      setError(`Failed to create user: ${(error as Error).message}`);
      toast({
        title: "Error",
        description: `Failed to create user: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };
  
  const promoteToAdmin = async (userId: string, userEmail: string) => {
    try {
      setIsPromoting(true);
      setSelectedUserId(userId);
      setError("");
      setSuccess("");
      
      // Add auth header to the request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session found. Please log in again.");
      }
      
      const { error } = await supabase.functions.invoke("create-admin-user", {
        method: "POST",
        body: { 
          userId, 
          email: userEmail,
          makeAdmin: true 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) throw new Error(error.message);
      
      setSuccess(`User ${userEmail} has been promoted to admin.`);
      toast({
        title: "Success",
        description: `User ${userEmail} has been promoted to admin.`,
      });
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error("Error promoting user:", error);
      setError(`Failed to promote user: ${(error as Error).message}`);
      toast({
        title: "Error",
        description: `Failed to promote user: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsPromoting(false);
      setSelectedUserId("");
    }
  };

  return {
    adminUsers,
    regularUsers,
    isLoading,
    isAdding,
    isPromoting,
    error,
    success,
    newUserEmail,
    newUserName,
    newUserPassword,
    selectedUserId,
    setNewUserEmail,
    setNewUserName,
    setNewUserPassword,
    addAdminUser,
    createRegularUser,
    promoteToAdmin,
    fetchUsers
  };
}
