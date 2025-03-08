
import React from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle, Star, Zap } from "lucide-react";

export function FeaturesSection() {
  const featureItems = [
    {
      title: "Curated by Experts",
      description:
        "Our prompts are crafted by AI specialists to ensure top-notch quality and relevance.",
      icon: Star,
    },
    {
      title: "Maximize Your AI",
      description:
        "Get more effective and efficient outputs from your AI tools, saving you time and resources.",
      icon: Zap,
    },
    {
      title: "Versatile Applications",
      description:
        "Perfect for marketing, content creation, product development, and more.",
      icon: CheckCircle,
    },
  ];

  return (
    <section className="py-12 bg-muted/50">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Our Prompts Are Different
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featureItems.map((item, index) => (
            <Card key={index} className="p-6">
              <item.icon className="h-6 w-6 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
