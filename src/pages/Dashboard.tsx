
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { UserNavbar } from "@/components/UserNavbar";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Purchase } from "@/types/purchases";
import { PromptLibrary } from "@/components/prompts/PromptLibrary";

export default function Dashboard() {
  const { user } = useAuth();
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user) return;

      try {
        // Query the user_purchases table
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
          <div>
            <Card className="p-6">
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
          </div>
        )}
      </div>
    </div>
  );
}
