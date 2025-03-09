
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth"; // Fixed import path
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary">
            <Sparkles className="mr-1 h-4 w-4" />
            <span>Unlock the Full Potential of AI Tools</span>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
            Premium AI Prompts for <span className="text-primary">Exceptional Results</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Access our curated library of expert-crafted prompts designed to maximize your results with ChatGPT, Midjourney, and other AI tools.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button size="lg" onClick={() => navigate("/dashboard")} className="bg-primary hover:bg-primary/90">
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button size="lg" onClick={() => navigate("/login")} className="bg-primary hover:bg-primary/90">
                Sign In <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={() => {
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              View Pricing
            </Button>
          </div>
          
          <div className="mt-10 text-sm text-muted-foreground">
            <p>Used by professionals at companies like</p>
            <div className="mt-2 flex flex-wrap justify-center gap-x-8 gap-y-4">
              <span className="font-semibold">Google</span>
              <span className="font-semibold">Microsoft</span>
              <span className="font-semibold">Adobe</span>
              <span className="font-semibold">Shopify</span>
              <span className="font-semibold">Canva</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
