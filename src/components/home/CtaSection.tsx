
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-4">Ready to Upgrade Your AI Experience?</h2>
            <p className="text-primary-foreground/90 mb-6 text-lg">
              Join thousands of professionals who are getting more from AI with our premium prompts.
            </p>
            
            <ul className="space-y-2 mb-8">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>100+ expertly crafted prompts</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>One-time payment, lifetime access</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>Regular updates with new prompts</span>
              </li>
            </ul>
          </div>
          
          <div className="flex-1 flex flex-col items-center">
            <div className="bg-primary-foreground text-foreground p-6 rounded-lg shadow-xl max-w-md w-full">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold">Get Lifetime Access</h3>
                <p className="text-muted-foreground">One-time payment, no subscriptions</p>
              </div>
              
              <div className="text-center mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-muted-foreground ml-1">USD</span>
              </div>
              
              <Button 
                size="lg" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => {
                  const pricingSection = document.getElementById('pricing');
                  pricingSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Get Access Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
