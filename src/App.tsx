
import React from 'react';
import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/context/theme/ThemeContext';
import AppRoutes from '@/AppRoutes';
import AppThemeWrapper from '@/components/AppThemeWrapper';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppThemeWrapper>
          <AppRoutes />
        </AppThemeWrapper>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
