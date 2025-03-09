
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Loader2,
  ShieldAlert,
  Mail,
  Star
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RegularUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_admin?: boolean;
}

interface UsersListProps {
  regularUsers: RegularUser[];
  isLoading: boolean;
  isPromoting: boolean;
  selectedUserId: string;
  promoteToAdmin: (userId: string, userEmail: string) => void;
}

export function UsersList({ 
  regularUsers, 
  isLoading, 
  isPromoting, 
  selectedUserId, 
  promoteToAdmin 
}: UsersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
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
                  <div className="flex items-center">
                    <p className="font-medium">{user.email}</p>
                    {user.is_admin && (
                      <div className="ml-2" title="This user is also an administrator">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground ml-1">
                    {user.full_name || 'No name'} • Created on {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => promoteToAdmin(user.id, user.email)}
                  disabled={isPromoting && selectedUserId === user.id || user.is_admin}
                >
                  {isPromoting && selectedUserId === user.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <ShieldAlert className="h-3 w-3 mr-1" />
                  )}
                  {user.is_admin ? 'Admin' : 'Make Admin'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
