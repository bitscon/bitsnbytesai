
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { ApiSetting, GroupedSettings } from './api-settings/types';
import { SettingsError } from './api-settings/SettingsError';
import { SettingsLoading } from './api-settings/SettingsLoading';
import { SettingsEmpty } from './api-settings/SettingsEmpty';
import { SettingCategory } from './api-settings/SettingCategory';

export function ApiSettingsPanel() {
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

  const groupedSettings = groupSettings(settings);

  return (
    <div className="space-y-6">
      {hasError && <SettingsError onRetry={fetchSettings} />}

      <Card className="border-border/40 shadow-md">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle>API Settings</CardTitle>
          </div>
          <CardDescription>
            Configure global settings for your application
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <SettingsLoading />
          ) : settings.length === 0 ? (
            <SettingsEmpty />
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedSettings).map(([category, categorySettings]) => 
                categorySettings.length > 0 && (
                  <SettingCategory
                    key={category}
                    category={category}
                    settings={categorySettings}
                    editableValues={editableValues}
                    isSaving={isSaving}
                    showSecrets={showSecrets}
                    handleInputChange={handleInputChange}
                    handleSaveSetting={handleSaveSetting}
                    handleToggleChange={handleToggleChange}
                    toggleShowSecret={toggleShowSecret}
                    formatSettingName={formatSettingName}
                  />
                )
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4 bg-muted/30">
          <div className="w-full flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              These settings control global functionality across your application.
              Changes take effect immediately.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSettings}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <span>Refresh</span>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
