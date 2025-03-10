
import React from 'react';
import { motion } from 'framer-motion';
import { PlanCard } from './PlanCard';
import { SubscriptionPlan, SubscriptionTier } from '@/types/subscription';

interface PlansListProps {
  plans: SubscriptionPlan[];
  billingInterval: 'month' | 'year';
  currentTier?: SubscriptionTier;
  isSubscribing: boolean;
  onSubscribe: (planId: string) => void;
  mode?: 'new' | 'change';
}

export function PlansList({
  plans,
  billingInterval,
  currentTier,
  isSubscribing,
  onSubscribe,
  mode = 'new'
}: PlansListProps) {
  const isPlanActive = (tier: string) => {
    return currentTier === tier;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          billingInterval={billingInterval}
          isActive={isPlanActive(plan.tier)}
          isSubscribing={isSubscribing}
          onSubscribe={onSubscribe}
          mode={mode}
        />
      ))}
    </motion.div>
  );
}
