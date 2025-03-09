
import React from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2, CheckCircle2, BadgeInfo } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RegularUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_admin?: boolean;
  subscription_tier?: string;
  is_manual_subscription?: boolean;
}

interface UsersListProps {
  regularUsers: RegularUser[];
  isLoading: boolean;
  isPromoting: boolean;
  selectedUserId: string;
  promoteToAdmin: (id: string, email: string) => void;
}

export function UsersList({ regularUsers, isLoading, isPromoting, selectedUserId, promoteToAdmin }: UsersListProps) {
  // Helper function to get subscription badge colors
  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'pro':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'premium':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'enterprise':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>
          Manage your users and their access levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>A list of all users in the system</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                </TableCell>
              </TableRow>
            ) : regularUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-sm text-gray-500">No users found.</p>
                </TableCell>
              </TableRow>
            ) : (
              regularUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || "No name"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getSubscriptionBadgeColor(user.subscription_tier || 'free')}>
                        {(user.subscription_tier || 'free').charAt(0).toUpperCase() + (user.subscription_tier || 'free').slice(1)}
                      </Badge>
                      
                      {user.is_manual_subscription && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <BadgeInfo className="h-4 w-4 text-blue-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Manually assigned subscription</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.is_admin ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => promoteToAdmin(user.id, user.email)}
                        disabled={isPromoting}
                      >
                        {isPromoting && selectedUserId === user.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            Promoting...
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                            Make Admin
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
