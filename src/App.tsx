
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import SavedPrompts from "./pages/SavedPrompts";
import NotFound from "./pages/NotFound";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPrompts from "./pages/AdminPrompts";
import AdminApiSettings from "./pages/AdminApiSettings";
import AdminThemeSettings from "./pages/AdminThemeSettings";
import AdminUsers from "./pages/AdminUsers";
import AdminSubscriptionAnalytics from "./pages/AdminSubscriptionAnalytics";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/theme/ThemeContext";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={<ProtectedRoute component={Dashboard} />}
              />
              <Route
                path="/account"
                element={<ProtectedRoute component={Account} />}
              />
              <Route
                path="/saved-prompts"
                element={<ProtectedRoute component={SavedPrompts} />}
              />
              <Route
                path="/subscription"
                element={<ProtectedRoute component={Subscription} />}
              />
              <Route
                path="/subscription/success"
                element={<ProtectedRoute component={SubscriptionSuccess} />}
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={<AdminRoute><AdminDashboard /></AdminRoute>}
              />
              <Route
                path="/admin/prompts"
                element={<AdminRoute><AdminPrompts /></AdminRoute>}
              />
              <Route
                path="/admin/settings"
                element={<AdminRoute><AdminApiSettings /></AdminRoute>}
              />
              <Route
                path="/admin/theme"
                element={<AdminRoute><AdminThemeSettings /></AdminRoute>}
              />
              <Route
                path="/admin/users"
                element={<AdminRoute><AdminUsers /></AdminRoute>}
              />
              <Route
                path="/admin/subscription-analytics"
                element={<AdminRoute><AdminSubscriptionAnalytics /></AdminRoute>}
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
