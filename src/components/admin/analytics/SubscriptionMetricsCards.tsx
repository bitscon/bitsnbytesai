
import React from 'react';
import { Users, CreditCard, PercentIcon, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionMetricsCardsProps {
  totalSubscribers: number;
  paidSubscribers: number;
  conversionRate: string;
  paymentFailures: number;
}

export default function SubscriptionMetricsCards({
  totalSubscribers,
  paidSubscribers,
  conversionRate,
  paymentFailures
}: SubscriptionMetricsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSubscribers}</div>
          <p className="text-xs text-muted-foreground">
            All users with subscription records
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid Subscribers</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paidSubscribers}</div>
          <p className="text-xs text-muted-foreground">
            Users on paid subscription tiers
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <PercentIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Percentage of users on paid plans
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Failures</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paymentFailures}</div>
          <p className="text-xs text-muted-foreground">
            Failed payment attempts in period
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
