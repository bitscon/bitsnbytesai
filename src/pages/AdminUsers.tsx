
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Loader2, 
  AlertCircle, 
  UserPlus, 
  CheckCircle, 
  Users, 
  ShieldAlert,
  Mail,
  UserCheck
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

interface RegularUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
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
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      // Ensure we have a current session with up-to-date token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Authentication session expired. Please log in again.");
      }
      
      // Fetch admin users directly without using functions
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id, created_at");

      if (adminError) throw new Error(adminError.message);

      // For each admin ID, get the user's email from profiles table
      const adminUsersWithDetails = await Promise.all(
        (adminData || []).map(async (admin) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", admin.id)
            .single();

          return {
            id: admin.id,
            email: profileData?.email || "Unknown",
            created_at: admin.created_at,
          };
        })
      );

      setAdminUsers(adminUsersWithDetails);
      
      // Fetch regular users (all profiles)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at");
        
      if (profilesError) throw new Error(profilesError.message);
      
      // Filter out admin users
      const adminIds = adminUsersWithDetails.map(admin => admin.id);
      const regularUsersData = (profilesData || []).filter(
        user => !adminIds.includes(user.id)
      );
      
      setRegularUsers(regularUsersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error instanceof Error ? error.message : "Failed to load users. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load users.",
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

      const { error } = await supabase.functions.invoke("create-admin-user", {
        method: "POST",
        body: { email: newUserEmail },
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
      setError("");
      setSuccess("");
      
      const { error } = await supabase.functions.invoke("create-admin-user", {
        method: "POST",
        body: { userId, email: userEmail },
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

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage users and administrators
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Button 
        variant="outline" 
        onClick={fetchUsers} 
        className="mb-4"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <></>
        )}
        Refresh Users
      </Button>

      <Tabs defaultValue="users" className="mb-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
          <TabsTrigger value="create">Create User</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Regular Users
              </CardTitle>
              <CardDescription>
                Manage users and promote to administrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : regularUsers.length === 0 ? (
                <p className="text-muted-foreground">No users found.</p>
              ) : (
                <ul className="space-y-2">
                  {regularUsers.map((user) => (
                    <li key={user.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.full_name || 'No name'} • Created on {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          promoteToAdmin(user.id, user.email);
                        }}
                        disabled={isPromoting && selectedUserId === user.id}
                      >
                        {isPromoting && selectedUserId === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <ShieldAlert className="h-3 w-3 mr-1" />
                        )}
                        Make Admin
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldAlert className="mr-2 h-5 w-5 text-amber-500" />
                Administrators
              </CardTitle>
              <CardDescription>
                Users with full access to the admin portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : adminUsers.length === 0 ? (
                <p className="text-muted-foreground">No admin users found.</p>
              ) : (
                <ul className="space-y-2">
                  {adminUsers.map((admin) => (
                    <li key={admin.id} className="flex items-center p-3 border rounded-md">
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{admin.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Admin since {new Date(admin.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                Create New User
              </CardTitle>
              <CardDescription>
                Add a new user to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => {
                  setNewUserEmail("");
                  setNewUserName("");
                  setNewUserPassword("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={createRegularUser} 
                disabled={isAdding || !newUserEmail || !newUserPassword || !newUserName}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldAlert className="mr-2 h-5 w-5 text-amber-500" />
                Create Admin User
              </CardTitle>
              <CardDescription>
                Add a new administrator with full system access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="admin@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="mb-0"
                  />
                </div>
                <Button 
                  onClick={addAdminUser} 
                  disabled={isAdding || !newUserEmail}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Admin
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
