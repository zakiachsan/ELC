
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MapPin, Plus, Trash2, Building, ShieldAlert, Loader2 } from 'lucide-react';
import { useLocations } from '../../hooks/useProfiles';

export const LocationManager: React.FC = () => {
  const { locations, loading, error, createLocation, deleteLocation } = useLocations();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string, name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createLocation({
        name,
        address,
        capacity: Number(capacity)
      });
      setIsAdding(false);
      setName(''); setAddress(''); setCapacity('');
    } catch (err) {
      console.error('Error creating location:', err);
      alert('Failed to create location. Please try again.');
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
         <Button onClick={() => setIsAdding(!isAdding)} className="text-xs py-1.5 px-3">
            {isAdding ? 'Cancel' : 'Add Location'}
         </Button>
      </div>

      {isAdding && (
         <Card className="!p-4">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Add New Location</h3>
            <form onSubmit={handleAdd} className="space-y-3">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase">Location Name</label>
                     <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none" placeholder="e.g. Room 101" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase">Capacity</label>
                     <input required type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none" placeholder="e.g. 20" />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Address / Description</label>
                  <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none" placeholder="e.g. Main Building, Floor 2" />
               </div>
               <div className="flex justify-end">
                  <Button type="submit" className="text-xs py-1.5 px-3">Save Location</Button>
               </div>
            </form>
         </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
         {locations.map(loc => (
            <div key={loc.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center group">
               <div className="flex items-start gap-2">
                  <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
                     <Building className="w-4 h-4" />
                  </div>
                  <div>
                     <h3 className="text-xs font-bold text-gray-900">{loc.name}</h3>
                     <p className="text-[10px] text-gray-500">{loc.address}</p>
                     <p className="text-[9px] text-gray-400 mt-0.5">Cap: {loc.capacity}</p>
                  </div>
               </div>
               <button
                  onClick={() => setDeleteConfirm({ isOpen: true, id: loc.id, name: loc.name })}
                  className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded"
                  title="Delete Location"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>
         ))}
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
