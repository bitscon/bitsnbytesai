
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkAdminStatus } from "@/context/auth/utils/adminUtils";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
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
        
        const isUserAdmin = await checkAdminStatus(user);
        console.log("Admin status check result:", isUserAdmin);
        
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
  }, [user, authLoading, toast]);

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
