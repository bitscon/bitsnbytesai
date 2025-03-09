
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, ShieldAlert, CreditCard } from "lucide-react";
import { UserMobileMenu } from "@/components/UserMobileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/context/theme/ThemeContext";
import { useSubscription } from "@/hooks/use-subscription";

interface UserNavbarProps {
  hasPurchased?: boolean;
}

export function UserNavbar({ hasPurchased }: UserNavbarProps) {
  const { user, signOut, checkAdminStatus } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { subscription } = useSubscription();

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const isUserAdmin = await checkAdminStatus();
        setIsAdmin(isUserAdmin);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user, checkAdminStatus]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="bg-background border-b border-border sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-brand-blue">bits & bytes</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">AI</span>
        </Link>
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-4">
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-1"
              >
                <ShieldAlert className="h-4 w-4" />
                Admin
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Library
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/subscription")}
              className="flex items-center gap-1"
            >
              <CreditCard className="h-4 w-4" />
              {subscription && subscription.tier !== 'free' ? 'Subscription' : 'Upgrade'}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/account")}>
              Account
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url as string} alt={user.email as string} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/subscription")}>
                    Manage Subscription
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
          <ThemeToggle />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs p-0">
              <SheetHeader className="pl-6 pr-8">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Navigate through your account settings and preferences.
                </SheetDescription>
              </SheetHeader>
              <UserMobileMenu
                isOpen={isMobileMenuOpen}
                user={user}
                signOut={signOut}
                closeMobileMenu={closeMobileMenu}
                isAdmin={isAdmin}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
