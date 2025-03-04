
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle, ArrowRight, Star, Shield, Zap, Clock } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [discountApplied, setDiscountApplied] = useState(false);
  
  // Pricing state
  const regularPrice = 97;
  const discountedPrice = 67;
  const currentPrice = discountApplied ? discountedPrice : regularPrice;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero section */}
      <section className="pt-24 md:pt-36 px-4">
        <div className="container mx-auto text-center max-w-4xl animate-fade-in">
          <Badge className="mb-4 py-1.5 text-sm bg-brand-blue/10 text-brand-blue font-medium border-none">
            100+ Professional AI Prompts
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
            Unlock the Full Power of AI with Expert-Crafted Prompts
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform how you interact with AI and achieve remarkable results with our library of 100+ prompts designed for professionals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => navigate("/register")}
              size="lg" 
              className="bg-brand-blue hover:bg-brand-blue/90"
            >
              Get Access Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              onClick={() => {
                const featuresSection = document.getElementById('features');
                featuresSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline" 
              size="lg"
            >
              Learn More
            </Button>
          </div>
          <div className="mt-12 flex items-center justify-center space-x-2">
            <div className="flex -space-x-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-4 border-background">
                  <span className="text-sm font-medium">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))}
            </div>
            <div className="ml-4 text-sm text-muted-foreground">
              <strong>100+</strong> professionals already use our prompts
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 py-1.5 text-sm bg-brand-blue/10 text-brand-blue font-medium border-none">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enhance Your AI Experience
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our curated prompt library is designed to help you get more from AI tools like ChatGPT, Claude, and more.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up">
            <Card className="bg-card border-border">
              <CardHeader>
                <Zap className="h-12 w-12 text-brand-blue mb-4" />
                <CardTitle>Productivity Boosters</CardTitle>
                <CardDescription>
                  Save hours of time with prompts that deliver exactly what you need.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Generate content 5x faster</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Improve response quality</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Reduce iterations needed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardHeader>
                <Star className="h-12 w-12 text-brand-blue mb-4" />
                <CardTitle>Expert-Crafted Quality</CardTitle>
                <CardDescription>
                  Developed by AI specialists with optimal response structures.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Tested on multiple AI models</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Refined through iterations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Optimized response formats</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardHeader>
                <Shield className="h-12 w-12 text-brand-blue mb-4" />
                <CardTitle>Lifetime Access</CardTitle>
                <CardDescription>
                  One-time payment for unlimited access to our growing library.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>All future prompts included</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Regular updates and improvements</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Copy with one click</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Pricing section */}
      <section id="pricing" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 py-1.5 text-sm bg-brand-blue/10 text-brand-blue font-medium border-none">
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              One-time payment, lifetime access to our complete library of AI prompts.
            </p>
          </div>
          
          <div className="flex justify-center animate-slide-up">
            <Card className="w-full max-w-lg border-2 border-brand-blue">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Lifetime Access</CardTitle>
                <CardDescription>Everything you need to master AI prompting</CardDescription>
                <div className="mt-4 flex items-center justify-center">
                  {discountApplied && (
                    <span className="text-xl line-through text-muted-foreground mr-2">${regularPrice}</span>
                  )}
                  <span className="text-4xl font-bold">${currentPrice}</span>
                  <span className="text-muted-foreground ml-1">one-time</span>
                </div>
                {discountApplied && (
                  <Badge className="mt-2 bg-green-500 hover:bg-green-600">Save ${regularPrice - discountedPrice}</Badge>
                )}
                <Button 
                  onClick={() => navigate("/register")}
                  className="mt-6 w-full bg-brand-blue hover:bg-brand-blue/90"
                  size="lg"
                >
                  Get Instant Access
                </Button>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-4">What's included:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>100+ expert-crafted AI prompts</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Lifetime access to all future prompts</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Copy-to-clipboard functionality</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Categorized and searchable library</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>Premium support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                <Button 
                  variant="ghost"
                  onClick={() => setDiscountApplied(prev => !prev)}
                  className="text-brand-blue hover:text-brand-blue/90 hover:bg-brand-blue/10"
                >
                  {discountApplied ? "Remove discount" : "Apply discount code"}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-in">
            <p>Secure payment via Stripe. 30-day money-back guarantee.</p>
          </div>
        </div>
      </section>
      
      {/* FAQ section */}
      <section id="faq" className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 py-1.5 text-sm bg-brand-blue/10 text-brand-blue font-medium border-none">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our AI prompt library.
            </p>
          </div>
          
          <div className="animate-fade-in">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What makes these prompts special?</AccordionTrigger>
                <AccordionContent>
                  Our prompts are meticulously crafted by AI specialists who understand the intricacies of how AI models respond. Each prompt is tested, refined, and optimized to produce consistently excellent results. They include the perfect balance of context, instructions, and constraints to guide AI toward better outputs.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is this a subscription?</AccordionTrigger>
                <AccordionContent>
                  No, this is a one-time purchase that gives you lifetime access to our entire prompt library, including all future additions. There are no recurring fees or hidden costs.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What AI models do these prompts work with?</AccordionTrigger>
                <AccordionContent>
                  Our prompts are designed to work with all major AI models, including ChatGPT (3.5 and 4), Claude, Gemini, and others. They're designed to be model-agnostic while leveraging the capabilities of advanced language models.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I request a refund?</AccordionTrigger>
                <AccordionContent>
                  Yes, we offer a 30-day money-back guarantee. If you're not satisfied with the prompts, simply contact us for a full refund, no questions asked.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>How often are new prompts added?</AccordionTrigger>
                <AccordionContent>
                  We regularly add new prompts to the library based on user feedback, emerging AI capabilities, and industry trends. You can expect new additions at least monthly, all included in your one-time purchase.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                <AccordionTrigger>Can I share my account with others?</AccordionTrigger>
                <AccordionContent>
                  No, your access is for individual use only. Each user needs their own license. We have systems in place to detect and prevent account sharing. If you're interested in team or organization access, please contact us for special rates.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-24 px-4 bg-brand-blue text-white">
        <div className="container mx-auto max-w-4xl text-center animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your AI Experience?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join hundreds of professionals who are already getting better results with our prompt library.
          </p>
          <Button 
            onClick={() => navigate("/register")}
            size="lg" 
            variant="secondary"
            className="bg-white text-brand-blue hover:bg-white/90"
          >
            Get Instant Access <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-4 text-sm opacity-80">
            30-day money-back guarantee. No risk, all reward.
          </p>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
