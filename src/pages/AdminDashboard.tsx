
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, CreditCard, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import SubscriptionMetricsCards from "@/components/admin/analytics/SubscriptionMetricsCards";

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
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalSales: 0,
    recentPayments: 0,
    subscriptionMetrics: {
      totalSubscribers: 0,
      paidSubscribers: 0,
      conversionRate: "0",
      paymentFailures: 0
    }
  });
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        const { data: apiData, error: apiError } = await supabase.functions.invoke('admin-api-settings', {
          method: 'GET',
        });

        if (apiError) {
          console.error("Error fetching API settings:", apiError);
        } else {
          const settings = apiData.settings || [];
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
        }
        
        const { count: totalUsers, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (usersError) {
          console.error("Error fetching users count:", usersError);
        }
        
        const { data: subscriptionData, error: subError } = await supabase.functions.invoke('get-subscription-analytics', {
          method: 'POST',
          body: { period: 'month' }
        });
        
        if (subError) {
          console.error("Error fetching subscription analytics:", subError);
        }
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: recentPayments, error: paymentsError } = await supabase
          .from('user_purchases')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());
          
        if (paymentsError) {
          console.error("Error fetching recent payments:", paymentsError);
        }
        
        const { data: salesData, error: salesError } = await supabase
          .from('user_purchases')
          .select('amount');
          
        if (salesError) {
          console.error("Error fetching total sales:", salesError);
        }
        
        const totalSales = salesData ? salesData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) : 0;
        
        setDashboardData({
          totalUsers: totalUsers || 0,
          totalSales: totalSales || 0,
          recentPayments: recentPayments || 0,
          subscriptionMetrics: {
            totalSubscribers: subscriptionData?.metrics?.total_subscribers || 0,
            paidSubscribers: subscriptionData?.metrics?.paid_subscribers || 0,
            conversionRate: subscriptionData?.metrics?.conversion_rate || "0", // Ensure this is a string
            paymentFailures: subscriptionData?.metrics?.payment_failures || 0
          }
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
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
            <div className="text-2xl font-bold">
              {isLoading ? "..." : dashboardData.totalUsers.toString()}
            </div>
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
            <div className="text-2xl font-bold">
              {isLoading ? "..." : formatCurrency(dashboardData.totalSales)}
            </div>
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
            <div className="text-2xl font-bold">
              {isLoading ? "..." : dashboardData.recentPayments.toString()}
            </div>
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

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Subscription Analytics</h2>
        <SubscriptionMetricsCards 
          totalSubscribers={dashboardData.subscriptionMetrics.totalSubscribers}
          paidSubscribers={dashboardData.subscriptionMetrics.paidSubscribers}
          conversionRate={dashboardData.subscriptionMetrics.conversionRate}
          paymentFailures={dashboardData.subscriptionMetrics.paymentFailures}
        />
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
