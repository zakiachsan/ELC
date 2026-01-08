
import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { useSettings } from '../../contexts/SettingsContext';
import { Video, Layout, Monitor, Smartphone, Loader2 } from 'lucide-react';

export const SiteSettings: React.FC = () => {
  const { settings, updateSettings, loading } = useSettings();
  
  const [primary, setPrimary] = useState(settings.primaryColor);
  const [accent, setAccent] = useState(settings.accentColor);
  const [videoUrl, setVideoUrl] = useState(settings.videoUrl);
  const [previewUrl, setPreviewUrl] = useState(settings.videoUrl);
  const [videoTitle, setVideoTitle] = useState(settings.videoTitle);
  const [videoDesc, setVideoDesc] = useState(settings.videoDescription);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(settings.videoOrientation);
  
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync local state when settings load from database
  useEffect(() => {
    if (!loading) {
      setPrimary(settings.primaryColor);
      setAccent(settings.accentColor);
      setVideoUrl(settings.videoUrl);
      setPreviewUrl(settings.videoUrl);
      setVideoTitle(settings.videoTitle);
      setVideoDesc(settings.videoDescription);
      setOrientation(settings.videoOrientation);
    }
  }, [loading, settings]);

  // Convert YouTube URL to embed format
  const convertToEmbedUrl = (url: string): string => {
    if (!url) return url;
    
    // Already embed format
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // Regular YouTube URL formats
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/shorts/VIDEO_ID
    
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URL(url).searchParams;
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0] || '';
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const embedUrl = convertToEmbedUrl(videoUrl);
      
      await updateSettings({
        primaryColor: primary,
        accentColor: accent,
        videoUrl: embedUrl,
        videoTitle,
        videoDescription: videoDesc,
        videoOrientation: orientation
      });
      
      // Update local state with converted URL
      setVideoUrl(embedUrl);
      setPreviewUrl(embedUrl);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      console.log('Settings saved to database:', {
        videoUrl: embedUrl,
        videoTitle,
        videoDescription: videoDesc
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if(window.confirm("Reset to default Blue/Yellow theme?")) {
        setPrimary('#2563eb');
        setAccent('#facc15');
        updateSettings({
            primaryColor: '#2563eb',
            accentColor: '#facc15'
        });
    }
  };

  const handleUpdatePreview = () => {
    if (videoUrl) {
      setPreviewUrl(videoUrl);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div>
          <h2 className="text-2xl font-bold text-gray-900">Site Settings</h2>
          <p className="text-gray-500">Manage homepage content and site-wide visual themes.</p>
       </div>

       <form onSubmit={handleSave} className="space-y-8">
          <Card title="Theme Configuration">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-gray-200" style={{backgroundColor: primary}}></div>
                      Primary Color
                   </label>
                   <div className="flex items-center gap-4">
                      <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-20 rounded cursor-pointer border-0 p-0" />
                      <input type="text" value={primary} onChange={(e) => setPrimary(e.target.value)} className="border rounded px-3 py-2 w-full uppercase font-mono" />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-gray-200" style={{backgroundColor: accent}}></div>
                      Accent Color
                   </label>
                   <div className="flex items-center gap-4">
                      <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-20 rounded cursor-pointer border-0 p-0" />
                      <input type="text" value={accent} onChange={(e) => setAccent(e.target.value)} className="border rounded px-3 py-2 w-full uppercase font-mono" />
                   </div>
                </div>
             </div>
             <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <Button type="button" variant="outline" onClick={handleReset} className="text-xs">Reset Defaults</Button>
             </div>
          </Card>

          <Card title="Video & Login Experience">
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
                         <input required type="text" className="w-full border rounded px-3 py-2 text-sm" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Orientation Display</label>
                         <div className="grid grid-cols-2 gap-2">
                            <button 
                               type="button"
                               onClick={() => setOrientation('landscape')}
                               className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-sm font-bold ${orientation === 'landscape' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                            >
                               <Monitor className="w-4 h-4" /> Landscape
                            </button>
                            <button 
                               type="button"
                               onClick={() => setOrientation('portrait')}
                               className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-sm font-bold ${orientation === 'portrait' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                            >
                               <Smartphone className="w-4 h-4" /> Portrait
                            </button>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea rows={5} className="w-full border rounded px-3 py-2 text-sm" value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)} />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Embed URL</label>
                   <div className="flex gap-2">
                       <input required type="url" className="w-full border rounded px-3 py-2 font-mono text-xs" placeholder="https://www.youtube.com/embed/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                       <Button type="button" onClick={handleUpdatePreview} variant="secondary" className="whitespace-nowrap text-xs">Preview</Button>
                   </div>
                </div>

                <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-dashed">
                   <p className="text-xs font-bold text-gray-500 mb-4 uppercase flex items-center gap-2"><Layout className="w-3 h-3" /> Live Preview</p>
                   <div className="flex justify-center">
                      <div className={`bg-black rounded-lg overflow-hidden border-2 border-white shadow-xl transition-all duration-500 ${orientation === 'landscape' ? 'aspect-video w-full max-w-md' : 'aspect-[9/16] w-48'}`}>
                         <iframe className="w-full h-full" src={previewUrl} title="Preview" allowFullScreen />
                      </div>
                   </div>
                </div>
             </div>
          </Card>

          <div className="flex justify-end gap-3 sticky bottom-6 z-10">
             <Button type="submit" className="shadow-xl" disabled={saving || loading}>
               {saving ? (
                 <span className="flex items-center gap-2">
                   <Loader2 className="w-4 h-4 animate-spin" />
                   Saving...
                 </span>
               ) : (
                 'Save All Settings'
               )}
             </Button>
          </div>
       </form>
       
       {success && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-800 text-white px-6 py-3 rounded-full shadow-lg animate-bounce z-50">Settings Saved!</div>
       )}
    </div>
  );
};
