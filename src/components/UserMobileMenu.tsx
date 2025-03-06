
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { HelpCircle, LayoutDashboard } from "lucide-react";

interface UserMobileMenuProps {
  isOpen: boolean;
  user: User | null;
  signOut: () => Promise<{ error: any | null }>;
  closeMobileMenu: () => void;
}

export function UserMobileMenu({ isOpen, user, signOut, closeMobileMenu }: UserMobileMenuProps) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  const handleNavLinkClick = (path: string) => {
    navigate(path);
    closeMobileMenu();
  };

  return (
    <div className="md:hidden bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4 space-y-4">
        <Button 
          onClick={() => handleNavLinkClick("/dashboard")}
          variant="ghost"
          className="w-full justify-start text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button 
          onClick={() => handleNavLinkClick("/faq")}
          variant="ghost"
          className="w-full justify-start text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          FAQ
        </Button>
        <Button 
          onClick={() => handleNavLinkClick("/help")}
          variant="ghost"
          className="w-full justify-start text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Help
        </Button>
        {user && (
          <Button 
            onClick={() => {
              signOut();
              closeMobileMenu();
            }}
            className="w-full bg-brand-blue hover:bg-brand-blue/90"
          >
            Sign Out
          </Button>
        )}
      </div>
    </div>
  );
}
