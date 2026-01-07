
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { useModules } from '../../hooks/useModules';
import { OnlineModule, ModuleExam, DifficultyLevel, SkillCategory } from '../../types';
import { Video, FileText, Paperclip, Filter, Globe, Trash2, Layers, Search, Loader2 } from 'lucide-react';

export const OnlineMaterialsManager: React.FC = () => {
  const { modules: modulesData, loading, error, createModule, updateModule, deleteModule } = useModules();

  // ALL useState hooks must be called before any conditional returns
  const [isEditing, setIsEditing] = useState(false);
  const [currentModule, setCurrentModule] = useState<Partial<OnlineModule>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Adding specific exams inside the edit view
  const [examFile, setExamFile] = useState<File | null>(null);
  // State for the specific level of the exam being uploaded
  const [examUploadLevel, setExamUploadLevel] = useState<DifficultyLevel>(DifficultyLevel.INTERMEDIATE);

  // Filter States
  const [levelFilter, setLevelFilter] = useState<DifficultyLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map database format to component format
  const modules: OnlineModule[] = modulesData.map(m => ({
    id: m.id,
    title: m.title,
    videoUrl: m.video_url || '',
    description: m.description || undefined,
    skillCategory: m.skill_category as SkillCategory,
    difficultyLevel: m.difficulty_level as DifficultyLevel,
    materials: (m.materials as string[]) || [],
    exams: (m.exams as ModuleExam[]) || [],
    status: m.status as 'DRAFT' | 'PUBLISHED',
    totalDuration: m.total_duration || undefined,
    order: m.order || 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading modules...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading modules: {error.message}
      </div>
    );
  }

  const filteredModules = modules.filter(m => {
    const levelMatch = levelFilter === 'all' || m.difficultyLevel === levelFilter;
    const catMatch = categoryFilter === 'all' || m.skillCategory === categoryFilter;
    const searchMatch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return levelMatch && catMatch && searchMatch;
  });

  const handleAddNew = () => {
    setCurrentModule({
      materials: [],
      exams: [],
      status: 'DRAFT',
      skillCategory: SkillCategory.GRAMMAR,
      difficultyLevel: DifficultyLevel.INTERMEDIATE // Default Main Level
    });
    setExamFile(null);
    setExamUploadLevel(DifficultyLevel.INTERMEDIATE);
    setIsEditing(true);
  };

  const handleEdit = (module: OnlineModule) => {
    setCurrentModule(module);
    setExamFile(null);
    setExamUploadLevel(module.difficultyLevel); // Default to module's level
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentModule.title) return;

    setIsSubmitting(true);
    try {
      if (currentModule.id) {
         // Update existing
         await updateModule(currentModule.id, {
           title: currentModule.title,
           description: currentModule.description || null,
           video_url: currentModule.videoUrl || null,
           skill_category: currentModule.skillCategory,
           difficulty_level: currentModule.difficultyLevel,
           materials: currentModule.materials || [],
           status: currentModule.status || 'DRAFT',
         });
      } else {
         // Create new
         await createModule({
           title: currentModule.title!,
           description: currentModule.description || null,
           video_url: currentModule.videoUrl || null,
           skill_category: currentModule.skillCategory || SkillCategory.GRAMMAR,
           difficulty_level: currentModule.difficultyLevel || DifficultyLevel.INTERMEDIATE,
           materials: currentModule.materials || [],
           status: currentModule.status || 'DRAFT',
         });
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving module:', err);
      alert('Failed to save module');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExam = () => {
    if (!examFile) return;
    
    // Exam uses the explicitly selected upload level
    const newExam: ModuleExam = {
      difficulty: examUploadLevel,
      fileName: examFile.name
    };

    setCurrentModule(prev => ({
      ...prev,
      exams: [...(prev.exams || []), newExam]
    }));
    
    // Reset file but keep level (user might want to upload another for same level)
    setExamFile(null);
  };

  const handleRemoveExam = (fileName: string) => {
    if (window.confirm(`Are you sure you want to remove the exam file "${fileName}"?`)) {
        setCurrentModule(prev => ({
          ...prev,
          exams: prev.exams?.filter(ex => ex.fileName !== fileName)
        }));
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsEditing(false)} className="text-xs py-1 px-2">
            Back
          </Button>
          <h2 className="text-lg font-bold text-gray-900">
            {currentModule.id ? 'Edit Module' : 'Create Module'}
          </h2>
        </div>

        <Card className="!p-4">
          <div className="space-y-3">
             {/* Visibility Controls */}
             <div className="flex justify-end pb-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Status:</span>
                    <button
                      type="button"
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${currentModule.status === 'PUBLISHED' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      onClick={() => setCurrentModule({...currentModule, status: 'PUBLISHED'})}
                    >
                      Published
                    </button>
                    <button
                      type="button"
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${currentModule.status === 'DRAFT' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      onClick={() => setCurrentModule({...currentModule, status: 'DRAFT'})}
                    >
                      Draft
                    </button>
                </div>
             </div>

             {/* Header Info - SIDE BY SIDE CATEGORY & LEVEL */}
             <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Skill Category</label>
                   <select
                     className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-xs"
                     value={currentModule.skillCategory || SkillCategory.GRAMMAR}
                     onChange={e => setCurrentModule({...currentModule, skillCategory: e.target.value as SkillCategory})}
                   >
                     {Object.values(SkillCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                     ))}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Main Level</label>
                   <select
                     className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-xs"
                     value={currentModule.difficultyLevel || DifficultyLevel.INTERMEDIATE}
                     onChange={e => setCurrentModule({...currentModule, difficultyLevel: e.target.value as DifficultyLevel})}
                   >
                     {Object.values(DifficultyLevel).map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                     ))}
                   </select>
                </div>
             </div>

             {/* Title & Description */}
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Module Title</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1.5 text-xs"
                  value={currentModule.title || ''}
                  onChange={e => setCurrentModule({...currentModule, title: e.target.value})}
                  placeholder="e.g. Intro to Business English"
                />
             </div>

             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</label>
                <textarea
                  rows={3}
                  className="w-full border rounded px-2 py-1.5 text-xs"
                  value={currentModule.description || ''}
                  onChange={e => setCurrentModule({...currentModule, description: e.target.value})}
                  placeholder="Brief description about this module..."
                />
             </div>

             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Video URL</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1.5 text-xs"
                  value={currentModule.videoUrl || ''}
                  onChange={e => setCurrentModule({...currentModule, videoUrl: e.target.value})}
                  placeholder="https://youtube.com/..."
                />
             </div>

             <hr className="my-3 border-gray-100" />

             {/* Upload Sections */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Materials Upload */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <Paperclip className="w-3 h-3 text-blue-500" />
                    Learning Materials
                  </label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 text-center">
                    <input
                      type="file"
                      multiple
                      className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={(e) => {
                         const files = Array.from(e.target.files || []).map((f: any) => f.name);
                         setCurrentModule(prev => ({
                           ...prev,
                           materials: [...(prev.materials || []), ...files]
                         }));
                      }}
                    />
                    <div className="mt-2 text-left space-y-1">
                      {currentModule.materials?.map((m, i) => (
                        <div key={i} className="text-[10px] bg-white border px-2 py-1 rounded flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" /> {m}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exam Upload Section */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <Layers className="w-3 h-3 text-purple-600" />
                    Exam Files
                  </label>
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">

                    {/* Upload Controls Row */}
                    <div className="flex flex-col gap-1.5 mb-2">
                       <select
                         className="w-full text-[10px] border border-gray-300 rounded px-2 py-1"
                         value={examUploadLevel}
                         onChange={(e) => setExamUploadLevel(e.target.value as DifficultyLevel)}
                       >
                         {Object.values(DifficultyLevel).map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                         ))}
                       </select>

                       <div className="flex gap-1.5">
                          <input
                             type="file"
                             className="flex-1 text-[10px] border border-gray-300 rounded bg-white px-2 py-1"
                             onChange={(e) => setExamFile(e.target.files?.[0] || null)}
                          />
                          <Button
                            onClick={handleAddExam}
                            disabled={!examFile}
                            className="text-[10px] py-1 px-2 h-auto bg-gray-800 hover:bg-gray-900 text-white whitespace-nowrap"
                          >
                            Upload
                          </Button>
                       </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-gray-200">
                      {currentModule.exams?.length === 0 && <p className="text-[10px] text-gray-400 text-center italic">No exam files yet.</p>}
                      {currentModule.exams?.map((ex, idx) => (
                         <div key={idx} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-gray-200">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                               <span className="text-[9px] font-bold text-gray-500 border border-gray-200 px-1 rounded bg-gray-50 whitespace-nowrap">
                                  {ex.difficulty}
                               </span>
                               <span className="text-[10px] text-gray-700 truncate">{ex.fileName}</span>
                            </div>
                            <button onClick={() => handleRemoveExam(ex.fileName)} className="text-red-400 hover:text-red-600 ml-1" title="Delete">
                               <Trash2 className="w-2.5 h-2.5" />
                            </button>
                         </div>
                      ))}
                    </div>
                  </div>
                </div>
             </div>

             <div className="flex justify-end pt-3">
               <Button onClick={handleSave} className="text-xs py-1.5 px-4">Save Module</Button>
             </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
           <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
             <Video className="w-5 h-5 text-teal-600" /> Afternoon Classes
           </h2>
           <p className="text-xs text-gray-500">Manage learning materials, videos, and exams.</p>
        </div>
        <Button onClick={handleAddNew} className="text-xs py-1.5 px-3">
          + Create Module
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
         <div className="flex items-center gap-2 w-full md:w-auto">
             <Filter className="w-3.5 h-3.5 text-gray-400" />
             <select
               className="text-xs border-none bg-transparent focus:ring-0 text-gray-600 font-medium cursor-pointer w-full md:w-auto"
               value={levelFilter}
               onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : e.target.value as DifficultyLevel)}
             >
               <option value="all">All Levels</option>
               {Object.values(DifficultyLevel).map(l => <option key={l} value={l}>{l}</option>)}
             </select>
         </div>

         <div className="hidden md:block h-4 w-px bg-gray-300"></div>

         <select
           className="text-xs border-none bg-transparent focus:ring-0 text-gray-600 font-medium cursor-pointer w-full md:w-auto"
           value={categoryFilter}
           onChange={(e) => setCategoryFilter(e.target.value)}
         >
           <option value="all">All Categories</option>
           {Object.values(SkillCategory).map(cat => (
             <option key={cat} value={cat}>{cat}</option>
           ))}
         </select>

         <div className="hidden md:block h-4 w-px bg-gray-300"></div>

         <div className="flex items-center gap-2 w-full md:flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search title..."
              className="text-xs border-none bg-transparent focus:ring-0 text-gray-700 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredModules.map((module) => (
           <Card key={module.id} className="!p-3 hover:border-blue-300 transition-colors">
             <div className="flex flex-col md:flex-row gap-3 items-start">
               <div className="flex-1 space-y-2">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                       <h3 className="font-bold text-sm text-gray-900">{module.title}</h3>
                       {module.status === 'PUBLISHED' ? (
                          <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                             <Globe className="w-2.5 h-2.5" /> Published
                          </span>
                       ) : (
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Draft</span>
                       )}
                    </div>
                    <span className="text-[10px] text-gray-400">{module.postedDate}</span>
                 </div>

                 <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[9px] font-bold bg-gray-100 px-1.5 py-0.5 rounded">{module.skillCategory}</span>
                    <span className="text-[9px] font-medium text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">
                       {module.difficultyLevel}
                    </span>
                 </div>

                 <p className="text-gray-600 text-xs line-clamp-2">{module.description}</p>

                 {/* Metadata Row */}
                 <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
                    {module.videoUrl && (
                       <div className="flex items-center gap-1 text-[10px] text-gray-500">
                         <Video className="w-3 h-3" />
                         <span>Video</span>
                       </div>
                    )}

                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <FileText className="w-3 h-3" />
                      <span>{module.materials.length} Materials</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Layers className="w-3 h-3" />
                      <span>{module.exams.length} Exams</span>
                    </div>
                 </div>
               </div>

               {/* Right Side - Actions */}
               <div className="w-full md:w-auto md:border-l border-gray-100 md:pl-3 pt-2 md:pt-0 flex flex-col justify-center">
                  <Button variant="outline" className="text-[10px] py-1 px-2 whitespace-nowrap" onClick={() => handleEdit(module)}>
                    Edit
                  </Button>
               </div>
             </div>
           </Card>
        ))}

        {filteredModules.length === 0 && (
          <div className="text-center py-8 text-gray-400 italic text-xs">No matching modules.</div>
        )}
      </div>
    </div>
  );
};
