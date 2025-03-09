
import React from 'react';
import { motion } from 'framer-motion';

export function SubscriptionHeader() {
  return (
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
  );
}
