
// Helper to extract feature metadata from a plan
export function extractFeatureMetadata(features: any): Record<string, string> {
  const metadata: Record<string, string> = {};
  
  if (!features) return metadata;
  
  // Parse features if it's a string
  const parsedFeatures = typeof features === 'string'
    ? JSON.parse(features)
    : features;
  
  if (parsedFeatures.description) {
    metadata.description = parsedFeatures.description;
  }
  
  // Add a count of features
  const featureCount = Object.keys(parsedFeatures).filter(key => key !== 'description').length;
  metadata.feature_count = featureCount.toString();
  
  // Add up to 5 top features as metadata
  Object.entries(parsedFeatures)
    .filter(([key]) => key !== 'description')
    .slice(0, 5)
    .forEach(([key, value], index) => {
      if (typeof value === 'object' && value !== null && 'description' in value) {
        metadata[`feature_${index + 1}`] = (value as any).description;
      } else if (typeof value === 'string') {
        metadata[`feature_${index + 1}`] = value;
      }
    });
  
  return metadata;
}
