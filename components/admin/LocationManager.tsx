
import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MapPin, Plus, Trash2, Building, ShieldAlert, Loader2, GraduationCap, X, Users, Edit2 } from 'lucide-react';
import { useLocations } from '../../hooks/useProfiles';
import { supabase } from '../../lib/supabase';

type SchoolLevel = 'KINDERGARTEN' | 'PRIMARY' | 'JUNIOR' | 'SENIOR' | '';

const SCHOOL_LEVELS: { value: SchoolLevel; label: string; description: string }[] = [
  { value: '', label: 'Pilih Level', description: '' },
  { value: 'KINDERGARTEN', label: 'TK / Kindergarten', description: 'TK-A, TK-B' },
  { value: 'PRIMARY', label: 'SD / Primary', description: 'Kelas 1-6' },
  { value: 'JUNIOR', label: 'SMP / Junior High', description: 'Kelas 7-9' },
  { value: 'SENIOR', label: 'SMA / Senior High', description: 'Kelas 10-12' },
];

interface LocationDetail {
  id: string;
  name: string;
  address: string;
  level: string | null;
  studentCount: number;
}

export const LocationManager: React.FC = () => {
  const { locations, loading, error, createLocation, deleteLocation, updateLocation } = useLocations();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [level, setLevel] = useState<SchoolLevel>('');

  const resetForm = () => {
    setName('');
    setAddress('');
    setLevel('');
    setEditingId(null);
  };

  const openLocationDetail = async (loc: any) => {
    setLoadingDetail(true);
    try {
      // Count students assigned to this location
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'STUDENT')
        .eq('assigned_location_id', loc.id);

      setSelectedLocation({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        level: loc.level,
        studentCount: count || 0
      });
    } catch (err) {
      console.error('Error fetching student count:', err);
      setSelectedLocation({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        level: loc.level,
        studentCount: 0
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteFromDetail = async () => {
    if (!selectedLocation) return;
    setIsSubmitting(true);
    try {
      await deleteLocation(selectedLocation.id);
      setSelectedLocation(null);
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Failed to delete location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
        capacity: 0,
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
    setLevel(loc.level || '');
    setIsAdding(true);
    setSelectedLocation(null);
    setIsEditingInModal(false);
  };

  const handleEditInModal = () => {
    if (!selectedLocation) return;
    setEditingId(selectedLocation.id);
    setName(selectedLocation.name);
    setAddress(selectedLocation.address);
    setLevel((selectedLocation.level as SchoolLevel) || '');
    setIsEditingInModal(true);
  };

  const handleUpdateInModal = async (e: React.FormEvent) => {
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
        capacity: 0,
        level: level || null
      });
      // Update selected location with new data
      setSelectedLocation({
        ...selectedLocation!,
        name,
        address,
        level
      });
      setIsEditingInModal(false);
      resetForm();
    } catch (err) {
      console.error('Error updating location:', err);
      alert('Failed to update location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEditInModal = () => {
    setIsEditingInModal(false);
    resetForm();
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
        capacity: 0,
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
                     <label className="text-[9px] font-black text-gray-400 uppercase">Nama Sekolah</label>
                     <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none" placeholder="e.g. SD Petra 1" />
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
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Alamat</label>
                  <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none" placeholder="e.g. Jl. Siwalankerto No. 121-131" />
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
              <div
                key={loc.id}
                onClick={() => openLocationDetail(loc)}
                className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
              >
                 <div className="flex items-start gap-2">
                    <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
                       <Building className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h3 className="text-xs font-bold text-gray-900 truncate">{loc.name}</h3>
                       <p className="text-[10px] text-gray-500 truncate">{loc.address}</p>
                       <div className="flex items-center gap-2 mt-1">
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
              </div>
            );
         })}
      </div>

      {/* --- MODAL: LOCATION DETAIL --- */}
      {selectedLocation && (
         <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
               {/* Header */}
               <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                           <Building className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="font-bold text-lg">
                             {isEditingInModal ? 'Edit Sekolah' : selectedLocation.name}
                           </h3>
                           {!isEditingInModal && (
                             <p className="text-orange-100 text-xs">{selectedLocation.address}</p>
                           )}
                        </div>
                     </div>
                     <button
                        onClick={() => {
                          setSelectedLocation(null);
                          setIsEditingInModal(false);
                          setShowDeleteConfirm(false);
                          resetForm();
                        }}
                        className="text-white/80 hover:text-white transition-colors p-1"
                     >
                        <X className="w-5 h-5" />
                     </button>
                  </div>
               </div>

               {/* Content */}
               <div className="p-4 space-y-4">
                  {/* DELETE CONFIRMATION VIEW */}
                  {showDeleteConfirm ? (
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ShieldAlert className="w-6 h-6 text-red-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">Hapus Sekolah?</h4>
                        <p className="text-xs text-gray-500">
                          Apakah Anda yakin ingin menghapus <span className="font-bold text-gray-700">"{selectedLocation.name}"</span>?
                          Tindakan ini tidak dapat dibatalkan.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs transition-all"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleDeleteFromDetail}
                          disabled={isSubmitting}
                          className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                      </div>
                    </div>
                  ) : isEditingInModal ? (
                    /* EDIT FORM VIEW */
                    <form onSubmit={handleUpdateInModal} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Nama Sekolah</label>
                        <input
                          required
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder="e.g. SD Petra 1"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Level Sekolah <span className="text-red-500">*</span></label>
                        <select
                          required
                          value={level}
                          onChange={e => setLevel(e.target.value as SchoolLevel)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                        >
                          {SCHOOL_LEVELS.map(sl => (
                            <option key={sl.value} value={sl.value}>
                              {sl.label} {sl.description && `(${sl.description})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Alamat</label>
                        <input
                          required
                          type="text"
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder="e.g. Jl. Siwalankerto No. 121-131"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={cancelEditInModal}
                          className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs transition-all"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* DEFAULT DETAIL VIEW */
                    <>
                      {/* Level Badge */}
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">Level:</span>
                        {selectedLocation.level ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            selectedLocation.level === 'KINDERGARTEN' ? 'bg-pink-100 text-pink-700' :
                            selectedLocation.level === 'PRIMARY' ? 'bg-green-100 text-green-700' :
                            selectedLocation.level === 'JUNIOR' ? 'bg-blue-100 text-blue-700' :
                            selectedLocation.level === 'SENIOR' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {SCHOOL_LEVELS.find(sl => sl.value === selectedLocation.level)?.label || selectedLocation.level}
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                            Belum diatur
                          </span>
                        )}
                      </div>

                      {/* Student Count */}
                      <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Jumlah Siswa Terdaftar</p>
                          <p className="text-xl font-black text-gray-900">{selectedLocation.studentCount} <span className="text-sm font-normal text-gray-500">siswa</span></p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleEditInModal}
                          className="flex-1 h-11 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit Sekolah
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={selectedLocation.studentCount > 0}
                          className="flex-1 h-11 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title={selectedLocation.studentCount > 0 ? 'Tidak bisa dihapus karena masih ada siswa terdaftar' : 'Hapus sekolah'}
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus Sekolah
                        </button>
                      </div>
                      {selectedLocation.studentCount > 0 && (
                        <p className="text-[10px] text-red-500 text-center">
                          * Sekolah tidak bisa dihapus karena masih ada {selectedLocation.studentCount} siswa terdaftar
                        </p>
                      )}
                    </>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
