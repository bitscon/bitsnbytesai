
import React from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminUser {
  id: string;
  email: string;
  full_name?: string | null;
  created_at: string;
}

interface AdminUsersListProps {
  adminUsers: AdminUser[];
  isLoading: boolean;
}

export function AdminUsersList({ adminUsers, isLoading }: AdminUsersListProps) {
  return (
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
  );
}
