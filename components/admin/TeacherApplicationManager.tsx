
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  Briefcase, Search, Filter, CheckCircle, XCircle, Clock,
  Eye, FileText, Download, User as UserIcon, Globe, MapPin,
  Calendar, Award, Flag, ChevronRight, X, Mail, Phone, UserPlus, ShieldCheck, CalendarDays, Loader2
} from 'lucide-react';
import { useTeacherApplications } from '../../hooks/useContent';
import { TeacherApplication, ApplicationStatus } from '../../types';

export const TeacherApplicationManager: React.FC = () => {
  const { applications: appsData, loading, error, updateStatus: updateAppStatus, markAsConverted } = useTeacherApplications();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'local' | 'native'>('all');
  const [selectedApp, setSelectedApp] = useState<TeacherApplication | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Map database format to component format
  const applications: TeacherApplication[] = appsData.map(app => ({
    id: app.id,
    name: app.name,
    email: app.email,
    phone: app.phone || '',
    country: app.country,
    dob: app.dob,
    type: app.type as 'local' | 'native',
    experience: app.experience,
    motivation: app.motivation,
    hasDegree: app.has_degree,
    salary: app.salary,
    photoUrl: app.photo_url || undefined,
    status: app.status as ApplicationStatus,
    isConverted: app.is_converted,
    daysPerWeek: app.days_per_week || undefined,
    hoursPerWeek: app.hours_per_week || undefined,
  }));

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || app.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const updateStatus = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateAppStatus(id, newStatus);
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    }
  };

  const handleConvertToAccount = async (app: TeacherApplication) => {
    setIsConverting(true);
    try {
      await markAsConverted(app.id);
      await updateAppStatus(app.id, ApplicationStatus.ACCEPTED);
      if (selectedApp?.id === app.id) {
        setSelectedApp({ ...selectedApp, isConverted: true, status: ApplicationStatus.ACCEPTED });
      }
      alert(`Account for ${app.name} has been created successfully! They can now log in using their email.`);
    } catch (err) {
      console.error('Error converting to account:', err);
      alert('Failed to create account.');
    } finally {
      setIsConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading applications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading applications: {error.message}
      </div>
    );
  }

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" /> Pending</span>;
      case ApplicationStatus.REVIEWED:
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Eye className="w-3 h-3" /> Reviewed</span>;
      case ApplicationStatus.INTERVIEWING:
        return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Interview</span>;
      case ApplicationStatus.ACCEPTED:
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Accepted</span>;
      case ApplicationStatus.REJECTED:
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><XCircle className="w-3 h-3" /> Rejected</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" /> Instructor Applications
          </h2>
          <p className="text-gray-500">Review and manage candidates for teaching positions.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
           <button 
             onClick={() => setTypeFilter('all')}
             className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${typeFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             All
           </button>
           <button 
             onClick={() => setTypeFilter('local')}
             className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${typeFilter === 'local' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Local
           </button>
           <button 
             onClick={() => setTypeFilter('native')}
             className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${typeFilter === 'native' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Native
           </button>
        </div>
      </div>

      <div className="flex gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search candidate name..." 
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApps.map(app => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       {app.photoUrl ? (
                          <img src={app.photoUrl} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                       ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><UserIcon className="w-5 h-5" /></div>
                       )}
                       <div>
                          <div className="text-sm font-bold text-gray-900">{app.name}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">{app.country}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${app.type === 'native' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                       {app.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="px-6 py-4">
                    {app.isConverted ? (
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase">
                            <ShieldCheck className="w-3.5 h-3.5" /> Created
                        </div>
                    ) : (
                        <span className="text-gray-300 font-bold text-[10px] uppercase italic tracking-tighter">No Account</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedApp(app)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No applications found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
              <button 
                 onClick={() => setSelectedApp(null)}
                 className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 z-50 transition-colors"
              >
                 <X className="w-6 h-6" />
              </button>

              <div className="overflow-y-auto p-8 md:p-12">
                 <div className="flex flex-col md:flex-row gap-10">
                    <div className="w-full md:w-1/3 space-y-6">
                       <div className="aspect-square rounded-[32px] overflow-hidden border-4 border-white shadow-xl bg-gray-100">
                          {selectedApp.photoUrl ? (
                             <img src={selectedApp.photoUrl} className="w-full h-full object-cover" alt={selectedApp.name} />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-300"><UserIcon className="w-20 h-20" /></div>
                          )}
                       </div>
                       <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Current Status</p>
                             {getStatusBadge(selectedApp.status)}
                          </div>
                          <div className="space-y-2">
                             <Button onClick={() => updateStatus(selectedApp.id, ApplicationStatus.REVIEWED)} variant="outline" className="w-full text-xs font-black uppercase">Mark as Reviewed</Button>
                             <Button onClick={() => updateStatus(selectedApp.id, ApplicationStatus.INTERVIEWING)} variant="outline" className="w-full text-xs font-black uppercase border-purple-200 text-purple-600 hover:bg-purple-50">Schedule Interview</Button>
                             
                             <div className="pt-2 border-t border-gray-100 mt-2">
                                {selectedApp.isConverted ? (
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                                        <p className="text-xs font-black text-green-700 uppercase tracking-widest">Instructor Active</p>
                                        <p className="text-[10px] text-green-600 mt-1">Account already created.</p>
                                    </div>
                                ) : (
                                    <Button 
                                        onClick={() => handleConvertToAccount(selectedApp)} 
                                        isLoading={isConverting}
                                        disabled={selectedApp.status !== ApplicationStatus.ACCEPTED && selectedApp.status !== ApplicationStatus.REVIEWED && selectedApp.status !== ApplicationStatus.INTERVIEWING}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="w-4 h-4" /> Create Account
                                    </Button>
                                )}
                             </div>

                             <div className="grid grid-cols-2 gap-2 mt-4">
                                <Button onClick={() => updateStatus(selectedApp.id, ApplicationStatus.ACCEPTED)} className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase">Accept</Button>
                                <Button onClick={() => updateStatus(selectedApp.id, ApplicationStatus.REJECTED)} className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase">Reject</Button>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex-1 space-y-8">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2">
                             <h3 className="text-3xl font-black text-gray-900">{selectedApp.name}</h3>
                             <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${selectedApp.type === 'native' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>{selectedApp.type}</span>
                          </div>
                          <p className="text-gray-500 font-medium flex items-center gap-2"><Globe className="w-4 h-4" /> {selectedApp.country} • Born {selectedApp.dob}</p>
                       </div>

                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Experience</p>
                             <p className="text-lg font-bold text-gray-900">{selectedApp.experience} Years</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Salary Req.</p>
                             <p className="text-lg font-bold text-blue-600">${selectedApp.salary}/mo</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Degree</p>
                             <p className="text-lg font-bold text-gray-900">{selectedApp.hasDegree ? 'Bachelor' : 'No Degree'}</p>
                          </div>
                       </div>

                       {/* Teaching Availability */}
                       <div className="space-y-3">
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                             <CalendarDays className="w-4 h-4 text-teal-600" /> Ketersediaan Mengajar
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Hari per Minggu</p>
                                <p className="text-lg font-bold text-teal-900">{selectedApp.daysPerWeek || '-'} Hari</p>
                             </div>
                             <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Jam per Minggu</p>
                                <p className="text-lg font-bold text-teal-900">{selectedApp.hoursPerWeek || '-'} Jam</p>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Motivation & Background</h4>
                          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-gray-600 leading-relaxed text-sm italic">
                             "{selectedApp.motivation}"
                          </div>
                       </div>

                       <div className="space-y-3">
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Submitted Verification</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <div className="flex items-center justify-between p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-white hover:border-blue-400 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform"><Download className="w-5 h-5" /></div>
                                   <span className="text-xs font-bold text-gray-700">Police Check.pdf</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                             </div>
                             <div className="flex items-center justify-between p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-white hover:border-blue-400 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform"><Download className="w-5 h-5" /></div>
                                   <span className="text-xs font-bold text-gray-700">Degree Cert.pdf</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
