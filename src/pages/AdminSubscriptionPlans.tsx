
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, PlusCircle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SubscriptionPlan } from '@/types/subscription';
import SubscriptionPlansList from '@/components/admin/subscription/SubscriptionPlansList';
import SubscriptionPlanDialog from '@/components/admin/subscription/SubscriptionPlanDialog';
import { toast } from 'sonner';

export default function AdminSubscriptionPlans() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const queryClient = useQueryClient();
  
  // Query to fetch subscription plans
  const {
    data: plans,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });
      
      if (error) throw new Error(error.message);
      
      // Transform features if they're stored as string
      const transformedData = data?.map(plan => ({
        ...plan,
        features: typeof plan.features === 'string' 
          ? JSON.parse(plan.features) 
          : plan.features
      }));
      
      return transformedData as unknown as SubscriptionPlan[]; 
    }
  });
  
  // Mutation to delete a subscription plan
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      toast.success('Subscription plan deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete subscription plan: ' + (error as Error).message);
    }
  });
  
  // Function to sync plans with Stripe
  const syncWithStripe = async () => {
    try {
      toast.info('Syncing plans with Stripe...');
      const { error } = await supabase.functions.invoke('sync-subscription-plans-with-stripe');
      
      if (error) {
        console.error('Error syncing plans with Stripe:', error);
        toast.error('Failed to sync plans with Stripe');
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      toast.success('Plans synced with Stripe successfully');
    } catch (error) {
      console.error('Error in syncWithStripe:', error);
      toast.error('An error occurred while syncing plans');
    }
  };
  
  const openCreateDialog = () => {
    setSelectedPlan(null);
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedPlan(null);
  };
  
  const handlePlanCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    closeDialog();
    toast.success('Subscription plan saved successfully');
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={syncWithStripe}>
              Sync with Stripe
            </Button>
            <Button onClick={openCreateDialog}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error loading subscription plans</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
        ) : (
          <SubscriptionPlansList 
            plans={plans || []}
            onEdit={openEditDialog}
            onDelete={(plan) => {
              if (plan.tier === 'free') {
                toast.error("Cannot delete the Free plan");
                return;
              }
              deletePlanMutation.mutate(plan.id);
            }}
            isDeleting={deletePlanMutation.isPending}
          />
        )}
      </div>
      
      <SubscriptionPlanDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        plan={selectedPlan}
        onClose={closeDialog}
        onSuccess={handlePlanCreated}
      />
    </AdminLayout>
  );
}
