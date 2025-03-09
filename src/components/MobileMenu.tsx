
import React from "react";
import { Button } from "@/components/ui/button";
import { AuthButtons } from "./AuthButtons";
import { User } from "@supabase/supabase-js";

interface MobileMenuProps {
  isOpen: boolean;
  user: User | null;
  signOut: () => Promise<{ error: any | null }>;
  closeMobileMenu: () => void;
  isAdmin?: boolean; // Added isAdmin prop
}

export function MobileMenu({ isOpen, user, signOut, closeMobileMenu, isAdmin = false }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4 space-y-4">
        <a 
          href="#features" 
          className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
          onClick={() => closeMobileMenu()}
        >
          Features
        </a>
        <a 
          href="#pricing" 
          className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
          onClick={() => closeMobileMenu()}
        >
          Pricing
        </a>
        <a 
          href="#faq" 
          className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
          onClick={() => closeMobileMenu()}
        >
          FAQ
        </a>
        <div className="pt-2 flex flex-col space-y-2">
          <AuthButtons 
            user={user} 
            signOut={signOut} 
            closeMobileMenu={closeMobileMenu} 
            isMobile={true}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
