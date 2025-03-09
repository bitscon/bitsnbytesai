
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubscriptionTier } from "@/types/subscription";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateUserFormProps {
  createRegularUser: (userData: {
    email: string;
    name: string;
    password: string;
    subscriptionTier?: SubscriptionTier;
    isManualSubscription?: boolean;
  }) => Promise<void>;
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
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
  const [isManualSubscription, setIsManualSubscription] = useState(false);

  const handleCreateUser = () => {
    createRegularUser({
      email: newUserEmail,
      name: newUserName,
      password: newUserPassword,
      subscriptionTier: isManualSubscription ? subscriptionTier : undefined,
      isManualSubscription
    });
  };

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
          
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="manualSubscription" 
                checked={isManualSubscription}
                onCheckedChange={(checked) => setIsManualSubscription(checked as boolean)}
              />
              <Label htmlFor="manualSubscription" className="font-medium">
                Assign subscription tier manually (no payment required)
              </Label>
            </div>
            
            {isManualSubscription && (
              <>
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    This will create a user with the selected subscription tier without requiring payment.
                    Users created this way will be tracked separately in analytics.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="subscriptionTier">Subscription Tier</Label>
                  <Select 
                    value={subscriptionTier} 
                    onValueChange={(value) => setSubscriptionTier(value as SubscriptionTier)}
                  >
                    <SelectTrigger id="subscriptionTier">
                      <SelectValue placeholder="Select a subscription tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Subscription Tiers</SelectLabel>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
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
            setSubscriptionTier("free");
            setIsManualSubscription(false);
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCreateUser} 
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
