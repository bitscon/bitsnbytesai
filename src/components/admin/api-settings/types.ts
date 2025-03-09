
export interface ApiSetting {
  key_name: string;
  key_value: string;
  description: string | null;
  has_value: boolean;
  expires_at?: string | null;
  last_renewed_at?: string | null;
  is_secret?: boolean;
  provider?: string;
  environment?: string;
}

export interface GroupedSettings {
  [key: string]: ApiSetting[];
}

export interface ApiKeyMetadata {
  expires_at?: string | null;
  last_renewed_at?: string | null;
  environment?: string;
}

// Define allowed alert variants to include "warning"
export type AlertVariant = "default" | "destructive" | "warning";
