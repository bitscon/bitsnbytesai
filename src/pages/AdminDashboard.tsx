
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import SubscriptionAnalyticsHeader from '@/components/admin/analytics/SubscriptionAnalyticsHeader';
import SubscriptionMetricsCards from '@/components/admin/analytics/SubscriptionMetricsCards';
import SubscriptionCharts from '@/components/admin/analytics/SubscriptionCharts';
import SubscriptionTables from '@/components/admin/analytics/SubscriptionTables';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { addMonths, format, subMonths } from 'date-fns';

export default function AdminSubscriptionAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  
  // Function to fetch analytics data
  const fetchAnalyticsData = async () => {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.access_token) {
      throw new Error('No active session');
    }
    
    const { data, error } = await supabase.functions.invoke('get-subscription-analytics', {
      body: {
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString()
      }
    });
    
    if (error) {
      console.error('Error fetching analytics:', error);
      throw new Error(error.message);
    }
    
    return data;
  };
  
  // Use React Query to fetch and cache the analytics data
  const {
    data: analyticsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['subscriptionAnalytics', dateRange?.from, dateRange?.to],
    queryFn: fetchAnalyticsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };
  
  // Calculate summary metrics
  const totalSubscribers = analyticsData?.metrics?.total_subscribers || 0;
  const paidSubscribers = analyticsData?.metrics?.paid_subscribers || 0;
  const conversionRate = analyticsData?.metrics?.conversion_rate || '0';
  const paymentFailures = analyticsData?.metrics?.payment_failures || 0;
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <SubscriptionAnalyticsHeader 
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
        
        {isError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error loading analytics</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load subscription analytics'}
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2" 
                  onClick={() => refetch()}
                >
                  <RefreshCw className="h-4 w-4" /> Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Loading subscription analytics...</p>
            </div>
          </div>
        ) : (
          <>
            <SubscriptionMetricsCards 
              totalSubscribers={totalSubscribers}
              paidSubscribers={paidSubscribers}
              conversionRate={conversionRate}
              paymentFailures={paymentFailures}
            />
            
            <SubscriptionCharts 
              tierDistribution={analyticsData?.tierDistribution || []}
              newSubscriptions={analyticsData?.newSubscriptions || []}
              subscriptionChanges={analyticsData?.subscriptionChanges || []}
            />
            
            <SubscriptionTables 
              subscriptionChanges={analyticsData?.subscriptionChanges || []}
              paymentFailures={analyticsData?.paymentFailures || []}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
