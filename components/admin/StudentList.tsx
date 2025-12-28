
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MOCK_USERS, MOCK_STUDENTS_OF_THE_MONTH } from '../../constants';
import { UserRole, SkillCategory, DifficultyLevel, StudentOfTheMonth, User as UserType } from '../../types';
import { Mail, Award, Search, Star, ChevronRight, X, Save, TrendingUp, Calendar, Trash2, List as ListIcon, Eye, Plus, User as UserIcon, History, Phone, ShieldAlert, School, MapPin, CheckCircle, Smartphone, Home } from 'lucide-react';

export const StudentList: React.FC = () => {
  const allUsers = MOCK_USERS;
  const students = allUsers.filter(u => u.role === UserRole.STUDENT);
  
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'hall-of-fame'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [somList, setSomList] = useState<StudentOfTheMonth[]>(MOCK_STUDENTS_OF_THE_MONTH);
  
  // Modals State
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, type: 'SOM' | 'STUDENT', id: string, name: string }>({
    isOpen: false,
    type: 'SOM',
    id: '',
    name: ''
  });
  
  // Nominate Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [achievement, setAchievement] = useState('');
  const [monthYear, setMonthYear] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDisplayLevel = (student: any) => {
    if (student.skillLevels && student.skillLevels[SkillCategory.GRAMMAR]) {
      return student.skillLevels[SkillCategory.GRAMMAR];
    }
    return DifficultyLevel.STARTER;
  };

  const findLinkedParent = (studentId: string) => {
    return allUsers.find(u => u.role === UserRole.PARENT && u.linkedStudentId === studentId);
  };

  const handleOpenNominate = () => {
    setSelectedStudentId('');
    setAchievement('');
    setMonthYear(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
    setIsNominateModalOpen(true);
  };

  const handleSaveNomination = () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student || !achievement || !monthYear) return;

    const newSOM: StudentOfTheMonth = {
      id: 'som' + Date.now(),
      name: student.name,
      achievement,
      monthYear,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=2563eb&color=fff&size=200`
    };

    setSomList([newSOM, ...somList]); 
    setIsNominateModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteConfirm.type === 'SOM') {
        setSomList(prev => prev.filter(s => s.id !== deleteConfirm.id));
    }
    setDeleteConfirm({ ...deleteConfirm, isOpen: false });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-600" /> Manajemen Siswa
          </h2>
          <p className="text-xs text-gray-500">Kelola direktori siswa dan Hall of Fame.</p>
        </div>

        <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
           <button
             onClick={() => setActiveSubTab('directory')}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeSubTab === 'directory' ? 'theme-bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <ListIcon className="w-3 h-3" /> Direktori
           </button>
           <button
             onClick={() => setActiveSubTab('hall-of-fame')}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeSubTab === 'hall-of-fame' ? 'theme-bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <Award className="w-3 h-3" /> Hall of Fame
           </button>
        </div>
      </div>

      {activeSubTab === 'hall-of-fame' ? (
        <div className="space-y-4 animate-in fade-in duration-300">
           <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" /> Active Winners
                 </h3>
                 <Button onClick={handleOpenNominate} className="text-xs py-1.5 px-3">
                    Add
                 </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                 {somList.slice(0, 3).map((som) => (
                   <Card key={som.id} className="relative group border-blue-100 bg-gradient-to-br from-white to-blue-50/20 overflow-hidden !p-3 transition-all hover:shadow-md">
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, type: 'SOM', id: som.id, name: som.name })}
                        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all z-10 opacity-0 group-hover:opacity-100"
                        title="Remove SOM"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-3 relative z-0">
                         <div className="relative">
                            <img src={som.image} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm object-cover" alt="" />
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-0.5 rounded shadow-sm border border-white">
                               <Award className="w-2 h-2" />
                            </div>
                         </div>
                         <div className="min-w-0">
                            <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">{som.monthYear}</p>
                            <h4 className="text-xs font-bold text-gray-900 truncate">{som.name}</h4>
                         </div>
                      </div>
                      <p className="mt-2 text-[10px] text-gray-600 italic line-clamp-2 leading-relaxed border-t border-blue-50 pt-2">
                         "{som.achievement}"
                      </p>
                   </Card>
                 ))}
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Cari siswa..."
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 transition-all text-xs"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-right">
                <span className="text-[9px] font-bold text-blue-400 uppercase block">Total</span>
                <span className="text-xs font-bold text-blue-900">{students.length} Siswa</span>
             </div>
          </div>

          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-3 py-2">Siswa</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2">Cabang</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg theme-bg-primary text-white flex items-center justify-center font-bold text-[10px]">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{student.name}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          student.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {getDisplayLevel(student)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                         <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{student.branch || 'Online'}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-all"
                          title="Lihat Detail"
                        >
                           <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-gray-400 text-xs italic">
                        Tidak ada siswa ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* --- MODAL: STUDENT & PARENT DETAIL (REFINED) --- */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden relative border border-gray-100 animate-in zoom-in-95 duration-200">
              <div className="absolute top-4 right-4">
                <button onClick={() => setSelectedStudent(null)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                 {/* Compact Header */}
                 <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <div className="w-12 h-12 theme-bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md border-2 border-white">
                        {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                       <h3 className="text-base font-black text-gray-900 leading-tight">{selectedStudent.name}</h3>
                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                          Profil Akun Siswa
                       </p>
                    </div>
                 </div>

                 {/* Detail Content Grid */}
                 <div className="space-y-6">
                    {/* Student Data Section */}
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5" /> Informasi Siswa
                       </h4>
                       <div className="grid grid-cols-1 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <div className="flex justify-between text-xs items-center">
                             <span className="text-gray-400 font-bold uppercase text-[9px]">Email</span>
                             <span className="text-gray-900 font-bold truncate ml-4">{selectedStudent.email}</span>
                          </div>
                          <div className="flex justify-between text-xs items-center">
                             <span className="text-gray-400 font-bold uppercase text-[9px]">Telepon</span>
                             <span className="text-gray-900 font-bold flex items-center gap-1"><Smartphone className="w-3 h-3 text-blue-500" /> {selectedStudent.phone || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs items-center">
                             <span className="text-gray-400 font-bold uppercase text-[9px]">Cabang</span>
                             <span className="text-gray-900 font-bold">{selectedStudent.branch || 'Online'}</span>
                          </div>
                          <div className="flex justify-between text-xs items-center">
                             <span className="text-gray-400 font-bold uppercase text-[9px]">Sekolah</span>
                             <span className="text-gray-900 font-bold">{selectedStudent.schoolOrigin || '-'}</span>
                          </div>
                       </div>
                    </div>

                    {/* Parent Data Section */}
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.15em] flex items-center gap-2">
                          <History className="w-3.5 h-3.5" /> Data Orang Tua
                       </h4>
                       {(() => {
                          const parent = findLinkedParent(selectedStudent.id);
                          if (!parent) return (
                             <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-500" />
                                <p className="text-[10px] text-red-700 font-bold">Tidak ada akun orang tua yang terhubung.</p>
                             </div>
                          );
                          return (
                             <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 space-y-3">
                                <div className="flex justify-between text-xs items-center">
                                   <span className="text-teal-600 font-bold uppercase text-[9px]">Nama Parent</span>
                                   <span className="text-gray-900 font-black">{parent.name}</span>
                                </div>
                                <div className="flex justify-between text-xs items-center">
                                   <span className="text-teal-600 font-bold uppercase text-[9px]">Email Parent</span>
                                   <span className="text-gray-900 font-bold truncate ml-4">{parent.email}</span>
                                </div>
                                <div className="flex justify-between text-xs items-center">
                                   <span className="text-teal-600 font-bold uppercase text-[9px]">WhatsApp</span>
                                   <span className="text-gray-900 font-bold flex items-center gap-1"><Smartphone className="w-3 h-3 text-green-500" /> {parent.phone || '-'}</span>
                                </div>
                                <div className="space-y-1">
                                   <span className="text-teal-600 font-bold uppercase text-[9px]">Alamat Rumah</span>
                                   <p className="text-[11px] text-gray-800 font-medium leading-relaxed bg-white/50 p-2 rounded-lg border border-teal-100/50">
                                      {parent.address || 'Alamat tidak diisi.'}
                                   </p>
                                </div>
                             </div>
                          );
                       })()}
                    </div>
                 </div>

                 {/* Actions */}
                 <div className="pt-2">
                    <Button onClick={() => setSelectedStudent(null)} className="w-full h-11 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md">Tutup Detail</Button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL: NOMINATE SOM (COMPACT) --- */}
      {isNominateModalOpen && (
         <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden relative border border-gray-100 animate-in zoom-in-95 duration-200">
               <div className="absolute top-4 right-4">
                  <button onClick={() => setIsNominateModalOpen(false)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
               </div>
               <div className="p-6 space-y-6">
                  <div className="text-center space-y-2">
                     <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-4 border-white transform rotate-3"><Award className="w-7 h-7" /></div>
                     <h3 className="text-xl font-black text-gray-900 leading-tight">Student of the Month</h3>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Siswa</label>
                        <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                           <option value="">-- Pilih Siswa --</option>
                           {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Periode Pencapaian</label>
                        <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={monthYear} onChange={e => setMonthYear(e.target.value)} placeholder="e.g. November 2024" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                        <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px] text-xs leading-relaxed" value={achievement} onChange={e => setAchievement(e.target.value)} placeholder="Sebutkan alasan atau progres akademik..." />
                     </div>
                  </div>
                  <div className="pt-2">
                     <Button onClick={handleSaveNomination} disabled={!selectedStudentId || !achievement || !monthYear} className="w-full h-12 rounded-xl font-black uppercase text-[10px] shadow-xl shadow-blue-500/20">Simpan & Publikasi</Button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* --- MODAL: GLOBAL DELETE CONFIRMATION (COMPACT) --- */}
      {deleteConfirm.isOpen && (
         <div className="fixed inset-0 z-[200] overflow-y-auto bg-red-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden border-2 border-red-50 animate-in zoom-in-95 duration-200">
               <div className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                     <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Konfirmasi Hapus</h3>
                     <p className="text-xs text-gray-500 font-medium">Apakah Anda yakin ingin menghapus data dari <span className="font-bold text-gray-800">"{deleteConfirm.name}"</span>?</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button onClick={() => setDeleteConfirm({...deleteConfirm, isOpen: false})} className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-[10px] uppercase transition-all">Batal</button>
                     <button onClick={confirmDelete} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-red-200 transition-all">Ya, Hapus Data</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
