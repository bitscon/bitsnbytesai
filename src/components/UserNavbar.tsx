
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, HelpCircle, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";

export function UserNavbar({ hasPurchased = false }: { hasPurchased?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      }
    } else if (prefersDark) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-brand-blue">bits & bytes</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">AI</span>
            </a>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Button 
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button 
              onClick={() => navigate("/faq")}
              variant="ghost"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              FAQ
            </Button>
            <Button 
              onClick={() => navigate("/help")}
              variant="ghost"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Help
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="ml-2"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            
            {user && (
              <Button 
                onClick={() => signOut()}
                className="ml-2 bg-brand-blue hover:bg-brand-blue/90"
              >
                Sign Out
              </Button>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Button 
              onClick={() => {
                navigate("/dashboard");
                setIsMobileMenuOpen(false);
              }}
              variant="ghost"
              className="w-full justify-start text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button 
              onClick={() => {
                navigate("/faq");
                setIsMobileMenuOpen(false);
              }}
              variant="ghost"
              className="w-full justify-start text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              FAQ
            </Button>
            <Button 
              onClick={() => {
                navigate("/help");
                setIsMobileMenuOpen(false);
              }}
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
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-brand-blue hover:bg-brand-blue/90"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
