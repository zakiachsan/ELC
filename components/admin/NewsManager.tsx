
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { 
  Newspaper, Plus, Pencil, Trash2, Image as ImageIcon, 
  Bold, Italic, Underline, Link, Type, Palette, 
  ChevronLeft, Save, Eye, Upload, List, Video, MonitorPlay
} from 'lucide-react';
import { MOCK_NEWS } from '../../constants';
import { News } from '../../types';

export const NewsManager: React.FC = () => {
  const [newsList, setNewsList] = useState<News[]>(MOCK_NEWS);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingNews, setEditingNews] = useState<Partial<News> | null>(null);

  const handleCreate = () => {
    setEditingNews({
      title: '',
      summary: '',
      content: '',
      featuredImage: '',
      videoUrl: '',
      displayMedia: 'image',
      publishedDate: new Date().toISOString()
    });
    setView('editor');
  };

  const handleEdit = (news: News) => {
    setEditingNews(news);
    setView('editor');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this article?')) {
      setNewsList(newsList.filter(n => n.id !== id));
    }
  };

  const handleSave = (news: News) => {
    if (newsList.find(n => n.id === news.id)) {
      setNewsList(newsList.map(n => n.id === news.id ? news : n));
    } else {
      setNewsList([news, ...newsList]);
    }
    setView('list');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-blue-600" /> News Management
          </h2>
          <p className="text-gray-500">Create and manage your articles.</p>
        </div>
        {view === 'list' && (
          <Button onClick={handleCreate}>
            Create New Article
          </Button>
        )}
      </div>

      {view === 'list' ? (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Article</th>
                <th className="px-6 py-4">Media</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {newsList.map(news => (
                <tr key={news.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                       <img src={news.featuredImage} className="w-12 h-12 rounded-lg object-cover bg-gray-100" alt="" />
                       <div>
                          <div className="text-sm font-bold text-gray-900 line-clamp-1">{news.title}</div>
                          <div className="text-xs text-gray-400 line-clamp-1">{news.summary}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1 w-fit ${news.displayMedia === 'video' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                       {news.displayMedia === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                       {news.displayMedia}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(news.publishedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(news)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(news.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <NewsEditor 
           news={editingNews as News} 
           onSave={handleSave} 
           onCancel={() => setView('list')} 
        />
      )}
    </div>
  );
};

const NewsEditor: React.FC<{ news: News, onSave: (n: News) => void, onCancel: () => void }> = ({ news, onSave, onCancel }) => {
  const [formData, setFormData] = useState<News>({
    ...news,
    id: news.id || 'n' + Date.now()
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineImgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current) {
       editorRef.current.innerHTML = formData.content;
    }
  }, []);

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      setFormData(prev => ({ ...prev, featuredImage: base64 }));
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      execCommand('insertImage', base64);
      setTimeout(() => {
         const images = editorRef.current?.querySelectorAll('img');
         images?.forEach(img => {
            img.className = 'max-w-full h-auto rounded-xl my-4 mx-auto block shadow-md';
         });
      }, 10);
      e.target.value = '';
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
      setTimeout(() => {
         const links = editorRef.current?.querySelectorAll('a');
         links?.forEach(link => {
            if (!link.hasAttribute('target')) {
               link.setAttribute('target', '_blank');
               link.setAttribute('rel', 'noopener noreferrer');
            }
         });
      }, 10);
    }
  };

  const updateContent = () => {
    if (editorRef.current) {
      setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={submit} className="space-y-6 pb-20">
       <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Article</Button>
       </div>

       <div className="space-y-6">
          <Card title="Core Information">
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Article Title</label>
                   <input 
                      required
                      type="text" 
                      className="w-full border-b-2 border-gray-100 focus:border-blue-500 outline-none text-2xl font-black py-2 bg-transparent"
                      placeholder="Title of your story..."
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Short Summary (Preview)</label>
                   <textarea 
                      required
                      className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
                      rows={2}
                      placeholder="A brief blurb for the news feed card..."
                      value={formData.summary}
                      onChange={e => setFormData({...formData, summary: e.target.value})}
                   />
                </div>
             </div>
          </Card>

          <Card title="Media Settings">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Preference</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                         <button 
                           type="button"
                           onClick={() => setFormData({...formData, displayMedia: 'image'})}
                           className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-sm font-bold transition-all ${formData.displayMedia === 'image' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-400'}`}
                         >
                            <ImageIcon className="w-4 h-4" /> Show Image
                         </button>
                         <button 
                           type="button"
                           onClick={() => setFormData({...formData, displayMedia: 'video'})}
                           className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-sm font-bold transition-all ${formData.displayMedia === 'video' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-400'}`}
                         >
                            <Video className="w-4 h-4" /> Show Video
                         </button>
                      </div>
                   </div>
                   
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Featured Image (Required)</label>
                      <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="mt-2 border-2 border-dashed border-gray-200 rounded-2xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden"
                      >
                         {formData.featuredImage ? (
                            <img src={formData.featuredImage} className="w-full h-full object-cover" alt="Featured preview" />
                         ) : (
                            <>
                               <Upload className="w-8 h-8 text-gray-300 mb-2" />
                               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upload Cover</span>
                            </>
                         )}
                         <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={handleFeaturedImageUpload}
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">YouTube Video URL</label>
                      <div className="relative mt-2">
                         <MonitorPlay className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <input 
                           type="url" 
                           className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                           placeholder="https://www.youtube.com/embed/..."
                           value={formData.videoUrl}
                           onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                         />
                      </div>
                      <p className="text-[9px] text-gray-400 mt-1 italic">Use the "Embed" URL format for best compatibility.</p>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Published Date</label>
                      <input 
                         type="date" 
                         className="w-full border rounded-xl px-4 py-3 text-sm mt-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                         value={formData.publishedDate.split('T')[0]}
                         onChange={e => setFormData({...formData, publishedDate: e.target.value})}
                      />
                   </div>
                </div>
             </div>
          </Card>

          <Card className="min-h-[600px] flex flex-col p-0">
             <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                <div className="flex bg-white border border-gray-200 rounded-lg p-1 mr-2">
                   <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} title="Bold" />
                   <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} title="Italic" />
                   <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} title="Underline" />
                </div>
                <div className="flex bg-white border border-gray-200 rounded-lg p-1 mr-2">
                   <select onChange={(e) => execCommand('fontSize', e.target.value)} className="text-xs bg-transparent border-none focus:ring-0 outline-none h-6 px-1">
                      <option value="3">Size</option>
                      <option value="1">Small</option>
                      <option value="3">Normal</option>
                      <option value="5">Large</option>
                      <option value="7">Extra Large</option>
                   </select>
                </div>
                <div className="flex bg-white border border-gray-200 rounded-lg p-1 mr-2">
                   <ToolbarButton onClick={() => handleLink()} icon={Link} title="Add Link" />
                   <ToolbarButton onClick={() => inlineImgInputRef.current?.click()} icon={ImageIcon} title="Insert Image" />
                   <input ref={inlineImgInputRef} type="file" accept="image/*" className="hidden" onChange={handleInlineImageUpload} />
                </div>
                <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                   <input type="color" onChange={(e) => execCommand('foreColor', e.target.value)} className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer" title="Text Color" />
                </div>
             </div>

             <div className="flex-1 p-8 space-y-6">
                <h1 className="text-4xl font-black text-gray-900 border-b pb-4 border-gray-100">{formData.title || 'Article Preview'}</h1>
                
                {formData.displayMedia === 'video' && formData.videoUrl ? (
                   <div className="rounded-3xl overflow-hidden shadow-xl aspect-video bg-black">
                      <iframe className="w-full h-full" src={formData.videoUrl} title="Video Preview" allowFullScreen></iframe>
                   </div>
                ) : (
                   formData.featuredImage && (
                      <div className="rounded-3xl overflow-hidden shadow-xl">
                         <img src={formData.featuredImage} className="w-full h-auto" alt="" />
                      </div>
                   )
                )}

                <div 
                   ref={editorRef}
                   contentEditable 
                   onInput={updateContent}
                   className="min-h-[400px] outline-none prose prose-blue max-w-none focus:prose-p:text-gray-900"
                   placeholder="Start writing your story..."
                />
             </div>
          </Card>
       </div>
    </form>
  );
};

const ToolbarButton: React.FC<{ onClick: () => void, icon: React.ElementType, title: string }> = ({ onClick, icon: Icon, title }) => (
  <button type="button" onClick={(e) => { e.preventDefault(); onClick(); }} title={title} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all">
    <Icon className="w-4 h-4" />
  </button>
);
