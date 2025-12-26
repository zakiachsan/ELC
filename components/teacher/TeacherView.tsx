
import React from 'react';
import { Card } from '../Card';
import { MOCK_SESSIONS, MOCK_USERS, LEVEL_COLORS } from '../../constants';
import { UserRole, SkillCategory } from '../../types';
import { Calendar, AlertCircle, TrendingUp, Clock, MapPin, ChevronRight, ClipboardList, CheckCircle } from 'lucide-react';
import { SKILL_ICONS } from '../student/StudentView';
import { useLanguage } from '../../contexts/LanguageContext';

interface TeacherViewProps {
  onNavigate: (view: string) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const now = new Date();
  
  // 1. TODAY'S SCHEDULE LOGIC
  const todaySessions = MOCK_SESSIONS.filter(s => {
    const d = new Date(s.dateTime);
    return d.getDate() === now.getDate() && 
           d.getMonth() === now.getMonth() && 
           d.getFullYear() === now.getFullYear();
  }).sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // 2. STUDENTS NEED ATTENTION LOGIC
  const studentsAtRisk = MOCK_USERS.filter(u => u.role === UserRole.STUDENT && u.needsAttention).map(u => {
    // Mocking specific reasons for display purposes
    const reasons = [
        "Absent 3x in a row",
        "Grammar score dropped 15%",
        "Incomplete homework assignments",
        "Placement test failed twice"
    ];
    return {
        ...u,
        reason: reasons[Math.floor(Math.random() * reasons.length)]
    };
  });

  // 3. STATS LOGIC
  const pendingTasks = MOCK_SESSIONS.filter(s => {
    return new Date(s.dateTime) < now && (!s.description || s.description.length < 10);
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.tc_dashboard_title}</h2>
            <p className="text-gray-500 text-sm">{t.tc_dashboard_desc}</p>
         </div>
         <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
         </p>
       </div>

       {/* TOP STATS ROW */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                 <TrendingUp className="w-6 h-6" />
               </div>
               <div>
                 <div className="text-gray-500 text-xs font-bold uppercase tracking-wide">{t.tc_avg_att}</div>
                 <div className="text-2xl font-bold text-gray-900 mt-1">94%</div>
               </div>
             </div>
             <CheckCircle className="w-12 h-12 text-blue-50 opacity-50" />
           </div>
         </Card>

         <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600">
                 <ClipboardList className="w-6 h-6" />
               </div>
               <div>
                 <div className="text-gray-500 text-xs font-bold uppercase tracking-wide">{t.tc_pending_tasks}</div>
                 <div className="text-2xl font-bold text-gray-900 mt-1">{pendingTasks} <span className="text-sm font-medium text-gray-400">{t.tc_items}</span></div>
               </div>
             </div>
             <div className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded font-bold">
                Action Needed
             </div>
           </div>
         </Card>
       </div>

       {/* MAIN CONTENT GRID */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* LEFT: TODAY'S SCHEDULE (2/3 Width) */}
         <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" /> {t.tc_today_schedule}
            </h3>
            
            {todaySessions.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <p className="text-gray-400">{t.tc_no_classes}</p>
                    <button 
                        onClick={() => onNavigate('schedule')}
                        className="text-blue-600 text-sm font-bold mt-2 hover:underline"
                    >
                        {t.tc_view_upcoming}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {todaySessions.map(session => {
                        const Icon = SKILL_ICONS[session.skillCategory];
                        return (
                            <div 
                                key={session.id} 
                                onClick={() => onNavigate('schedule')}
                                className="group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                            >
                                {/* Time Column */}
                                <div className="min-w-[80px] text-center sm:text-left">
                                    <div className="text-lg font-bold text-gray-900">
                                        {new Date(session.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium uppercase">{t.tc_start}</div>
                                </div>

                                {/* Divider */}
                                <div className="hidden sm:block w-px h-10 bg-gray-100"></div>

                                {/* Info Column */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${LEVEL_COLORS[session.difficultyLevel]}`}>
                                            {session.difficultyLevel}
                                        </span>
                                        <span className="text-[10px] font-bold bg-gray-800 text-white px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                            <Icon className="w-3 h-3" /> {session.skillCategory}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{session.topic}</h4>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {session.location}
                                    </div>
                                </div>

                                {/* Action Icon */}
                                <div className="bg-gray-50 p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
         </div>

         {/* RIGHT: STUDENTS NEED ATTENTION (1/3 Width) */}
         <div className="space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" /> {t.tc_needs_attention}
            </h3>
            
            <Card className="p-0 overflow-hidden border-red-100">
                <div className="divide-y divide-gray-100">
                    {studentsAtRisk.length === 0 && (
                        <div className="p-6 text-center text-sm text-gray-500">
                            {t.tc_no_flags}
                        </div>
                    )}
                    {studentsAtRisk.map(student => (
                        <div 
                            key={student.id} 
                            onClick={() => onNavigate('students')}
                            className="p-4 hover:bg-red-50/50 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                                    {student.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
                                    <p className="text-xs text-red-600 font-medium truncate">{student.reason}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                    <button onClick={() => onNavigate('students')} className="text-xs font-bold text-gray-500 hover:text-gray-800">
                        {t.tc_view_all_students}
                    </button>
                </div>
            </Card>
         </div>

       </div>
    </div>
  );
};
