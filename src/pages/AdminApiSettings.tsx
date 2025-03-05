
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiSetting {
  key_name: string;
  key_value: string;
  has_value: boolean;
  description?: string;
}

export default function AdminApiSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ApiSetting[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [updatedSettings, setUpdatedSettings] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        if (!authLoading) {
          navigate("/login");
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking admin status:", error);
          setError("You don't have permission to view this page.");
          setIsAdmin(false);
        } else if (data) {
          setIsAdmin(true);
          fetchSettings();
        } else {
          setError("You don't have permission to view this page.");
          setIsAdmin(false);
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

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke("admin-api-settings", {
        method: "GET",
      });

      if (error) {
        throw new Error(error.message);
      }

      setSettings(data?.settings || []);
    } catch (error) {
      console.error("Error fetching API settings:", error);
      setError("Failed to load API settings. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load API settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setUpdatedSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      setIsUpdating(true);
      setSaveSuccess(false);
      setError("");

      // Save each updated setting
      for (const [key, value] of Object.entries(updatedSettings)) {
        const { error } = await supabase.functions.invoke("admin-api-settings", {
          method: "POST",
          body: { key_name: key, key_value: value },
        });

        if (error) {
          throw new Error(`Failed to update ${key}: ${error.message}`);
        }
      }

      // Clear the updated settings
      setUpdatedSettings({});
      
      // Show success message
      setSaveSuccess(true);
      toast({
        title: "Settings saved",
        description: "API settings have been successfully updated.",
      });
      
      // Refresh settings
      fetchSettings();
    } catch (error) {
      console.error("Error saving API settings:", error);
      setError(`Failed to save settings: ${(error as Error).message}`);
      toast({
        title: "Error",
        description: "Failed to save API settings.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">API Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage payment processor API keys and settings
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saveSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>API settings have been successfully updated.</AlertDescription>
          </Alert>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldAlert className="mr-2 h-5 w-5 text-amber-500" />
              Security Notice
            </CardTitle>
            <CardDescription>
              These API keys provide access to payment processing services. Keep them secure and never share them publicly.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Settings</CardTitle>
              <CardDescription>
                Configure your Stripe payment processor API keys and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="STRIPE_SECRET_KEY">Stripe Secret Key</Label>
                <Input
                  id="STRIPE_SECRET_KEY"
                  type="password"
                  placeholder={settings.find(s => s.key_name === "STRIPE_SECRET_KEY")?.has_value ? "••••••••" : "sk_test_..."}
                  value={updatedSettings["STRIPE_SECRET_KEY"] || ""}
                  onChange={(e) => handleInputChange("STRIPE_SECRET_KEY", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your Stripe Dashboard under Developers &gt; API keys
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="STRIPE_PRICE_ID">Stripe Price ID</Label>
                <Input
                  id="STRIPE_PRICE_ID"
                  placeholder="price_..."
                  value={updatedSettings["STRIPE_PRICE_ID"] || ""}
                  onChange={(e) => handleInputChange("STRIPE_PRICE_ID", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your Stripe Dashboard under Products
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PayPal Settings</CardTitle>
              <CardDescription>
                Configure your PayPal payment processor API keys and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="PAYPAL_CLIENT_ID">PayPal Client ID</Label>
                <Input
                  id="PAYPAL_CLIENT_ID"
                  placeholder={settings.find(s => s.key_name === "PAYPAL_CLIENT_ID")?.has_value ? "••••••••" : "Client ID"}
                  value={updatedSettings["PAYPAL_CLIENT_ID"] || ""}
                  onChange={(e) => handleInputChange("PAYPAL_CLIENT_ID", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="PAYPAL_CLIENT_SECRET">PayPal Client Secret</Label>
                <Input
                  id="PAYPAL_CLIENT_SECRET"
                  type="password"
                  placeholder={settings.find(s => s.key_name === "PAYPAL_CLIENT_SECRET")?.has_value ? "••••••••" : "Client Secret"}
                  value={updatedSettings["PAYPAL_CLIENT_SECRET"] || ""}
                  onChange={(e) => handleInputChange("PAYPAL_CLIENT_SECRET", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="PAYPAL_BASE_URL">PayPal API Base URL</Label>
                <Input
                  id="PAYPAL_BASE_URL"
                  placeholder="https://api-m.sandbox.paypal.com"
                  value={updatedSettings["PAYPAL_BASE_URL"] || ""}
                  onChange={(e) => handleInputChange("PAYPAL_BASE_URL", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use https://api-m.sandbox.paypal.com for testing, https://api-m.paypal.com for production
                </p>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={saveSettings} 
            disabled={isUpdating || Object.keys(updatedSettings).length === 0}
            className="w-full md:w-auto md:self-end"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
