
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  AlertCircle, 
  UserPlus, 
  CheckCircle, 
  Users, 
  ShieldAlert,
  Mail
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      setIsLoading(true);
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id, created_at");

      if (adminError) throw new Error(adminError.message);

      // For each admin ID, get the user's email
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
    } catch (error) {
      console.error("Error fetching admin users:", error);
      setError("Failed to load admin users. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load admin users.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addAdminUser = async () => {
    if (!newAdminEmail) {
      setError("Please enter an email address.");
      return;
    }

    try {
      setIsAdding(true);
      setError("");
      setSuccess("");

      const { error } = await supabase.functions.invoke("create-admin-user", {
        method: "POST",
        body: { email: newAdminEmail },
      });

      if (error) throw new Error(error.message);

      // Success
      setSuccess(`${newAdminEmail} has been added as an admin.`);
      setNewAdminEmail("");
      toast({
        title: "Success",
        description: `${newAdminEmail} has been added as an admin.`,
      });

      // Refresh admin users list
      fetchAdminUsers();
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

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Users</h1>
        <p className="text-muted-foreground mt-2">
          Manage administrator accounts
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldAlert className="mr-2 h-5 w-5 text-amber-500" />
              Security Notice
            </CardTitle>
            <CardDescription>
              Admin users have full access to manage API keys, user accounts, and other sensitive settings.
              Only grant admin access to trusted individuals.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Add New Admin
            </CardTitle>
            <CardDescription>
              Enter the email address of the user you want to add as an administrator.
              If the account doesn't exist, one will be created automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Input
                  placeholder="admin@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="mb-0"
                />
              </div>
              <Button 
                onClick={addAdminUser} 
                disabled={isAdding || !newAdminEmail}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Current Administrators
            </CardTitle>
            <CardDescription>
              List of users with administrative privileges
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
                  <li key={admin.id} className="flex items-center p-2 border rounded-md">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{admin.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Added on {new Date(admin.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
