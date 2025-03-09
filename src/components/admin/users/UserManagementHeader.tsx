
import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UserManagementHeaderProps {
  error: string;
  success: string;
}

export function UserManagementHeader({ error, success }: UserManagementHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">User Management</h1>
      <p className="text-muted-foreground mt-2">
        Create and manage users and administrators
      </p>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
