
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserNavbar } from '@/components/UserNavbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/context/auth';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function Subscription() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  
  const {
    isLoading,
    subscription,
    plans,
    stripeSubscription,
    cancelAtPeriodEnd,
    currentUsage,
    isSubscribing,
    isManagingSubscription,
    subscribe,
    manageSubscription,
    getTierName,
    formatDate
  } = useSubscription();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar hasPurchased={false} />
        <div className="container mx-auto px-4 pt-24 pb-16 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubscribe = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    const priceId = billingInterval === 'month' 
      ? plan.stripe_price_id_monthly 
      : plan.stripe_price_id_yearly;
    
    if (!priceId) {
      return;
    }
    
    await subscribe(priceId, billingInterval);
  };

  const getCurrentPlanMessage = () => {
    if (!subscription) return null;
    
    if (subscription.tier === 'free') {
      return (
        <div className="flex items-center space-x-2 text-muted-foreground">
          <span>You are currently on the Free plan</span>
        </div>
      );
    }
    
    let message = `Your ${getTierName(subscription.tier)} plan `;
    
    if (cancelAtPeriodEnd && stripeSubscription?.current_period_end) {
      const endDate = new Date(stripeSubscription.current_period_end);
      message += `will end on ${endDate.toLocaleDateString()}`;
      return (
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      );
    }
    
    if (stripeSubscription?.current_period_end) {
      const endDate = new Date(stripeSubscription.current_period_end);
      const timeUntil = formatDistance(endDate, new Date(), { addSuffix: true });
      const interval = stripeSubscription.plan.interval === 'month' ? 'monthly' : 'yearly';
      message += `renews ${timeUntil} (${interval})`;
    }
    
    return (
      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
    );
  };

  const renderSubscriptionDetails = () => {
    if (!subscription) return null;
    
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Subscription</CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Plan</h3>
              <p className="text-lg font-semibold">{getTierName(subscription.tier)}</p>
              {getCurrentPlanMessage()}
            </div>
            
            {subscription.tier === 'free' && currentUsage && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Usage This Month</h3>
                <p className="text-lg font-semibold">{currentUsage.count} / {currentUsage.limit} prompts</p>
                <div className="w-full bg-secondary/20 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (currentUsage.count / currentUsage.limit) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentUsage.remaining} prompts remaining this month
                </p>
              </div>
            )}
            
            {stripeSubscription && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Billing Period</h3>
                  <p>
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Method</h3>
                  <Button 
                    variant="outline" 
                    onClick={() => manageSubscription('portal')}
                    disabled={isManagingSubscription}
                    className="mt-1"
                  >
                    {isManagingSubscription ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Manage Payment Method
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
        {subscription.tier !== 'free' && (
          <CardFooter className="flex justify-between">
            <div></div>
            {cancelAtPeriodEnd ? (
              <Button
                variant="outline"
                onClick={() => manageSubscription('reactivate')}
                disabled={isManagingSubscription}
              >
                {isManagingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resume Subscription
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => manageSubscription('cancel')}
                disabled={isManagingSubscription}
              >
                {isManagingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Subscription
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    );
  };

  const isPlanActive = (tier: string) => {
    return subscription?.tier === tier;
  };

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar hasPurchased={subscription?.tier !== 'free'} />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-3xl font-bold mb-4">Subscription Management</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upgrade your plan to unlock more features and get the most out of our AI prompt library.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center my-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {renderSubscriptionDetails()}
              
              <div className="mb-6 flex justify-center">
                <Tabs 
                  defaultValue="month" 
                  onValueChange={(value) => setBillingInterval(value as 'month' | 'year')}
                  className="w-full max-w-md"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="month">Monthly</TabsTrigger>
                    <TabsTrigger value="year">
                      Yearly
                      <Badge variant="outline" className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Save 20%
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`flex flex-col h-full ${isPlanActive(plan.tier) ? 'border-primary' : ''}`}
                  >
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        {plan.name}
                        {isPlanActive(plan.tier) && (
                          <Badge variant="secondary">Current Plan</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {plan.features.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">
                          ${billingInterval === 'month' ? plan.price_monthly.toFixed(2) : (plan.price_yearly / 12).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1.5">
                          /month
                        </span>
                      </div>
                      
                      {billingInterval === 'year' && plan.price_yearly > 0 && (
                        <p className="text-sm text-muted-foreground">
                          ${plan.price_yearly.toFixed(2)} billed yearly
                        </p>
                      )}
                      
                      <ul className="space-y-2">
                        {Object.entries(plan.features)
                          .filter(([key]) => key !== 'description')
                          .map(([key, value]) => {
                            if (typeof value !== 'boolean' && typeof value !== 'number') return null;
                            
                            const featureName = key
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, l => l.toUpperCase());
                            
                            return (
                              <li key={key} className="flex items-center">
                                {value ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
                                )}
                                <span className={value ? '' : 'text-muted-foreground'}>
                                  {typeof value === 'number' ? `${value} ${featureName}` : featureName}
                                </span>
                              </li>
                            );
                          })}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {plan.tier === 'enterprise' ? (
                        <Button 
                          className="w-full"
                          variant="outline"
                          onClick={() => window.open('mailto:sales@example.com')}
                        >
                          Contact Sales
                        </Button>
                      ) : isPlanActive(plan.tier) ? (
                        <Button className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={
                            isSubscribing || 
                            (plan.tier === 'free') || 
                            (billingInterval === 'month' && !plan.stripe_price_id_monthly) ||
                            (billingInterval === 'year' && !plan.stripe_price_id_yearly)
                          }
                        >
                          {isSubscribing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {plan.tier === 'free' ? 'Free Plan' : `Upgrade to ${plan.name}`}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
