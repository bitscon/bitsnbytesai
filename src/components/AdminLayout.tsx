
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { 
  AlertCircle, 
  Loader2,
  Settings,
  LayoutDashboard,
  KeyRound,
  MessageSquare,
  Users
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        if (!authLoading) {
          navigate("/login");
        }
        return;
      }

      try {
        // Direct database query to check admin status
        const { data, error } = await supabase
          .from("admin_users")
          .select("id")
          .eq("id", user.id)
          .single();
        
        console.log("AdminLayout: Admin check result:", !!data, "Data:", data, "Error:", error);
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "row not found" error
          console.error("Error checking admin status:", error);
          setError("An error occurred while checking permissions.");
          setIsAdmin(false);
        } else {
          if (data) {
            setIsAdmin(true);
          } else {
            setError("You don't have permission to view this page.");
            setIsAdmin(false);
          }
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
        setError("An error occurred while checking permissions.");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>{error || "You don't have permission to view this page."}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Admin Sidebar */}
      <div className="w-64 bg-muted border-r border-border h-screen fixed">
        <div className="p-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin Portal
          </h2>
        </div>
        <nav className="px-2 py-4">
          <ul className="space-y-1">
            <li>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/dashboard")}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </li>
            <li>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/settings")}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                API Settings
              </Button>
            </li>
            <li>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/prompts")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Prompts
              </Button>
            </li>
            <li>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/users")}
              >
                <Users className="mr-2 h-4 w-4" />
                Users
              </Button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
