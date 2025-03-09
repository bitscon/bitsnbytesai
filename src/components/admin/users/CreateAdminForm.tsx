
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CreateAdminFormProps {
  addAdminUser: () => Promise<void>;
  isAdding: boolean;
  newUserEmail: string;
  setNewUserEmail: (email: string) => void;
}

export function CreateAdminForm({ 
  addAdminUser, 
  isAdding, 
  newUserEmail, 
  setNewUserEmail 
}: CreateAdminFormProps) {
  return (
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
  );
}
