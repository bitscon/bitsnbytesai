
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import "@/App.css";

// Page imports
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import SavedPrompts from "@/pages/SavedPrompts";
import Account from "@/pages/Account";
import Subscription from "@/pages/Subscription";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import NotFound from "@/pages/NotFound";

// Admin pages
import AdminDashboard from "@/pages/AdminDashboard";
import AdminPrompts from "@/pages/AdminPrompts";
import AdminUsers from "@/pages/AdminUsers";
import AdminApiSettings from "@/pages/AdminApiSettings";
import AdminThemeSettings from "@/pages/AdminThemeSettings";

// Layout and routes
import AdminLayout from "@/components/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";

// Context providers
import { AuthProvider } from "@/context/auth";
import { ThemeProvider } from "@/context/theme/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedPrompts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription/success"
            element={
              <ProtectedRoute>
                <SubscriptionSuccess />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="prompts" element={<AdminPrompts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="api-settings" element={<AdminApiSettings />} />
            <Route path="theme-settings" element={<AdminThemeSettings />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        <Toaster />
        <Sonner />
      </AuthProvider>
    </ThemeProvider>
  );
}
