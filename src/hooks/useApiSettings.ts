
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ApiSetting, GroupedSettings } from '@/components/admin/api-settings/types';

export function useApiSettings() {
  const [settings, setSettings] = useState<ApiSetting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [editableValues, setEditableValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [hasError, setHasError] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();

    // Set up subscription for real-time updates
    const subscription = supabase
      .channel('api_settings_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'api_settings' 
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-api-settings', {
        method: 'GET',
      });

      if (error) {
        throw new Error(error.message);
      }

      const fetchedSettings = data.settings || [];
      setSettings(fetchedSettings);
      
      // Initialize editable values with current values
      const initialValues: Record<string, string> = {};
      fetchedSettings.forEach((setting: ApiSetting) => {
        initialValues[setting.key_name] = setting.key_value;
      });
      setEditableValues(initialValues);
    } catch (error) {
      console.error('Error fetching API settings:', error);
      setHasError(true);
      toast({
        title: 'Error',
        description: 'Failed to load API settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChange = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    
    setIsSaving(prev => ({ ...prev, [key]: true }));
    
    try {
      const { error } = await supabase.functions.invoke('admin-api-settings', {
        method: 'POST',
        body: { key_name: key, key_value: newValue },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: `Setting "${key}" updated successfully.`,
      });
      
      // Update local state immediately
      setSettings(settings.map(setting => 
        setting.key_name === key 
          ? { ...setting, key_value: newValue } 
          : setting
      ));
      setEditableValues(prev => ({...prev, [key]: newValue}));
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      toast({
        title: 'Error',
        description: `Failed to update setting. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setEditableValues(prev => ({...prev, [key]: value}));
  };

  const handleSaveSetting = async (key: string) => {
    const newValue = editableValues[key];
    
    setIsSaving(prev => ({ ...prev, [key]: true }));
    
    try {
      const { error } = await supabase.functions.invoke('admin-api-settings', {
        method: 'POST',
        body: { key_name: key, key_value: newValue },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: `Setting "${key}" updated successfully.`,
      });
      
      // Update local state immediately
      setSettings(settings.map(setting => 
        setting.key_name === key 
          ? { ...setting, key_value: newValue, has_value: !!newValue } 
          : setting
      ));
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      toast({
        title: 'Error',
        description: `Failed to update setting. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({...prev, [key]: !prev[key]}));
  };

  // Format setting name for display
  const formatSettingName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Paypal/i, 'PayPal')
      .replace(/Api/i, 'API');
  };

  // Group settings by category (based on naming convention)
  const groupSettings = (settings: ApiSetting[]): GroupedSettings => {
    const grouped: GroupedSettings = {
      'PayPal': [],
      'Stripe': [],
      'General': []
    };
    
    settings.forEach(setting => {
      if (setting.key_name.startsWith('PAYPAL_')) {
        grouped['PayPal'].push(setting);
      } else if (setting.key_name.startsWith('STRIPE_')) {
        grouped['Stripe'].push(setting);
      } else {
        grouped['General'].push(setting);
      }
    });
    
    return grouped;
  };

  return {
    settings,
    isLoading,
    isSaving,
    editableValues,
    showSecrets,
    hasError,
    groupedSettings: groupSettings(settings),
    fetchSettings,
    handleToggleChange,
    handleInputChange,
    handleSaveSetting,
    toggleShowSecret,
    formatSettingName
  };
}
