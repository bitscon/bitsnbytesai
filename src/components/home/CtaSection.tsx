
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container px-4 mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Upgrade Your AI Experience?</h2>
        <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          Join thousands of professionals who are getting more from AI with our premium prompts.
        </p>
        <Button 
          size="lg" 
          variant="secondary"
          onClick={() => {
            const pricingSection = document.getElementById('pricing');
            pricingSection?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Get Access Now <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
