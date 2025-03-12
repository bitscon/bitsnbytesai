
import React from 'react';

interface AppThemeWrapperProps {
  children: React.ReactNode;
}

export default function AppThemeWrapper({ children }: AppThemeWrapperProps) {
  return (
    <div className="app-root">
      {children}
    </div>
  );
}
