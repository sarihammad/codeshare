'use client';

import React, { useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

interface SettingsState {
  theme: 'light' | 'dark';
  autoSync: boolean;
  cursorSharing: boolean;
  chatEnabled: boolean;
}

const defaultSettings: SettingsState = {
  theme: 'dark',
  autoSync: true,
  cursorSharing: true,
  chatEnabled: true,
};

const SETTINGS_KEY = 'codeshare_settings';

const loadSettings = (): SettingsState => {
  if (typeof window === 'undefined') return defaultSettings;
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
};

const saveSettings = (settings: SettingsState) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] =
    React.useState<SettingsState>(defaultSettings);
  const [saving, setSaving] = React.useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleChange = (key: keyof SettingsState, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    saveSettings(settings);
    setTimeout(() => setSaving(false), 500); // Simulate save
  };

  return (
    <ProtectedRoute>
      <div className="max-w-lg mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-medium">Theme</span>
            <button
              onClick={() =>
                handleChange(
                  'theme',
                  settings.theme === 'dark' ? 'light' : 'dark'
                )
              }
              className="px-4 py-2 rounded border bg-gray-100 hover:bg-gray-200"
            >
              {settings.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Auto-sync</span>
            <input
              type="checkbox"
              checked={settings.autoSync}
              onChange={(e) => handleChange('autoSync', e.target.checked)}
              className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Cursor sharing</span>
            <input
              type="checkbox"
              checked={settings.cursorSharing}
              onChange={(e) => handleChange('cursorSharing', e.target.checked)}
              className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Chat</span>
            <input
              type="checkbox"
              checked={settings.chatEnabled}
              onChange={(e) => handleChange('chatEnabled', e.target.checked)}
              className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </div>
          <div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 px-4 rounded bg-red-600 text-white hover:bg-red-700 font-medium"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SettingsPage;
