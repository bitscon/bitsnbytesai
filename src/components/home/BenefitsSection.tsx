
import React from "react";
import { Sparkles, Rocket, Lightbulb, Clock } from "lucide-react";

export function BenefitsSection() {
  const benefits = [
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: "Enhanced Creativity",
      description: "Break through creative blocks with AI-optimized prompts designed to inspire innovation."
    },
    {
      icon: <Rocket className="h-8 w-8 text-primary" />,
      title: "10x Productivity",
      description: "Save hours of prompt engineering with our ready-to-use, professionally crafted prompts."
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      title: "Higher Quality Results",
      description: "Generate superior AI outputs with prompts refined through thousands of tests."
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Instant Access",
      description: "Get immediate access to our complete library with a one-time purchase. No subscriptions."
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Our Prompts</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our premium AI prompts are designed to help you get the most out of AI tools without the frustration of trial and error.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="bg-background p-6 rounded-lg shadow-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-md"
            >
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
