import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/theme/ThemeContext';
import { AuthProvider } from '@/context/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import AppThemeWrapper from '@/components/AppThemeWrapper';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminSettings from '@/pages/AdminSettings';
import AdminPrompts from '@/pages/AdminPrompts';
import AdminUsers from '@/pages/AdminUsers';
import AdminTheme from '@/pages/AdminTheme';
import AdminSubscriptionPlans from '@/pages/AdminSubscriptionPlans';
import AdminSubscriptionAnalytics from '@/pages/AdminSubscriptionAnalytics';
import SubscriptionPage from '@/pages/SubscriptionPage';
import SubscriptionSuccessPage from '@/pages/SubscriptionSuccessPage';
import SubscriptionCancelPage from '@/pages/SubscriptionCancelPage';
import SubscriptionManagePage from '@/pages/SubscriptionManagePage';
import NotFoundPage from '@/pages/NotFoundPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <AppThemeWrapper>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* User routes */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* Subscription routes */}
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
                <Route path="/subscription/cancel" element={<SubscriptionCancelPage />} />
                <Route path="/subscription/manage" element={<SubscriptionManagePage />} />
                
                {/* Admin routes */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/prompts" element={<AdminPrompts />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/theme" element={<AdminTheme />} />
                <Route path="/admin/subscription-plans" element={<AdminSubscriptionPlans />} />
                <Route path="/admin/subscription-analytics" element={<AdminSubscriptionAnalytics />} />
                
                {/* Fallback routes */}
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
              
              <Toaster />
              <SonnerToaster position="top-right" />
            </AppThemeWrapper>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
