
export interface ApiSetting {
  key_name: string;
  key_value: string;
  description: string | null;
  has_value: boolean;
}

export interface GroupedSettings {
  [key: string]: ApiSetting[];
}
