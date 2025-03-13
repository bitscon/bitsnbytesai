
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import AppThemeWrapper from '@/components/AppThemeWrapper';

// Pages - only importing existing pages
import AdminDashboard from '@/pages/AdminDashboard';
import AdminPrompts from '@/pages/AdminPrompts';
import AdminUsers from '@/pages/AdminUsers';
import AdminSubscriptionPlans from '@/pages/AdminSubscriptionPlans';
import AdminSubscriptionAnalytics from '@/pages/AdminSubscriptionAnalytics';
import NotFoundPage from '@/pages/NotFound';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import Dashboard from '@/pages/Dashboard';
import Subscription from '@/pages/Subscription';
import SubscriptionSuccess from '@/pages/SubscriptionSuccess';
import AdminThemeSettings from '@/pages/AdminThemeSettings';
import AdminApiSettings from '@/pages/AdminApiSettings';

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
      <AppThemeWrapper>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SignUp />} />
          
          {/* User routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Subscription routes */}
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/subscription/success" element={<SubscriptionSuccess />} />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminApiSettings />} />
          <Route path="/admin/prompts" element={<AdminPrompts />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/theme" element={<AdminThemeSettings />} />
          <Route path="/admin/subscription-plans" element={<AdminSubscriptionPlans />} />
          <Route path="/admin/subscription-analytics" element={<AdminSubscriptionAnalytics />} />
          
          {/* Fallback routes */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        
        <Toaster />
        <SonnerToaster position="top-right" />
      </AppThemeWrapper>
    </QueryClientProvider>
  );
}
