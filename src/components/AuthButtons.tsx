
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { ShieldAlert } from "lucide-react";

interface AuthButtonsProps {
  user: User | null;
  signOut: () => Promise<{ error: any | null }>;
  closeMobileMenu?: () => void;
  isMobile?: boolean;
  isAdmin?: boolean;
}

export function AuthButtons({ user, signOut, closeMobileMenu, isMobile = false, isAdmin = false }: AuthButtonsProps) {
  const navigate = useNavigate();
  
  const handleNavigation = (path: string) => {
    if (closeMobileMenu) {
      closeMobileMenu();
    }
    navigate(path);
  };

  if (user) {
    return (
      <>
        {isAdmin && (
          <Button 
            onClick={() => handleNavigation("/admin/dashboard")}
            variant="outline"
            className={`${isMobile ? "w-full" : "ml-2"} flex items-center gap-1`}
          >
            <ShieldAlert className="h-4 w-4" />
            Admin
          </Button>
        )}
        <Button 
          onClick={() => handleNavigation("/dashboard")}
          variant="outline"
          className={isMobile ? "w-full" : "ml-2"}
        >
          Library
        </Button>
        <Button 
          onClick={() => {
            signOut();
            if (closeMobileMenu) {
              closeMobileMenu();
            }
          }}
          className={isMobile ? "w-full bg-brand-blue hover:bg-brand-blue/90" : "ml-2 bg-brand-blue hover:bg-brand-blue/90"}
        >
          Sign Out
        </Button>
      </>
    );
  }

  return (
    <>
      <Button 
        onClick={() => handleNavigation("/login")}
        variant="outline"
        className={isMobile ? "w-full" : "ml-2"}
      >
        Sign In
      </Button>
      <Button 
        onClick={() => handleNavigation("/register")}
        className={isMobile ? "w-full bg-brand-blue hover:bg-brand-blue/90" : "ml-2 bg-brand-blue hover:bg-brand-blue/90"}
      >
        Get Started
      </Button>
    </>
  );
}
