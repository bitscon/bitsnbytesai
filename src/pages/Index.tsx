
import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { PricingSection } from "@/components/home/PricingSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { FaqSection } from "@/components/home/FaqSection";
import { CtaSection } from "@/components/home/CtaSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <BenefitsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
