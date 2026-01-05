
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MapPin, Plus, Trash2, Building, ShieldAlert, Loader2, GraduationCap } from 'lucide-react';
import { useLocations } from '../../hooks/useProfiles';

type SchoolLevel = 'KINDERGARTEN' | 'PRIMARY' | 'JUNIOR' | 'SENIOR' | '';

const SCHOOL_LEVELS: { value: SchoolLevel; label: string; description: string }[] = [
  { value: '', label: 'Pilih Level', description: '' },
  { value: 'KINDERGARTEN', label: 'TK / Kindergarten', description: 'TK-A, TK-B' },
  { value: 'PRIMARY', label: 'SD / Primary', description: 'Kelas 1-6' },
  { value: 'JUNIOR', label: 'SMP / Junior High', description: 'Kelas 7-9' },
  { value: 'SENIOR', label: 'SMA / Senior High', description: 'Kelas 10-12' },
];

export const LocationManager: React.FC = () => {
  const { locations, loading, error, createLocation, deleteLocation, updateLocation } = useLocations();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string, name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [level, setLevel] = useState<SchoolLevel>('');

  const resetForm = () => {
    setName('');
    setAddress('');
    setCapacity('');
    setLevel('');
    setEditingId(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!level) {
      alert('Silakan pilih level sekolah!');
      return;
    }
    setIsSubmitting(true);
    try {
      await createLocation({
        name,
        address,
        capacity: Number(capacity),
        level: level || null
      });
      setIsAdding(false);
      resetForm();
    } catch (err) {
      console.error('Error creating location:', err);
      alert('Failed to create location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (loc: any) => {
    setEditingId(loc.id);
    setName(loc.name);
    setAddress(loc.address);
    setCapacity(String(loc.capacity));
    setLevel(loc.level || '');
    setIsAdding(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !level) {
      alert('Silakan pilih level sekolah!');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateLocation(editingId, {
        name,
        address,
        capacity: Number(capacity),
        level: level || null
      });
      setIsAdding(false);
      resetForm();
    } catch (err) {
      console.error('Error updating location:', err);
      alert('Failed to update location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteLocation(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Failed to delete location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading locations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading locations: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
               <MapPin className="w-5 h-5 text-orange-600" /> Location Presets
            </h2>
            <p className="text-xs text-gray-500">Manage classrooms and venues for scheduling.</p>
         </div>
         <Button onClick={() => { if (isAdding) { resetForm(); } setIsAdding(!isAdding); }} className="text-xs py-1.5 px-3">
            {isAdding ? 'Cancel' : 'Add Location'}
         </Button>
      </div>

      {isAdding && (
         <Card className="!p-4">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">
              {editingId ? 'Edit Location' : 'Add New Location'}
            </h3>
            <form onSubmit={editingId ? handleUpdate : handleAdd} className="space-y-3">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase">Location Name</label>
                     <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none" placeholder="e.g. SD Petra 1" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase">Capacity</label>
                     <input required type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none" placeholder="e.g. 500" />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase">Address / Description</label>
                     <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none" placeholder="e.g. Jl. Siwalankerto No. 121-131" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase">Level Sekolah <span className="text-red-500">*</span></label>
                     <select
                       required
                       value={level}
                       onChange={e => setLevel(e.target.value as SchoolLevel)}
                       className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none bg-white"
                     >
                       {SCHOOL_LEVELS.map(sl => (
                         <option key={sl.value} value={sl.value}>
                           {sl.label} {sl.description && `(${sl.description})`}
                         </option>
                       ))}
                     </select>
                  </div>
               </div>
               {level && (
                 <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700">
                   <GraduationCap className="w-4 h-4 inline mr-1" />
                   <strong>{SCHOOL_LEVELS.find(sl => sl.value === level)?.label}</strong>: Kelas yang tersedia adalah{' '}
                   <span className="font-bold">{SCHOOL_LEVELS.find(sl => sl.value === level)?.description}</span>
                 </div>
               )}
               <div className="flex justify-end gap-2">
                  {editingId && (
                    <Button type="button" variant="outline" onClick={() => { resetForm(); setIsAdding(false); }} className="text-xs py-1.5 px-3">
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting} className="text-xs py-1.5 px-3">
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Location' : 'Save Location')}
                  </Button>
               </div>
            </form>
         </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
         {locations.map(loc => {
            const levelInfo = SCHOOL_LEVELS.find(sl => sl.value === loc.level);
            return (
              <div key={loc.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm group hover:border-orange-300 transition-colors">
                 <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2 flex-1">
                       <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
                          <Building className="w-4 h-4" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-gray-900 truncate">{loc.name}</h3>
                          <p className="text-[10px] text-gray-500 truncate">{loc.address}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[9px] text-gray-400">Cap: {loc.capacity}</span>
                             {levelInfo ? (
                               <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                 loc.level === 'KINDERGARTEN' ? 'bg-pink-100 text-pink-700' :
                                 loc.level === 'PRIMARY' ? 'bg-green-100 text-green-700' :
                                 loc.level === 'JUNIOR' ? 'bg-blue-100 text-blue-700' :
                                 loc.level === 'SENIOR' ? 'bg-purple-100 text-purple-700' :
                                 'bg-gray-100 text-gray-600'
                               }`}>
                                 {levelInfo.label}
                               </span>
                             ) : (
                               <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                                 No Level
                               </span>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button
                          onClick={() => handleEdit(loc)}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded"
                          title="Edit Location"
                       >
                          <MapPin className="w-3.5 h-3.5" />
                       </button>
                       <button
                          onClick={() => setDeleteConfirm({ isOpen: true, id: loc.id, name: loc.name })}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded"
                          title="Delete Location"
                       >
                          <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </div>
              </div>
            );
         })}
      </div>

      {/* --- MODAL: GLOBAL DELETE CONFIRMATION --- */}
      {deleteConfirm.isOpen && (
         <div className="fixed inset-0 z-[200] overflow-y-auto bg-red-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden border-2 border-red-50 animate-in zoom-in-95 duration-200">
               <div className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                     <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Hapus Lokasi</h3>
                     <p className="text-xs text-gray-500 font-medium">Hapus lokasi <span className="font-bold text-gray-800">"{deleteConfirm.name}"</span>? Seluruh jadwal yang menggunakan lokasi ini mungkin terpengaruh.</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button onClick={() => setDeleteConfirm({...deleteConfirm, isOpen: false})} className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-[10px] uppercase transition-all">Batal</button>
                     <button onClick={confirmDelete} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-red-200 transition-all">Hapus Lokasi</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
