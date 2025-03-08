
import React from "react";
import { Search, Clipboard, ArrowRight, Zap } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      icon: <Search className="h-10 w-10 text-primary" />,
      title: "Browse Categories",
      description: "Explore our organized library of prompts by use case, AI tool, or industry."
    },
    {
      icon: <Clipboard className="h-10 w-10 text-primary" />,
      title: "Copy & Paste",
      description: "Select a prompt, customize it to your needs, and paste it into your AI tool."
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Get Results",
      description: "Watch as your AI tool generates superior results with our optimized prompts."
    }
  ];

  return (
    <section className="py-20">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Getting started with our AI prompt library is simple. Follow these steps to instantly improve your AI outputs.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="text-center px-4 mb-6 md:mb-0">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block mx-2">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
