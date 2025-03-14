
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

// Create the context with a default undefined value
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
      console.log(`Fetching active theme for ${dark ? 'dark' : 'light'} mode`);
      
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .eq("is_dark", dark)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching theme:', error);
        setActiveTheme(null);
      } else if (data) {
        console.log('Active theme fetched:', data);
        setActiveTheme(data);
      } else {
        console.log('No active theme found, using default');
        setActiveTheme(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setActiveTheme(null);
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
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    
    // Create a style element for theme variables if it doesn't exist
    let styleElement = document.getElementById('global-theme-style') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'global-theme-style';
      document.head.appendChild(styleElement);
    }
    
    // Apply theme settings as CSS variables
    if (activeTheme) {
      console.log('Applying theme settings to root:', activeTheme);
      
      styleElement.textContent = `
        :root {
          --theme-brightness: ${activeTheme.brightness}%;
          --theme-contrast: ${activeTheme.contrast}%;
          --theme-saturation: ${activeTheme.saturation}%;
        }
      `;
    } else {
      // Default values if no theme is active
      styleElement.textContent = `
        :root {
          --theme-brightness: 100%;
          --theme-contrast: 100%;
          --theme-saturation: 100%;
        }
      `;
    }
    
    // Clean up direct filter application
    root.style.filter = '';
    document.body.style.filter = '';
  }, [isDarkMode, activeTheme]);
  
  // Fetch active theme on initial load and subscribe to changes
  useEffect(() => {
    fetchActiveTheme(isDarkMode);
    
    // Subscribe to theme changes in the database using Supabase's realtime features
    const themeSubscription = supabase
      .channel('theme-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'theme_settings',
          filter: `is_active=eq.true`
        },
        (payload) => {
          console.log('Theme settings changed:', payload);
          
          // Only update if the change affects the current mode
          const newTheme = payload.new as ThemeSettings;
          if (newTheme && newTheme.is_dark === isDarkMode && newTheme.is_active) {
            console.log('Updating active theme from subscription:', newTheme);
            setActiveTheme(newTheme);
          } else {
            // If an active theme was deactivated, we need to refetch
            fetchActiveTheme(isDarkMode);
          }
        }
      )
      .subscribe();
    
    return () => {
      console.log('Unsubscribing from theme changes');
      supabase.removeChannel(themeSubscription);
    };
  }, [isDarkMode]);

  // Generate theme style for components that need to apply the filter directly
  const themeStyle = React.useMemo(() => {
    if (!activeTheme) {
      return {};
    }

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
