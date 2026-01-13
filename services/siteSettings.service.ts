import { supabase } from '../lib/supabase';

export interface VideoSettings {
  url: string;
  title: string;
  description: string;
  orientation: 'landscape' | 'portrait';
}

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
}

export interface TeacherOfMonthSettings {
  showOnHomepage: boolean;
}

export interface SiteSettings {
  video: VideoSettings;
  theme: ThemeSettings;
  teacherOfMonth: TeacherOfMonthSettings;
}

const defaultSettings: SiteSettings = {
  video: {
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'Learning Tip of the Week',
    description: 'Discover how our adaptive logic helps you master English faster than traditional methods.',
    orientation: 'landscape'
  },
  theme: {
    primaryColor: '#2563eb',
    accentColor: '#facc15'
  },
  teacherOfMonth: {
    showOnHomepage: true
  }
};

export const siteSettingsService = {
  async getAll(): Promise<SiteSettings> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value');

      if (error) {
        console.error('Error fetching site settings:', error);
        return defaultSettings;
      }

      const settings: SiteSettings = { ...defaultSettings };
      
      data?.forEach(row => {
        if (row.setting_key === 'video') {
          settings.video = { ...defaultSettings.video, ...row.setting_value };
        } else if (row.setting_key === 'theme') {
          settings.theme = { ...defaultSettings.theme, ...row.setting_value };
        } else if (row.setting_key === 'teacher_of_month') {
          settings.teacherOfMonth = { ...defaultSettings.teacherOfMonth, ...row.setting_value };
        }
      });

      return settings;
    } catch (err) {
      console.error('Error in getAll:', err);
      return defaultSettings;
    }
  },

  async getVideo(): Promise<VideoSettings> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'video')
        .single();

      if (error || !data) {
        return defaultSettings.video;
      }

      return { ...defaultSettings.video, ...data.setting_value };
    } catch (err) {
      console.error('Error getting video settings:', err);
      return defaultSettings.video;
    }
  },

  async getTheme(): Promise<ThemeSettings> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'theme')
        .single();

      if (error || !data) {
        return defaultSettings.theme;
      }

      return { ...defaultSettings.theme, ...data.setting_value };
    } catch (err) {
      console.error('Error getting theme settings:', err);
      return defaultSettings.theme;
    }
  },

  async updateVideo(video: Partial<VideoSettings>, userId?: string): Promise<boolean> {
    try {
      const current = await this.getVideo();
      const updated = { ...current, ...video };

      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'video',
          setting_value: updated,
          updated_at: new Date().toISOString(),
          updated_by: userId || null
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error('Error updating video settings:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in updateVideo:', err);
      return false;
    }
  },

  async updateTheme(theme: Partial<ThemeSettings>, userId?: string): Promise<boolean> {
    try {
      const current = await this.getTheme();
      const updated = { ...current, ...theme };

      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'theme',
          setting_value: updated,
          updated_at: new Date().toISOString(),
          updated_by: userId || null
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error('Error updating theme settings:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in updateTheme:', err);
      return false;
    }
  },

  async getTeacherOfMonth(): Promise<TeacherOfMonthSettings> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'teacher_of_month')
        .single();

      if (error || !data) {
        return defaultSettings.teacherOfMonth;
      }

      return { ...defaultSettings.teacherOfMonth, ...data.setting_value };
    } catch (err) {
      console.error('Error getting teacher of month settings:', err);
      return defaultSettings.teacherOfMonth;
    }
  },

  async updateTeacherOfMonth(settings: Partial<TeacherOfMonthSettings>, userId?: string): Promise<boolean> {
    try {
      const current = await this.getTeacherOfMonth();
      const updated = { ...current, ...settings };

      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'teacher_of_month',
          setting_value: updated,
          updated_at: new Date().toISOString(),
          updated_by: userId || null
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error('Error updating teacher of month settings:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in updateTeacherOfMonth:', err);
      return false;
    }
  }
};

export default siteSettingsService;
