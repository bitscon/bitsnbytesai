
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

interface TierDistribution {
  tier: string;
  count: number;
}

interface NewSubscription {
  created_at: string;
  tier: string;
}

interface SubscriptionChange {
  event_type: string;
  created_at: string;
  old_tier: string;
  new_tier: string;
}

interface SubscriptionChartsProps {
  tierDistribution: TierDistribution[];
  newSubscriptions: NewSubscription[];
  subscriptionChanges: SubscriptionChange[];
}

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const TIER_COLORS = {
  free: '#CBD5E1', // slate-300
  pro: '#60A5FA', // blue-400
  premium: '#818CF8', // indigo-400
  enterprise: '#A78BFA', // violet-400
};

export default function SubscriptionCharts({
  tierDistribution,
  newSubscriptions,
  subscriptionChanges
}: SubscriptionChartsProps) {
  // Prepare data for tier distribution pie chart
  const tierDistributionData = tierDistribution.map(item => ({
    name: item.tier.charAt(0).toUpperCase() + item.tier.slice(1),
    value: Number(item.count)
  }));
  
  // Prepare data for new subscriptions bar chart
  const processNewSubscriptions = () => {
    const groupedByDay: Record<string, Record<string, number>> = {};
    
    newSubscriptions.forEach(sub => {
      const day = format(parseISO(sub.created_at), 'yyyy-MM-dd');
      if (!groupedByDay[day]) {
        groupedByDay[day] = { free: 0, pro: 0, premium: 0, enterprise: 0 };
      }
      groupedByDay[day][sub.tier] = (groupedByDay[day][sub.tier] || 0) + 1;
    });
    
    return Object.entries(groupedByDay).map(([date, tiers]) => ({
      date: format(parseISO(date), 'MMM dd'),
      ...tiers
    }));
  };
  
  // Prepare data for subscription changes
  const processSubscriptionChanges = () => {
    const eventCounts = {
      upgrade: 0,
      downgrade: 0,
      cancel: 0,
      cancel_scheduled: 0
    };
    
    subscriptionChanges.forEach(change => {
      if (eventCounts[change.event_type] !== undefined) {
        eventCounts[change.event_type]++;
      }
    });
    
    return [
      { name: 'Upgrades', value: eventCounts.upgrade },
      { name: 'Downgrades', value: eventCounts.downgrade },
      { name: 'Cancellations', value: eventCounts.cancel },
      { name: 'Scheduled Cancellations', value: eventCounts.cancel_scheduled }
    ];
  };
  
  const newSubscriptionsData = processNewSubscriptions();
  const subscriptionChangesData = processSubscriptionChanges();
  
  return (
    <Tabs defaultValue="distribution" className="space-y-4">
      <TabsList>
        <TabsTrigger value="distribution">Tier Distribution</TabsTrigger>
        <TabsTrigger value="new">New Subscriptions</TabsTrigger>
        <TabsTrigger value="changes">Subscription Changes</TabsTrigger>
      </TabsList>
      
      <TabsContent value="distribution" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Tier Distribution</CardTitle>
            <CardDescription>
              Breakdown of subscribers by tier
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-80 w-full max-w-md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {tierDistributionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={TIER_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} subscribers`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="new" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>New Subscriptions</CardTitle>
            <CardDescription>
              Subscriptions created during the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={newSubscriptionsData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="free" name="Free" fill={TIER_COLORS.free} />
                  <Bar dataKey="pro" name="Pro" fill={TIER_COLORS.pro} />
                  <Bar dataKey="premium" name="Premium" fill={TIER_COLORS.premium} />
                  <Bar dataKey="enterprise" name="Enterprise" fill={TIER_COLORS.enterprise} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="changes" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Changes</CardTitle>
            <CardDescription>
              Upgrades, downgrades, and cancellations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-80 w-full max-w-md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionChangesData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill="#4ade80" /> {/* Upgrades - green */}
                    <Cell fill="#facc15" /> {/* Downgrades - yellow */}
                    <Cell fill="#f87171" /> {/* Cancellations - red */}
                    <Cell fill="#fb923c" /> {/* Scheduled Cancellations - orange */}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
