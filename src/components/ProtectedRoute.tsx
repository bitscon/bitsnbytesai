
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying authentication...</p>
      </div>
    );
  }

  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to login");
    toast({
      title: "Authentication Required",
      description: "Please log in to access this page",
      variant: "default",
    });
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
