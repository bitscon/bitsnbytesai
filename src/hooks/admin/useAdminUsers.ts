
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      
      // Fetch admin users using the edge function
      const { data: adminResponse, error: adminError } = await supabase.functions.invoke(
        "check-admin-status",
        {
          method: "GET",
          queryParams: { action: "list_admins" }
        }
      );

      if (adminError) {
        console.error("Error fetching admin users:", adminError);
        throw new Error(adminError.message);
      }

      setAdminUsers(adminResponse?.admin_users || []);
      
      // Fetch all profiles (users)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at");
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw new Error(profilesError.message);
      }
      
      // Filter out admin users to get regular users, but mark those who are admins
      const adminIds = new Set((adminResponse?.admin_users || []).map(admin => admin.id));
      const regularUsersData = (profilesData || []).map(user => ({
        ...user,
        is_admin: adminIds.has(user.id)
      }));
      
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
        body: { email: newUserEmail },
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
  
  const createRegularUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      setError("Please fill all required fields.");
      return;
    }
    
    try {
      setIsAdding(true);
      setError("");
      setSuccess("");
      
      // Create user with Supabase auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
        user_metadata: { full_name: newUserName }
      });
      
      if (error) throw new Error(error.message);
      
      setSuccess(`User ${newUserEmail} has been created successfully.`);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      
      toast({
        title: "Success",
        description: `User ${newUserEmail} has been created successfully.`,
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
        body: { userId, email: userEmail },
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
