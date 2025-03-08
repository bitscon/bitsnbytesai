
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ThemePreviewProps {
  previewStyle: React.CSSProperties;
}

export function ThemePreview({ previewStyle }: ThemePreviewProps) {
  return (
    <div className="rounded-lg border p-4 mt-4">
      <h3 className="text-lg font-medium mb-2">Theme Preview</h3>
      <div style={previewStyle}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h4 className="font-semibold">Card Example</h4>
            <p className="text-sm text-muted-foreground mt-2">This is how cards will appear with the current settings.</p>
          </Card>
          
          <div className="space-y-2">
            <Button>Primary Button</Button>
            <Button variant="outline" className="ml-2">Outline Button</Button>
          </div>
          
          <div className="space-y-2">
            <Label>Text Input</Label>
            <div className="flex items-center space-x-2">
              <Switch id="preview-switch" />
              <Label htmlFor="preview-switch">Toggle Example</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
