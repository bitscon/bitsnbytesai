
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        console.log("No user found, redirecting to login");
        setIsAdmin(false);
        setIsChecking(false);
        return;
      }

      try {
        console.log("Checking admin status for user:", user.id);
        const { data, error } = await supabase
          .from("admin_users")
          .select("id")
          .eq("id", user.id)
          .single();
          
        if (error) {
          console.error("Error checking admin status:", error);
          setError(error.message);
          setIsAdmin(false);
        } else {
          console.log("Admin check result:", !!data);
          setIsAdmin(!!data);
        }
      } catch (err) {
        console.error("Exception checking admin status:", err);
        setError((err as Error).message);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    console.log("AdminRoute: No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (isAdmin === false) {
    console.log("AdminRoute: Not an admin, redirecting to home");
    return <Navigate to="/" replace />;
  }

  console.log("AdminRoute: Confirmed admin access");
  return <>{children}</>;
}
