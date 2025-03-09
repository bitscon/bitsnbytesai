
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SubscriptionChange {
  event_type: string;
  created_at: string;
  old_tier: string;
  new_tier: string;
}

interface PaymentFailure {
  created_at: string;
  reason: string;
  resolved: boolean;
  user_id: string;
  amount: number;
  currency: string;
}

interface SubscriptionTablesProps {
  subscriptionChanges: SubscriptionChange[];
  paymentFailures: PaymentFailure[];
}

export default function SubscriptionTables({
  subscriptionChanges,
  paymentFailures
}: SubscriptionTablesProps) {
  // Helper to format event types for display
  const formatEventType = (type: string) => {
    switch (type) {
      case 'upgrade':
        return <Badge className="bg-green-500">Upgrade</Badge>;
      case 'downgrade':
        return <Badge className="bg-yellow-500">Downgrade</Badge>;
      case 'cancel':
        return <Badge className="bg-red-500">Cancel</Badge>;
      case 'cancel_scheduled':
        return <Badge className="bg-orange-500">Cancel Scheduled</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };
  
  // Helper to format tier name for display
  const formatTierName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };
  
  // Format amount with currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase() || 'USD'
    }).format(amount);
  };
  
  return (
    <Tabs defaultValue="changes" className="space-y-4">
      <TabsList>
        <TabsTrigger value="changes">Recent Changes</TabsTrigger>
        <TabsTrigger value="failures">Payment Failures</TabsTrigger>
      </TabsList>
      
      <TabsContent value="changes">
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscription Changes</CardTitle>
            <CardDescription>
              Latest subscription tier changes and cancellations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionChanges.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No subscription changes recorded during this period
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Change Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionChanges.map((change, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(parseISO(change.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{formatEventType(change.event_type)}</TableCell>
                      <TableCell>{formatTierName(change.old_tier)}</TableCell>
                      <TableCell>{formatTierName(change.new_tier)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="failures">
        <Card>
          <CardHeader>
            <CardTitle>Payment Failures</CardTitle>
            <CardDescription>
              Recent payment failures and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentFailures.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No payment failures recorded during this period
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentFailures.map((failure, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(parseISO(failure.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {formatAmount(failure.amount, failure.currency)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {failure.reason}
                      </TableCell>
                      <TableCell>
                        {failure.resolved ? (
                          <Badge className="bg-green-500">Resolved</Badge>
                        ) : (
                          <Badge variant="destructive">Unresolved</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
