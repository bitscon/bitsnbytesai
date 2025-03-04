import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckoutOptions } from "@/components/CheckoutOptions";
import { ArrowRight, CheckCircle, Star, Zap } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
              Unlock the Power of AI with Premium Prompts
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Access our curated library of professional prompts designed to maximize your results with ChatGPT, Midjourney, and other AI tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button size="lg" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button size="lg" onClick={() => navigate("/register")}>
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
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

      {/* Pricing Section */}
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

      {/* Testimonials Section */}
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

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto">
            {faqItems.map((item, index) => (
              <Card key={index} className="mb-4">
                <div className="font-semibold mb-2">{item.question}</div>
                <p className="text-muted-foreground">{item.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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

      <Footer />
    </div>
  );
}
