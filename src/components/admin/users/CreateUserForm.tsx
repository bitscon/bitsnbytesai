
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface CreateUserFormProps {
  createRegularUser: () => Promise<void>;
  isAdding: boolean;
  newUserEmail: string;
  setNewUserEmail: (email: string) => void;
  newUserName: string;
  setNewUserName: (name: string) => void;
  newUserPassword: string;
  setNewUserPassword: (password: string) => void;
}

export function CreateUserForm({ 
  createRegularUser, 
  isAdding, 
  newUserEmail, 
  setNewUserEmail, 
  newUserName, 
  setNewUserName, 
  newUserPassword, 
  setNewUserPassword 
}: CreateUserFormProps) {
  return (
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
  );
}
