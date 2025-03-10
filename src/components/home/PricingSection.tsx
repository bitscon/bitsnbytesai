
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { fetchSubscriptionPlans } from "@/api/subscriptionAPI";
import { BillingIntervalSelector } from "@/components/subscription/BillingIntervalSelector";
import { Skeleton } from "@/components/ui/skeleton";

export function PricingSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const { plans, error } = await fetchSubscriptionPlans();
        
        if (error) {
          console.error("Error loading subscription plans:", error);
          setError("Unable to load subscription plans. Please try again later.");
        } else if (!plans || plans.length === 0) {
          setError("No subscription plans available at this time.");
        } else {
          // Sort plans by price to ensure proper display order
          const sortedPlans = [...plans].sort((a, b) => 
            a.price_monthly - b.price_monthly
          );
          setPlans(sortedPlans);
        }
      } catch (error) {
        console.error("Error in loadPlans:", error);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handlePlanSelection = () => {
    if (user) {
      navigate("/subscription");
    } else {
      navigate("/login", { state: { returnTo: "/subscription" } });
    }
  };

  // Display the starter plan (usually the first one after free)
  const starterPlan = plans.find(plan => plan.tier === 'pro') || (plans.length > 1 ? plans[1] : plans[0]);

  // Fallback pricing information when API fails
  const fallbackPlanInfo = {
    name: "Pro Plan",
    price_monthly: 19.99,
    price_yearly: 199.99,
    features: [
      "100+ specialized AI prompts",
      "Regular updates with new prompts",
      "Works with ChatGPT, Claude, Midjourney",
      "Organized by categories and use cases"
    ]
  };

  const price = billingInterval === 'month' 
    ? (starterPlan?.price_monthly || fallbackPlanInfo.price_monthly) 
    : (starterPlan?.price_yearly || fallbackPlanInfo.price_yearly);

  return (
    <section id="pricing" className="py-16">
      <div className="container px-4 mx-auto">
        <div className="max-w-md mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground">
            Subscribe to get unlimited access to our premium prompt library.
          </p>
        </div>

        {loading ? (
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <Skeleton className="h-12 w-full max-w-md mx-auto" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        ) : error ? (
          <Card className="max-w-md mx-auto p-6">
            <div className="text-center mb-4">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
              <h3 className="text-xl font-semibold">Subscription Information Unavailable</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
            <p className="text-center mb-6">
              We're currently experiencing an issue with our subscription system. 
              Please check back later or contact support for assistance.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => navigate("/contact")} variant="outline">
                Contact Support
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="max-w-sm mx-auto mb-8">
              <BillingIntervalSelector 
                billingInterval={billingInterval} 
                setBillingInterval={setBillingInterval} 
              />
            </div>

            <Card className="max-w-md mx-auto overflow-hidden">
              <div className="bg-primary text-primary-foreground p-6 text-center">
                <h3 className="text-xl font-bold mb-1">{starterPlan?.name || fallbackPlanInfo.name}</h3>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="ml-1 text-primary-foreground/80">
                    /{billingInterval}
                  </span>
                </div>
                <p className="text-primary-foreground/90">Cancel anytime</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {(starterPlan?.features && typeof starterPlan?.features === 'object') ? 
                    Object.values(starterPlan.features).map((feature: any, index) => (
                      <li className="flex" key={index}>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature.description || feature}</span>
                      </li>
                    )) : 
                    fallbackPlanInfo.features.map((feature, index) => (
                      <li className="flex" key={index}>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))
                  }
                </ul>
                
                <Button 
                  className="w-full" 
                  onClick={handlePlanSelection}
                >
                  {user ? 'Choose Plan' : 'Sign Up Now'}
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}
