
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Calendar, Clock, User as UserIcon, BookOpen, MapPin } from 'lucide-react';
import { MOCK_USERS, MOCK_SESSIONS, MOCK_LOCATIONS, MOCK_COURSES } from '../../constants';
import { UserRole } from '../../types';

export const ScheduleManager: React.FC = () => {
  // State to toggle between List view (default) and Create view
  const [view, setView] = useState<'list' | 'create'>('list');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [location, setLocation] = useState('');
  const [teacherId, setTeacherId] = useState('');
  
  const [success, setSuccess] = useState(false);

  const teachers = MOCK_USERS.filter(u => u.role === UserRole.TEACHER);

  // Combine mock data with any local state if we were really adding them
  const allSessions = [...MOCK_SESSIONS].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate DB save
    console.log("Saving schedule:", { date, time, selectedCourseId, location, teacherId });
    
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      // Reset form
      setSelectedCourseId('');
      setLocation('');
      // Go back to list
      setView('list');
    }, 2000);
  };

  const getTeacherName = (id: string) => {
    return MOCK_USERS.find(u => u.id === id)?.name || 'Unknown Teacher';
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 space-y-8">
      
      {/* Header Section */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Schedule Management</h2>
          <p className="text-gray-500">Overview of all assigned classes and locations.</p>
        </div>
        
        {view === 'list' && (
          <Button onClick={() => setView('create')}>
            Add Schedule
          </Button>
        )}
        
        {view === 'create' && (
           <Button variant="outline" onClick={() => setView('list')}>
             Back to List
           </Button>
        )}
      </div>

      {view === 'list' ? (
        <Card title="Master Schedule">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                 <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                   <th className="px-4 py-3">Date/Time</th>
                   <th className="px-4 py-3">Category</th>
                   <th className="px-4 py-3">Topic</th>
                   <th className="px-4 py-3">Teacher</th>
                   <th className="px-4 py-3">Location</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allSessions.map(session => {
                  return (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{new Date(session.dateTime).toLocaleDateString()}</div>
                        <div className="text-gray-500 text-xs">{new Date(session.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                           {session.skillCategory}
                        </span>
                      </td>
                       <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {session.topic}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                              {getTeacherName(session.teacherId).charAt(0)}
                           </div>
                           {getTeacherName(session.teacherId)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" /> {session.location}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card title="Create New Class Session">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Time
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Course / Topic Preset
                  </label>
                  <select 
                     required
                     value={selectedCourseId}
                     onChange={(e) => setSelectedCourseId(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  >
                     <option value="">Select a course...</option>
                     {MOCK_COURSES.map(c => (
                        <option key={c.id} value={c.id}>
                           {c.title} ({c.skillCategory} - {c.defaultLevel})
                        </option>
                     ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Location Preset
                  </label>
                  <select
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  >
                     <option value="">Select a location...</option>
                     {MOCK_LOCATIONS.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name} (Cap: {loc.capacity})</option>
                     ))}
                  </select>
                </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> Assign Teacher
              </label>
              <select
                required
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select a teacher...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Teaches: {t.assignedSubjects?.join(', ') || 'General'})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit">
                Assign Schedule
              </Button>
            </div>
          </form>

          {success && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
              Schedule successfully created and assigned!
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
