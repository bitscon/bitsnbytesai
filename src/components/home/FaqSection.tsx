
import React from "react";
import { Card } from "@/components/ui/card";

export function FaqSection() {
  const faqItems = [
    {
      question: "What is included in the prompt library?",
      answer:
        "You'll get access to over 100 premium AI prompts, regularly updated with new content.",
    },
    {
      question: "Which AI tools are compatible with these prompts?",
      answer:
        "Our prompts are designed to work seamlessly with ChatGPT, Midjourney, and other leading AI platforms.",
    },
    {
      question: "How often is the library updated?",
      answer:
        "We add new prompts to the library on a monthly basis, ensuring you always have access to the latest and greatest content.",
    },
    {
      question: "Is there a money-back guarantee?",
      answer:
        "Yes, we offer a 30-day money-back guarantee if you're not completely satisfied with your purchase.",
    },
  ];

  return (
    <section className="py-16">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto">
          {faqItems.map((item, index) => (
            <Card key={index} className="p-6 mb-4">
              <div className="font-semibold mb-2">{item.question}</div>
              <p className="text-muted-foreground">{item.answer}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
