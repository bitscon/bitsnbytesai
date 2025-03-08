import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeSettings {
  id: string;
  preset_name: string;
  is_dark: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  is_active: boolean;
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  activeTheme: ThemeSettings | null;
  themeStyle: React.CSSProperties;
  loadingTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check if the user has a saved preference
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode) {
      return savedMode === 'dark';
    }
    // Otherwise use the system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [activeTheme, setActiveTheme] = useState<ThemeSettings | null>(null);
  const [loadingTheme, setLoadingTheme] = useState<boolean>(true);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme-mode', newMode ? 'dark' : 'light');
    fetchActiveTheme(newMode);
  };

  // Fetch the active theme from Supabase
  const fetchActiveTheme = async (dark: boolean) => {
    setLoadingTheme(true);
    try {
      const { data, error } = await supabase
        .from('theme_settings')
        .select('*')
        .eq('is_dark', dark)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching theme:', error);
        setActiveTheme(null);
      } else {
        setActiveTheme(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingTheme(false);
    }
  };

  // Apply theme to document root element
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark/light mode class
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply theme settings as a CSS filter on the root element
    if (activeTheme) {
      root.style.filter = `brightness(${activeTheme.brightness}%) contrast(${activeTheme.contrast}%) saturate(${activeTheme.saturation}%)`;
    } else {
      root.style.filter = '';
    }
    
    return () => {
      // Cleanup filter styles when component unmounts
      root.style.filter = '';
    };
  }, [isDarkMode, activeTheme]);
  
  // Fetch active theme on initial load
  useEffect(() => {
    fetchActiveTheme(isDarkMode);
    
    // Subscribe to theme changes in the database
    const themeSubscription = supabase
      .channel('theme_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'theme_settings' },
        () => {
          fetchActiveTheme(isDarkMode);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(themeSubscription);
    };
  }, [isDarkMode]);

  // Generate CSS custom properties for the active theme
  const themeStyle = React.useMemo(() => {
    if (!activeTheme) return {};

    return {
      filter: `brightness(${activeTheme.brightness}%) contrast(${activeTheme.contrast}%) saturate(${activeTheme.saturation}%)`,
      transition: 'filter 0.3s ease'
    };
  }, [activeTheme]);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        activeTheme,
        themeStyle,
        loadingTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
