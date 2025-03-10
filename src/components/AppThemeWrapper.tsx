
import React from 'react';
import { useTheme } from '@/context/theme/ThemeContext';

interface AppThemeWrapperProps {
  children: React.ReactNode;
}

export default function AppThemeWrapper({ children }: AppThemeWrapperProps) {
  const { themeStyle } = useTheme();
  
  return (
    <div className="app-root" style={themeStyle}>
      {children}
    </div>
  );
}
