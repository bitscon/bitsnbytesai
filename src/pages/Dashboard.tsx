
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { UserNavbar } from "@/components/UserNavbar";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { PromptLibrary } from "@/components/prompts/PromptLibrary";
import { motion } from "framer-motion";
import { useTheme } from "@/context/theme/ThemeContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { themeStyle } = useTheme();

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

    if (user) {
      checkPurchaseStatus();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background" style={themeStyle}>
      <UserNavbar hasPurchased={hasPurchased} /> 
      <div className="container mx-auto px-4 pt-20 pb-16">
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold">AI Prompts Library</h1>
          <p className="text-muted-foreground mt-2">
            Discover and use specialized AI prompts for your projects
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="p-6 shadow-md">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                </div>
              </div>
            ) : (
              hasPurchased ? (
                <PromptLibrary />
              ) : (
                <div className="text-center py-12">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">Access Locked</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Purchase access to unlock our full library of specialized AI prompts designed to enhance your productivity and creativity.
                  </p>
                  <Button onClick={() => window.location.href = "/"} size="lg">
                    Purchase Access
                  </Button>
                </div>
              )
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
