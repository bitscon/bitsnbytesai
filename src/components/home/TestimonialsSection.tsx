
import React from "react";
import { Card } from "@/components/ui/card";

export function TestimonialsSection() {
  const testimonialItems = [
    {
      quote:
        "These prompts have revolutionized my content creation process. Highly recommended!",
      author: "Sarah K., Marketing Manager",
    },
    {
      quote:
        "I'm getting better results with AI than ever before, thanks to this prompt library.",
      author: "John D., Product Developer",
    },
    {
      quote:
        "An invaluable resource for anyone looking to leverage AI in their business.",
      author: "Emily L., Entrepreneur",
    },
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          What Our Customers Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialItems.map((item, index) => (
            <Card key={index} className="p-6">
              <p className="text-lg italic mb-4">"{item.quote}"</p>
              <p className="text-muted-foreground">- {item.author}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
