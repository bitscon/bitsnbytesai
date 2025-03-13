
import React from 'react';
import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/context/theme/ThemeContext';
import AppRoutes from '@/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
