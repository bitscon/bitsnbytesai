
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { HelpCircle, LayoutDashboard, ShieldAlert, User as UserIcon } from "lucide-react";

interface UserMobileMenuProps {
  isOpen: boolean;
  user: User | null;
  signOut: () => Promise<{ error: any | null }>;
  closeMobileMenu: () => void;
  isAdmin?: boolean; // Added isAdmin prop
}

export function UserMobileMenu({ isOpen, user, signOut, closeMobileMenu, isAdmin = false }: UserMobileMenuProps) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  const handleNavLinkClick = (path: string) => {
    navigate(path);
    closeMobileMenu();
  };

  return (
    <div className="md:hidden bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center space-x-2 pb-4 mb-2 border-b">
          <span className="text-lg font-bold text-brand-blue">bits & bytes</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">AI</span>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => handleNavLinkClick("/admin/dashboard")}
            variant="outline"
            className="w-full justify-start text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            <ShieldAlert className="mr-2 h-4 w-4" />
            Admin Dashboard
          </Button>
        )}
        <Button 
          onClick={() => handleNavLinkClick("/dashboard")}
          variant="ghost"
          className="w-full justify-start text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Library
        </Button>
        <Button 
          onClick={() => handleNavLinkClick("/account")}
          variant="ghost"
          className="w-full justify-start text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          <UserIcon className="mr-2 h-4 w-4" />
          Account
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
