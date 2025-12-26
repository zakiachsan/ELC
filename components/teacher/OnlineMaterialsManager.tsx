
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MOCK_ONLINE_MODULES } from '../../constants';
import { OnlineModule, ModuleExam, DifficultyLevel, SkillCategory } from '../../types';
import { Video, FileText, Paperclip, Filter, Globe, Trash2, Layers, Search } from 'lucide-react';

export const OnlineMaterialsManager: React.FC = () => {
  const [modules, setModules] = useState<OnlineModule[]>(MOCK_ONLINE_MODULES);
  const [isEditing, setIsEditing] = useState(false);
  const [currentModule, setCurrentModule] = useState<Partial<OnlineModule>>({});
  
  // States for Adding specific exams inside the edit view
  const [examFile, setExamFile] = useState<File | null>(null);
  // NEW: State for the specific level of the exam being uploaded
  const [examUploadLevel, setExamUploadLevel] = useState<DifficultyLevel>(DifficultyLevel.INTERMEDIATE);

  // Filter States
  const [levelFilter, setLevelFilter] = useState<DifficultyLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSave = () => {
    if (!currentModule.title) return;

    if (currentModule.id) {
       // Update existing
       setModules(prev => prev.map(m => m.id === currentModule.id ? { ...m, ...currentModule } as OnlineModule : m));
    } else {
       // Create new
       const newModule: OnlineModule = {
         ...currentModule,
         id: `om${Date.now()}`,
         postedDate: new Date().toISOString().split('T')[0],
         materials: currentModule.materials || [],
         exams: currentModule.exams || [],
         videoUrl: currentModule.videoUrl || '',
         description: currentModule.description || '',
         status: currentModule.status || 'DRAFT',
         skillCategory: currentModule.skillCategory || SkillCategory.GRAMMAR,
         difficultyLevel: currentModule.difficultyLevel || DifficultyLevel.INTERMEDIATE
       } as OnlineModule;
       setModules(prev => [newModule, ...prev]);
    }
    setIsEditing(false);
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Back
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentModule.id ? 'Edit Module' : 'Create Module'}
          </h2>
        </div>

        <Card>
          <div className="space-y-4">
             {/* Visibility Controls */}
             <div className="flex justify-end pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Visibility:</span>
                    <Button 
                      type="button"
                      variant={currentModule.status === 'PUBLISHED' ? 'primary' : 'outline'}
                      className={`text-xs ${currentModule.status === 'PUBLISHED' ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
                      onClick={() => setCurrentModule({...currentModule, status: 'PUBLISHED'})}
                    >
                      Published
                    </Button>
                    <Button 
                      type="button"
                      variant={currentModule.status === 'DRAFT' ? 'primary' : 'outline'}
                      className={`text-xs ${currentModule.status === 'DRAFT' ? 'bg-gray-600 hover:bg-gray-700 border-gray-600' : ''}`}
                      onClick={() => setCurrentModule({...currentModule, status: 'DRAFT'})}
                    >
                      Draft
                    </Button>
                </div>
             </div>

             {/* Header Info - SIDE BY SIDE CATEGORY & LEVEL */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-800">Skill Category</label>
                   <select 
                     className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                     value={currentModule.skillCategory || SkillCategory.GRAMMAR}
                     onChange={e => setCurrentModule({...currentModule, skillCategory: e.target.value as SkillCategory})}
                   >
                     {Object.values(SkillCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                     ))}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-800">Primary Level</label>
                   <select 
                     className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
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
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Module Title</label>
                <input 
                  type="text" 
                  className="w-full border rounded px-3 py-2" 
                  value={currentModule.title || ''}
                  onChange={e => setCurrentModule({...currentModule, title: e.target.value})}
                  placeholder="e.g. Intro to Business English"
                />
             </div>
             
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  rows={4}
                  className="w-full border rounded px-3 py-2"
                  value={currentModule.description || ''}
                  onChange={e => setCurrentModule({...currentModule, description: e.target.value})}
                  placeholder="Brief overview of what students will learn..."
                />
             </div>

             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Video URL</label>
                <input 
                  type="text" 
                  className="w-full border rounded px-3 py-2" 
                  value={currentModule.videoUrl || ''}
                  onChange={e => setCurrentModule({...currentModule, videoUrl: e.target.value})}
                  placeholder="https://youtube.com/..."
                />
             </div>

             <hr className="my-4 border-gray-100" />
             
             {/* Upload Sections */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Materials Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-500" />
                    General Study Materials
                  </label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
                    <input 
                      type="file" 
                      multiple
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={(e) => {
                         // Mock adding files
                         const files = Array.from(e.target.files || []).map((f: any) => f.name);
                         setCurrentModule(prev => ({
                           ...prev,
                           materials: [...(prev.materials || []), ...files]
                         }));
                      }}
                    />
                    <div className="mt-2 text-left space-y-1">
                      {currentModule.materials?.map((m, i) => (
                        <div key={i} className="text-xs bg-white border px-2 py-1 rounded flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {m}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exam Upload Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Exam Files
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                     Select a level, choose a file, then click upload.
                  </p>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    
                    {/* Upload Controls Row */}
                    <div className="flex flex-col gap-2 mb-3">
                       <select 
                         className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
                         value={examUploadLevel}
                         onChange={(e) => setExamUploadLevel(e.target.value as DifficultyLevel)}
                       >
                         {Object.values(DifficultyLevel).map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                         ))}
                       </select>
                       
                       <div className="flex gap-2">
                          <input 
                             type="file"
                             className="flex-1 text-[10px] border border-gray-300 rounded bg-white px-2 py-1"
                             onChange={(e) => setExamFile(e.target.files?.[0] || null)}
                          />
                          <Button 
                            onClick={handleAddExam} 
                            disabled={!examFile}
                            className="text-xs py-1 h-auto bg-gray-800 hover:bg-gray-900 text-white whitespace-nowrap"
                          >
                            Upload
                          </Button>
                       </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-gray-200">
                      {currentModule.exams?.length === 0 && <p className="text-xs text-gray-400 text-center italic">No exams files uploaded.</p>}
                      {currentModule.exams?.map((ex, idx) => (
                         <div key={idx} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                               <span className="text-[10px] font-bold text-gray-500 border border-gray-200 px-1.5 rounded bg-gray-50 whitespace-nowrap">
                                  {ex.difficulty}
                               </span>
                               <span className="text-xs text-gray-700 truncate">{ex.fileName}</span>
                            </div>
                            <button onClick={() => handleRemoveExam(ex.fileName)} className="text-red-400 hover:text-red-600 ml-2" title="Remove Exam">
                               <Trash2 className="w-3 h-3" />
                            </button>
                         </div>
                      ))}
                    </div>
                  </div>
                </div>
             </div>

             <div className="flex justify-end pt-4">
               <Button onClick={handleSave}>Save Module</Button>
             </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Online Learning Materials</h2>
           <p className="text-gray-500">Manage self-paced content, videos, and exams.</p>
        </div>
        <Button onClick={handleAddNew}>
          Create Module
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
         <div className="flex items-center gap-2 w-full md:w-auto">
             <Filter className="w-4 h-4 text-gray-400" />
             <select 
               className="text-sm border-none bg-transparent focus:ring-0 text-gray-600 font-medium cursor-pointer w-full md:w-auto"
               value={levelFilter}
               onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : e.target.value as DifficultyLevel)}
             >
               <option value="all">All Difficulty Levels</option>
               {Object.values(DifficultyLevel).map(l => <option key={l} value={l}>{l}</option>)}
             </select>
         </div>
         
         <div className="hidden md:block h-4 w-px bg-gray-300"></div>
         
         <select 
           className="text-sm border-none bg-transparent focus:ring-0 text-gray-600 font-medium cursor-pointer w-full md:w-auto"
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
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search title..."
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredModules.map((module) => (
           <Card key={module.id} className="hover:border-blue-300 transition-colors">
             <div className="flex flex-col md:flex-row gap-6 items-start">
               <div className="flex-1 space-y-3">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <h3 className="font-bold text-lg text-gray-900">{module.title}</h3>
                       {module.status === 'PUBLISHED' ? (
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                             <Globe className="w-3 h-3" /> Published
                          </span>
                       ) : (
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Draft</span>
                       )}
                    </div>
                    <span className="text-xs text-gray-500 border rounded px-2 py-1">Posted: {module.postedDate}</span>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">{module.skillCategory}</span>
                 </div>

                 <p className="text-gray-600 text-sm">{module.description}</p>
                 
                 {/* Metadata Row: Level, Video, Materials, Exams */}
                 <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100 mt-2">
                    <span className="text-xs font-medium text-gray-600 border border-gray-200 px-2 py-1 rounded">
                       {module.difficultyLevel}
                    </span>

                    {module.videoUrl && (
                       <div className="flex items-center gap-1 text-sm text-gray-500">
                         <Video className="w-4 h-4" />
                         <span>Video</span>
                       </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <FileText className="w-4 h-4" />
                      <span>{module.materials.length} Materials</span>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Layers className="w-4 h-4" />
                      <span>{module.exams.length} Exam File{module.exams.length !== 1 ? 's' : ''}</span>
                    </div>
                 </div>
               </div>

               {/* Right Side - Actions */}
               <div className="w-full md:w-auto md:border-l border-gray-100 md:pl-6 pt-4 md:pt-0 flex flex-col justify-center">
                  <Button variant="outline" className="text-sm whitespace-nowrap" onClick={() => handleEdit(module)}>
                    Edit Module
                  </Button>
               </div>
             </div>
           </Card>
        ))}
        
        {filteredModules.length === 0 && (
          <div className="text-center py-10 text-gray-400 italic">No modules match your filter.</div>
        )}
      </div>
    </div>
  );
};
