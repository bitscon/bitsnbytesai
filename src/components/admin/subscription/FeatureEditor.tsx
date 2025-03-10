
import React, { useState, useEffect } from 'react';
import { PlusCircle, X, Minus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Feature {
  description: string;
  [key: string]: any;
}

interface FeatureEditorProps {
  features: Record<string, Feature | boolean | number | string>;
  onChange: (features: Record<string, Feature | boolean | number | string>) => void;
}

export default function FeatureEditor({ features, onChange }: FeatureEditorProps) {
  const [newFeature, setNewFeature] = useState('');
  const [editableFeatures, setEditableFeatures] = useState<Record<string, Feature | boolean | number | string>>({});

  useEffect(() => {
    // Ensure features has a description property if it's from the database
    const processedFeatures: Record<string, Feature | boolean | number | string> = {};
    
    // If features is empty or just has a 'description' property, initialize with defaults
    if (!features || Object.keys(features).length === 0 || 
        (Object.keys(features).length === 1 && 'description' in features)) {
      processedFeatures.description = typeof features.description === 'string' 
        ? features.description 
        : 'An amazing subscription plan';
      
      // Add default boolean features
      processedFeatures.feature1 = { description: 'Core Feature 1', value: true };
      processedFeatures.feature2 = { description: 'Core Feature 2', value: true };
    } else {
      // Copy existing features
      Object.entries(features).forEach(([key, value]) => {
        if (key === 'description') {
          processedFeatures.description = value;
        } else if (typeof value === 'object' && value !== null) {
          processedFeatures[key] = value;
        } else {
          // Convert primitive values to feature objects
          processedFeatures[key] = { 
            description: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: value
          };
        }
      });
    }
    
    setEditableFeatures(processedFeatures);
  }, [features]);

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    
    const featureKey = newFeature
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '_');
    
    if (featureKey in editableFeatures) {
      return; // Feature already exists
    }
    
    const updatedFeatures = {
      ...editableFeatures,
      [featureKey]: { description: newFeature, value: true }
    };
    
    setEditableFeatures(updatedFeatures);
    onChange(updatedFeatures);
    setNewFeature('');
  };

  const handleRemoveFeature = (key: string) => {
    if (key === 'description') return; // Don't remove the plan description
    
    const { [key]: removed, ...rest } = editableFeatures;
    setEditableFeatures(rest);
    onChange(rest);
  };

  const handleToggleFeature = (key: string) => {
    if (key === 'description') return;
    
    const feature = editableFeatures[key];
    
    if (typeof feature === 'object' && feature !== null) {
      const updatedFeature = {
        ...feature,
        value: !feature.value
      };
      
      const updatedFeatures = {
        ...editableFeatures,
        [key]: updatedFeature
      };
      
      setEditableFeatures(updatedFeatures);
      onChange(updatedFeatures);
    }
  };

  const handleUpdateDescription = (key: string, description: string) => {
    if (key === 'description') {
      // Update plan description
      const updatedFeatures = {
        ...editableFeatures,
        description: description
      };
      
      setEditableFeatures(updatedFeatures);
      onChange(updatedFeatures);
      return;
    }
    
    const feature = editableFeatures[key];
    
    if (typeof feature === 'object' && feature !== null) {
      const updatedFeature = {
        ...feature,
        description: description
      };
      
      const updatedFeatures = {
        ...editableFeatures,
        [key]: updatedFeature
      };
      
      setEditableFeatures(updatedFeatures);
      onChange(updatedFeatures);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Plan Description</Label>
        <Input
          value={editableFeatures.description?.toString() || ''}
          onChange={(e) => handleUpdateDescription('description', e.target.value)}
          placeholder="Describe this subscription plan"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Features</Label>
        
        <div className="space-y-2">
          {Object.entries(editableFeatures)
            .filter(([key]) => key !== 'description')
            .map(([key, feature]) => {
              const isObject = typeof feature === 'object' && feature !== null;
              const featureDescription = isObject ? feature.description : key;
              const featureValue = isObject ? feature.value : feature;
              
              return (
                <div key={key} className="flex items-center space-x-2 p-2 border rounded-md">
                  <div className="flex-grow">
                    <Input 
                      value={featureDescription || ''} 
                      onChange={(e) => handleUpdateDescription(key, e.target.value)}
                      placeholder="Feature description"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!featureValue}
                      onCheckedChange={() => handleToggleFeature(key)}
                    />
                    <Badge variant={featureValue ? "default" : "outline"}>
                      {featureValue ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFeature(key)}
                      title="Remove feature"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="New feature"
            onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
          />
          <Button onClick={handleAddFeature} className="shrink-0">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
