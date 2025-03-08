
import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/theme/ThemeContext";

interface ThemeToggleProps {
  theme?: "light" | "dark";
  toggleTheme?: () => void;
}

export function ThemeToggle({ theme, toggleTheme }: ThemeToggleProps = {}) {
  const themeContext = useTheme();
  
  // Use props if provided, otherwise use context
  const isDarkMode = theme ? theme === "dark" : themeContext.isDarkMode;
  const handleToggle = toggleTheme || themeContext.toggleTheme;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="ml-2"
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
