// アプリの設定管理

export interface AppSettings {
  defaultLocationType: 'current' | 'scheduled';
}

const SETTINGS_KEY = 'friend-location-tracker-settings';

const defaultSettings: AppSettings = {
  defaultLocationType: 'scheduled'
};

export const getSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
  }
  return defaultSettings;
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
};

export const updateSetting = <K extends keyof AppSettings>(
  key: K, 
  value: AppSettings[K]
): AppSettings => {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, [key]: value };
  saveSettings(newSettings);
  return newSettings;
};