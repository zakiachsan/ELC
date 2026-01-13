import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { siteSettingsService, SiteSettings as DbSiteSettings } from '../services/siteSettings.service';

// Flat interface for backward compatibility
export interface SiteSettings {
  primaryColor: string;
  accentColor: string;
  videoUrl: string;
  videoTitle: string;
  videoDescription: string;
  videoOrientation: 'landscape' | 'portrait';
  showTeacherOfMonth: boolean;
}

interface SettingsContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const defaultSettings: SiteSettings = {
  primaryColor: '#2563eb',
  accentColor: '#facc15',
  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  videoTitle: 'Learning Tip of the Week',
  videoDescription: 'Discover how our adaptive logic helps you master English faster than traditional methods.',
  videoOrientation: 'landscape',
  showTeacherOfMonth: true
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Convert DB format to flat format
function dbToFlat(db: DbSiteSettings): SiteSettings {
  return {
    primaryColor: db.theme.primaryColor,
    accentColor: db.theme.accentColor,
    videoUrl: db.video.url,
    videoTitle: db.video.title,
    videoDescription: db.video.description,
    videoOrientation: db.video.orientation,
    showTeacherOfMonth: db.teacherOfMonth?.showOnHomepage ?? true,
  };
}

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      console.log('[SettingsProvider] Fetching settings from database...');
      const dbSettings = await siteSettingsService.getAll();
      const flatSettings = dbToFlat(dbSettings);
      console.log('[SettingsProvider] Loaded settings:', flatSettings);
      setSettings(flatSettings);
    } catch (err) {
      console.error('[SettingsProvider] Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load settings from database on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply CSS variables when settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--primary-hover', adjustColorBrightness(settings.primaryColor, -20));
    root.style.setProperty('--accent-hover', adjustColorBrightness(settings.accentColor, -20));
    root.style.setProperty('--primary-light', hexToRgba(settings.primaryColor, 0.1));
  }, [settings.primaryColor, settings.accentColor]);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    console.log('[SettingsProvider] Updating settings:', newSettings);

    // Update video settings if any video-related fields changed
    if (newSettings.videoUrl !== undefined ||
        newSettings.videoTitle !== undefined ||
        newSettings.videoDescription !== undefined ||
        newSettings.videoOrientation !== undefined) {
      await siteSettingsService.updateVideo({
        url: newSettings.videoUrl,
        title: newSettings.videoTitle,
        description: newSettings.videoDescription,
        orientation: newSettings.videoOrientation,
      });
    }

    // Update theme settings if any theme-related fields changed
    if (newSettings.primaryColor !== undefined || newSettings.accentColor !== undefined) {
      await siteSettingsService.updateTheme({
        primaryColor: newSettings.primaryColor,
        accentColor: newSettings.accentColor,
      });
    }

    // Update teacher of month settings if changed
    if (newSettings.showTeacherOfMonth !== undefined) {
      await siteSettingsService.updateTeacherOfMonth({
        showOnHomepage: newSettings.showTeacherOfMonth,
      });
    }

    // Update local state
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

function adjustColorBrightness(hex: string, percent: number) {
  let num = parseInt(hex.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    B = ((num >> 8) & 0x00FF) + amt,
    G = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
