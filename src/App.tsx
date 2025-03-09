import React, { useState, useEffect } from 'react';
import {
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './context/auth';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from './integrations/supabase/client';

// Import pages
import Index from './pages/Index';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Subscription from './pages/Subscription';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import Account from './pages/Account';
import SavedPrompts from './pages/SavedPrompts';
import CheckoutSuccess from './pages/CheckoutSuccess';
import AdminLayout from './components/AdminLayout';
import NotFound from './pages/NotFound';
import AdminRoute from './components/AdminRoute';

const queryClient = new QueryClient();

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isLoggedIn ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

// Admin route component
function AdminRouteComponent({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('is-admin');

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false); // Default to false in case of error
        } else {
          setIsAdmin(data.isAdmin);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isAdmin ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <div className="App">
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-prompts"
            element={
              <ProtectedRoute>
                <SavedPrompts />
              </ProtectedRoute>
            }
          />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </QueryClientProvider>
    </div>
  );
}

export default App;
