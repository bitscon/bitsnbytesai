
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, EyeOff, Eye, AlertCircle, CheckCircle2, Settings, KeyRound, CreditCard, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiSetting {
  key_name: string;
  key_value: string;
  description: string | null;
  has_value: boolean;
}

interface GroupedSettings {
  [key: string]: ApiSetting[];
}

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

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PayPal':
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'Stripe':
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      default:
        return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format setting name for display
  const formatSettingName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Paypal/i, 'PayPal')
      .replace(/Api/i, 'API');
  };

  // Function to render a setting input based on its type
  const renderSettingField = (setting: ApiSetting) => {
    const isSecret = setting.key_name.includes('SECRET') || 
                     setting.key_name.includes('KEY') || 
                     setting.key_name.includes('PASSWORD');
    const isToggle = setting.key_value === 'true' || setting.key_value === 'false';
    
    if (isToggle) {
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={setting.key_value === 'true'}
            onCheckedChange={() => handleToggleChange(setting.key_name, setting.key_value)}
            disabled={isSaving[setting.key_name]}
          />
          <Label>{setting.key_value === 'true' ? 'Enabled' : 'Disabled'}</Label>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type={isSecret && !showSecrets[setting.key_name] ? 'password' : 'text'}
            value={editableValues[setting.key_name] || ''}
            onChange={(e) => handleInputChange(setting.key_name, e.target.value)}
            className={`pr-10 ${setting.has_value ? 'border-green-200 dark:border-green-800' : ''}`}
            placeholder={`Enter ${formatSettingName(setting.key_name)}`}
          />
          {setting.has_value && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          )}
        </div>
        {isSecret && (
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => toggleShowSecret(setting.key_name)}
            className="flex-shrink-0"
          >
            {showSecrets[setting.key_name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
        <Button
          variant={setting.has_value ? "secondary" : "default"}
          size="sm"
          onClick={() => handleSaveSetting(setting.key_name)}
          disabled={isSaving[setting.key_name]}
          className="flex-shrink-0 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {isSaving[setting.key_name] ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load API settings. Please try again or check your connection.
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSettings} 
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          ) : settings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No API settings found.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedSettings).map(([category, categorySettings]) => 
                categorySettings.length > 0 && (
                  <div key={category} className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      {getCategoryIcon(category)}
                      <h2 className="text-lg font-semibold">{category}</h2>
                    </div>
                    <div className="grid gap-y-8 gap-x-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                      {categorySettings.map((setting) => (
                        <div key={setting.key_name} className="space-y-3 bg-muted/30 p-4 rounded-md transition-all hover:bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-foreground/90">{formatSettingName(setting.key_name)}</h3>
                              {setting.description && (
                                <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                              )}
                            </div>
                          </div>
                          {renderSettingField(setting)}
                        </div>
                      ))}
                    </div>
                  </div>
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
