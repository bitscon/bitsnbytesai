
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface ThemeModeSwitcherProps {
  currentMode: 'light' | 'dark';
  onModeChange: (value: string) => void;
  onCreatePresetClick: () => void;
  children: React.ReactNode;
}

export function ThemeModeSwitcher({
  currentMode,
  onModeChange,
  onCreatePresetClick,
  children
}: ThemeModeSwitcherProps) {
  return (
    <Tabs 
      value={currentMode} 
      onValueChange={onModeChange}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="light">Light Mode</TabsTrigger>
        <TabsTrigger value="dark">Dark Mode</TabsTrigger>
      </TabsList>
      
      <TabsContent value="light" className="space-y-4 pt-4">
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              onClick={onCreatePresetClick}
              size="sm"
            >
              Create New Preset
            </Button>
          </div>
          {children}
        </div>
      </TabsContent>
      
      <TabsContent value="dark" className="space-y-4 pt-4">
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              onClick={onCreatePresetClick}
              size="sm"
            >
              Create New Preset
            </Button>
          </div>
          {children}
        </div>
      </TabsContent>
    </Tabs>
  );
}
