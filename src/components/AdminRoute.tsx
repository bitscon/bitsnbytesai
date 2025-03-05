import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, checkAdminStatus } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!user) {
        console.log("No user found, redirecting to login");
        setIsAdmin(false);
        setIsChecking(false);
        return;
      }

      try {
        console.log("Checking admin status for user:", user.id);
        
        const isUserAdmin = await checkAdminStatus();
        console.log("Admin check result:", isUserAdmin);
        
        setIsAdmin(isUserAdmin);
        
        if (!isUserAdmin) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges to access this page.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Exception checking admin status:", err);
        setError((err as Error).message);
        setIsAdmin(false);
        
        toast({
          title: "Authentication Error",
          description: "Failed to verify admin status. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsChecking(false);
      }
    };

    if (!authLoading) {
      verifyAdminAccess();
    }
  }, [user, authLoading, checkAdminStatus, toast]);

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying admin access...</p>
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
