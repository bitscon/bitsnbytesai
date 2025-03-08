
import React from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { CheckoutOptions } from "@/components/CheckoutOptions";

export function PricingSection() {
  return (
    <section id="pricing" className="py-16">
      <div className="container px-4 mx-auto">
        <div className="max-w-md mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground">
            One-time payment for lifetime access to our premium prompt library.
          </p>
        </div>

        <Card className="max-w-md mx-auto overflow-hidden">
          <div className="bg-primary text-primary-foreground p-6 text-center">
            <h3 className="text-xl font-bold mb-1">Prompt Library Access</h3>
            <div className="flex items-center justify-center mb-2">
              <span className="text-4xl font-bold">$49</span>
              <span className="ml-1 text-primary-foreground/80">one-time</span>
            </div>
            <p className="text-primary-foreground/90">Lifetime access, all future updates</p>
          </div>
          <div className="p-6">
            <ul className="space-y-3 mb-6">
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
              <li className="flex">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Copy & paste ready to use format</span>
              </li>
            </ul>
            
            <CheckoutOptions price={49} productName="AI Prompts Library" />
          </div>
        </Card>
      </div>
    </section>
  );
}
