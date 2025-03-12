
import React from 'react';
import { ThemeProvider } from '@/context/theme/ThemeContext';

interface AppThemeWrapperProps {
  children: React.ReactNode;
}

export default function AppThemeWrapper({ children }: AppThemeWrapperProps) {
  return (
    <ThemeProvider>
      <div className="app-root">
        {children}
      </div>
    </ThemeProvider>
  );
}
