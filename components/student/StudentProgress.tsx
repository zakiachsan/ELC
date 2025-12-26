
import React, { useState } from 'react';
import { User, SkillCategory } from '../../types';
import { Card } from '../Card';
import { LEVEL_COLORS, MOCK_SESSION_REPORTS, MOCK_SESSIONS, MOCK_MODULE_PROGRESS, MOCK_ONLINE_MODULES } from '../../constants';
import { SKILL_ICONS } from './StudentView';
import { TrendingUp, School, Globe, Filter, Brain } from 'lucide-react';

export const StudentProgress: React.FC<{ student: User }> = ({ student }) => {
  const [activeSource, setActiveSource] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [selectedSkill, setSelectedSkill] = useState<SkillCategory | 'ALL'>('ALL');

  // --- DATA PROCESSING ---

  // 1. OFFLINE (Classroom) Exam History
  const offlineExams = MOCK_SESSIONS
    .map(s => {
       const report = MOCK_SESSION_REPORTS[s.id]?.find(r => r.studentId === student.id);
       if (!report || (report.examScore === undefined && !report.placementResult)) return null;
       return {
         id: s.id,
         date: s.dateTime,
         topic: s.topic,
         skill: s.skillCategory,
         score: report.examScore,
         placement: report.placementResult,
         teacherName: 'Mr. John Keating', // Mock
         feedback: "Excellent work on the structure. Keep improving vocabulary.", // Mock
         type: 'Class Exam'
       };
    })
    .filter(Boolean);

  // 2. ONLINE (Learning Hub) Module History
  const onlineExams = MOCK_MODULE_PROGRESS
    .filter(p => p.studentId === student.id && p.status === 'COMPLETED')
    .map(p => {
        const module = MOCK_ONLINE_MODULES.find(m => m.id === p.moduleId);
        if (!module) return null;
        return {
            id: module.id,
            date: p.completedDate || new Date().toISOString(),
            topic: module.title,
            skill: module.skillCategory,
            score: p.quizScore,
            placement: p.placementResult,
            teacherName: 'AI Auto-Graded',
            feedback: "Automated scoring completed.",
            type: 'Module Quiz'
        };
    })
    .filter(Boolean);

  // 3. Determine which list to show based on Source Toggle
  const currentList = activeSource === 'OFFLINE' ? offlineExams : onlineExams;
  
  // 4. Apply Skill Filter
  const filteredList = currentList
    .filter(e => selectedSkill === 'ALL' || e!.skill === selectedSkill)
    .sort((a,b) => new Date(b!.date).getTime() - new Date(a!.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in">
       <div>
         <h2 className="text-2xl font-bold text-gray-900">My Progress</h2>
         <p className="text-gray-500">Track your academic achievements and skill level improvements.</p>
       </div>

       {/* Results Header View (Always Academic Results now) */}
       <div className="space-y-6">
           {/* Source Toggle & Filter Row */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              {/* Learning Source Switch */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                      onClick={() => setActiveSource('OFFLINE')}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${activeSource === 'OFFLINE' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      <School className="w-4 h-4" /> Classroom (Offline)
                  </button>
                  <button 
                      onClick={() => setActiveSource('ONLINE')}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${activeSource === 'ONLINE' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      <Globe className="w-4 h-4" /> Learning Hub (Online)
                  </button>
              </div>

              {/* Simplified Category Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Filter className="w-3 h-3" /> Filter:
                  </span>
                  <select 
                      className="text-sm border-gray-200 rounded-lg focus:ring-teal-500 focus:border-teal-500 py-1.5 pl-3 pr-8 bg-gray-50 text-gray-700 font-medium"
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value as SkillCategory | 'ALL')}
                  >
                      <option value="ALL">All Skills</option>
                      {Object.values(SkillCategory).map(skill => (
                          <option key={skill} value={skill}>{skill}</option>
                      ))}
                  </select>
              </div>
           </div>

           {/* MINIMALIST Current Skill Snapshot - NO BARS */}
           <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-teal-600" /> Current Skill Snapshot
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.values(SkillCategory).filter(s => selectedSkill === 'ALL' || s === selectedSkill).map(skill => {
                      const level = student.skillLevels?.[skill];
                      const Icon = SKILL_ICONS[skill];

                      return (
                      <div key={skill} className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col justify-between gap-3 hover:border-teal-300 transition-all shadow-sm h-full">
                          <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${level ? 'text-teal-600' : 'text-gray-300'}`} />
                              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{skill}</div>
                          </div>
                          
                          <div className="text-sm font-bold text-gray-800">
                              {level ? level.replace('-', ' ') : 'N/A'}
                          </div>
                      </div>
                      );
                  })}
              </div>
           </div>

           {/* History Log */}
           <Card title={`${activeSource === 'OFFLINE' ? 'Classroom' : 'Learning Hub'} Assessment History`}>
              <div className="space-y-4">
                  {filteredList.length === 0 && (
                      <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                         <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                         <p className="italic">No results found for {activeSource.toLowerCase()} learning.</p>
                      </div>
                  )}
                  
                  {filteredList.map((exam, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border border-gray-100 hover:border-teal-200 transition-colors shadow-sm">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                                      {new Date(exam!.date).toLocaleDateString()}
                                  </span>
                                  <span className="text-[10px] font-bold text-teal-600 uppercase bg-teal-50 px-1.5 py-0.5 rounded">
                                      {exam!.type}
                                  </span>
                                  {exam!.skill && (
                                      <span className="text-[10px] font-bold text-gray-600 uppercase border px-1.5 py-0.5 rounded">
                                          {exam!.skill}
                                      </span>
                                  )}
                              </div>
                              <h4 className="font-bold text-gray-900 text-base">{exam!.topic}</h4>
                              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                  <span className="font-semibold">Feedback:</span> "{exam!.feedback}"
                              </p>
                          </div>

                          <div className="flex items-center gap-6 border-l pl-6 border-gray-100 min-w-[140px]">
                              <div className="text-center">
                                  <div className={`text-xl font-bold ${exam!.score && exam!.score >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                                      {exam!.score ?? '-'}
                                  </div>
                                  <div className="text-[10px] text-gray-400 uppercase font-bold">Score</div>
                              </div>
                              {exam!.placement && (
                                  <div className="text-center">
                                      <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${LEVEL_COLORS[exam!.placement]}`}>
                                          {exam!.placement}
                                      </div>
                                      <div className="text-[10px] text-gray-400 uppercase font-bold mt-1">Placement</div>
                                  </div>
                              )}
                          </div>
                      </div>
                      </div>
                  ))}
              </div>
           </Card>
       </div>
    </div>
  );
};
