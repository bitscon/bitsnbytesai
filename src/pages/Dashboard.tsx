
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LockIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Purchase {
  id: string;
  created_at: string;
  payment_provider: string;
  amount: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_purchases")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .eq("product_id", "ai_prompts")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking purchase status:", error);
          toast({
            title: "Error",
            description: "Failed to check purchase status. Please try again.",
            variant: "destructive",
          });
        }

        setHasPurchased(!!data);
        setPurchase(data);
      } catch (error) {
        console.error("Error checking purchase status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPurchaseStatus();
  }, [user, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Welcome to your Dashboard</h1>
          
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border mb-8">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Account ID:</strong> {user?.id}</p>
              <p><strong>Verified:</strong> {user?.email_confirmed_at ? 'Yes' : 'No'}</p>
            </div>
            <div className="mt-6">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go to Home
              </Button>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h2 className="text-xl font-semibold mb-4">AI Prompts Library Access</h2>
            
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Checking access status...</p>
              </div>
            ) : hasPurchased ? (
              <div>
                <div className="flex items-start space-x-3 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">You have full access to our AI Prompts Library!</p>
                    <p className="text-sm text-muted-foreground">
                      Purchased on {new Date(purchase?.created_at || "").toLocaleDateString()} 
                      via {purchase?.payment_provider === "stripe" ? "Credit Card" : "PayPal"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-medium">Your Prompts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Example prompt cards */}
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border border-border rounded-md p-4 hover:bg-accent/50 transition-colors">
                        <h4 className="font-medium">Advanced SEO Content Writer</h4>
                        <p className="text-sm text-muted-foreground mb-2">Convert outlines into SEO-optimized articles</p>
                        <Button variant="secondary" size="sm" className="w-full">View Prompt</Button>
                      </div>
                    ))}
                  </div>
                  
                  <Button className="w-full mt-4">
                    View All Prompts
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start space-x-3 mb-4">
                  <LockIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">You don't have access to our Premium Prompts Library yet</p>
                    <p className="text-sm text-muted-foreground">
                      Purchase our premium content to access over 100 expert-crafted AI prompts.
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => window.location.href = '/#pricing'}
                  className="mt-4 bg-brand-blue hover:bg-brand-blue/90"
                >
                  Unlock Premium Access
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
