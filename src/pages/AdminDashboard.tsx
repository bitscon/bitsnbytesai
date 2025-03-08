
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, CreditCard, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ApiStatus {
  stripe: 'configured' | 'needs_setup';
  paypal: 'configured' | 'needs_setup';
  database: 'operational' | 'error';
  auth: 'operational' | 'error';
}

export default function AdminDashboard() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    stripe: 'needs_setup',
    paypal: 'needs_setup',
    database: 'operational',
    auth: 'operational'
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('admin-api-settings', {
          method: 'GET',
        });

        if (error) {
          throw new Error(error.message);
        }

        const settings = data.settings || [];
        const stripeKey = settings.find((s: any) => s.key_name === 'STRIPE_SECRET_KEY');
        const paypalClientId = settings.find((s: any) => s.key_name === 'PAYPAL_CLIENT_ID');
        const paypalClientSecret = settings.find((s: any) => s.key_name === 'PAYPAL_CLIENT_SECRET');

        setApiStatus({
          stripe: (stripeKey && stripeKey.has_value) ? 'configured' : 'needs_setup',
          paypal: (paypalClientId && paypalClientId.has_value && paypalClientSecret && paypalClientSecret.has_value) 
            ? 'configured' : 'needs_setup',
          database: 'operational',
          auth: 'operational'
        });
      } catch (error) {
        console.error("Error checking API status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiStatus();
  }, []);
  
  const getStatusBadge = (status: 'configured' | 'needs_setup' | 'operational' | 'error') => {
    switch (status) {
      case 'configured':
      case 'operational':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Operational</span>;
      case 'needs_setup':
        return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">Needs Setup</span>;
      case 'error':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Error</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your application</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$--</div>
            <p className="text-xs text-muted-foreground">
              Lifetime revenue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "--" : 
              apiStatus.paypal === 'configured' && apiStatus.stripe === 'configured' ? 
              "✓" : "!"}</div>
            <p className="text-xs text-muted-foreground">
              Active integrations
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>System Status</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/api-settings')}
            >
              Configure API Settings
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Stripe Integration</span>
                {getStatusBadge(apiStatus.stripe)}
              </div>
              <div className="flex justify-between items-center">
                <span>PayPal Integration</span>
                {getStatusBadge(apiStatus.paypal)}
              </div>
              <div className="flex justify-between items-center">
                <span>Database</span>
                {getStatusBadge(apiStatus.database)}
              </div>
              <div className="flex justify-between items-center">
                <span>Authentication</span>
                {getStatusBadge(apiStatus.auth)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
