-- Create site_settings table for storing site-wide configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Create index for fast lookup by key
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- Insert default settings
INSERT INTO site_settings (setting_key, setting_value) VALUES 
('video', '{"url": "https://www.youtube.com/embed/dQw4w9WgXcQ", "title": "Learning Tip of the Week", "description": "Discover how our adaptive logic helps you master English faster than traditional methods.", "orientation": "landscape"}'::jsonb),
('theme', '{"primaryColor": "#2563eb", "accentColor": "#facc15"}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read site settings" ON site_settings
  FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update site settings" ON site_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admins can insert site settings" ON site_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );
