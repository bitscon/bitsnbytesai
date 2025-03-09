
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/auth";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/context/theme/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AdminLayout from "@/components/AdminLayout";

// Lazy loaded components
const Index = lazy(() => import("@/pages/Index"));
const Login = lazy(() => import("@/pages/Login"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SavedPrompts = lazy(() => import("@/pages/SavedPrompts"));
const Account = lazy(() => import("@/pages/Account"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const SubscriptionSuccess = lazy(() => import("@/pages/SubscriptionSuccess"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminPrompts = lazy(() => import("@/pages/AdminPrompts"));
const AdminApiSettings = lazy(() => import("@/pages/AdminApiSettings"));
const AdminThemeSettings = lazy(() => import("@/pages/AdminThemeSettings"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/saved-prompts" element={<SavedPrompts />} />
              <Route path="/account" element={<Account />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            </Route>
            
            {/* Admin routes */}
            <Route element={<AdminRoute><Outlet /></AdminRoute>}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="prompts" element={<AdminPrompts />} />
                <Route path="api-settings" element={<AdminApiSettings />} />
                <Route path="theme-settings" element={<AdminThemeSettings />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
