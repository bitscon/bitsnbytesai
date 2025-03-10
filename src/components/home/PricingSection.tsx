
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { fetchSubscriptionPlans } from "@/api/subscriptionAPI";
import { BillingIntervalSelector } from "@/components/subscription/BillingIntervalSelector";

export function PricingSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const { plans, error } = await fetchSubscriptionPlans();
        
        if (error) {
          console.error("Error loading subscription plans:", error);
        } else {
          // Sort plans by price to ensure proper display order
          const sortedPlans = [...plans].sort((a, b) => 
            a.price_monthly - b.price_monthly
          );
          setPlans(sortedPlans);
        }
      } catch (error) {
        console.error("Error in loadPlans:", error);
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

  if (loading || !starterPlan) {
    return (
      <section id="pricing" className="py-16">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">
              Choose the right plan for your needs.
            </p>
          </div>
          <div className="h-40 flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded-lg h-32 w-full max-w-md"></div>
          </div>
        </div>
      </section>
    );
  }

  const price = billingInterval === 'month' 
    ? starterPlan.price_monthly 
    : starterPlan.price_yearly;

  return (
    <section id="pricing" className="py-16">
      <div className="container px-4 mx-auto">
        <div className="max-w-md mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground">
            Subscribe to get unlimited access to our premium prompt library.
          </p>
        </div>

        <div className="max-w-sm mx-auto mb-8">
          <BillingIntervalSelector 
            billingInterval={billingInterval} 
            setBillingInterval={setBillingInterval} 
          />
        </div>

        <Card className="max-w-md mx-auto overflow-hidden">
          <div className="bg-primary text-primary-foreground p-6 text-center">
            <h3 className="text-xl font-bold mb-1">{starterPlan.name}</h3>
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
              {starterPlan.features && typeof starterPlan.features === 'object' ? 
                Object.values(starterPlan.features).map((feature: any, index) => (
                  <li className="flex" key={index}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature.description || feature}</span>
                  </li>
                )) : (
                  <>
                    <li className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>100+ specialized AI prompts</span>
                    </li>
                    <li className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>Regular updates with new prompts</span>
                    </li>
                    <li className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>Works with ChatGPT, Claude, Midjourney</span>
                    </li>
                    <li className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>Organized by categories and use cases</span>
                    </li>
                  </>
                )
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
      </div>
    </section>
  );
}
