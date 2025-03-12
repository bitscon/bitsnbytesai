
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Account from './pages/Account';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminPrompts from './pages/AdminPrompts';
import AdminThemeSettings from './pages/AdminThemeSettings';
import AdminApiSettings from './pages/AdminApiSettings';
import AdminSubscriptionPlans from './pages/AdminSubscriptionPlans';
import AdminSubscriptionAnalytics from './pages/AdminSubscriptionAnalytics';
import SubscriptionSignup from './pages/SubscriptionSignup';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import CheckoutSuccess from './pages/CheckoutSuccess';
import SavedPrompts from './pages/SavedPrompts';
import Subscription from './pages/Subscription';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/subscription-signup" element={<SubscriptionSignup />} />
      <Route path="/subscription-success" element={<SubscriptionSuccess />} />
      <Route path="/checkout-success" element={<CheckoutSuccess />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      <Route path="/saved-prompts" element={<ProtectedRoute><SavedPrompts /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/prompts" element={<AdminRoute><AdminPrompts /></AdminRoute>} />
      <Route path="/admin/theme-settings" element={<AdminRoute><AdminThemeSettings /></AdminRoute>} />
      <Route path="/admin/api-settings" element={<AdminRoute><AdminApiSettings /></AdminRoute>} />
      <Route path="/admin/subscription-plans" element={<AdminRoute><AdminSubscriptionPlans /></AdminRoute>} />
      <Route path="/admin/subscription-analytics" element={<AdminRoute><AdminSubscriptionAnalytics /></AdminRoute>} />
      
      {/* Fallback route */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
