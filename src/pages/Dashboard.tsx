
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { UserNavbar } from "@/components/UserNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock } from "lucide-react";
import { Purchase } from "@/types/purchases";
import { PromptLibrary } from "@/components/prompts/PromptLibrary";

export default function Dashboard() {
  const { user } = useAuth();
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user) return;

      try {
        // Query the user_purchases table instead of profiles
        const { data, error } = await supabase
          .from("user_purchases")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "completed");

        if (error) {
          console.error("Error fetching purchase status:", error);
          return;
        }

        setHasPurchased(data && data.length > 0);
        setPurchases(data as Purchase[] || []);
      } catch (error) {
        console.error("Error checking purchase status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPurchaseStatus();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar hasPurchased={hasPurchased} /> 
      <div className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 col-span-1 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">AI Prompts Library</h2>
              {hasPurchased ? (
                <PromptLibrary />
              ) : (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Access Locked</h3>
                  <p className="text-muted-foreground mb-6">
                    Purchase access to unlock our full library of specialized AI prompts.
                  </p>
                  <Button onClick={() => window.location.href = "/"}>
                    Purchase Access
                  </Button>
                </div>
              )}
            </Card>
            
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Account</h2>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p>{user?.email}</p>
              </div>
              
              {hasPurchased && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Purchase History</h3>
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>${purchase.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(purchase.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment:</span>
                        <span className="capitalize">{purchase.payment_provider}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
