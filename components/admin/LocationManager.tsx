
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MapPin, Plus, Trash2, Building, ShieldAlert } from 'lucide-react';
import { MOCK_LOCATIONS } from '../../constants';
import { Location } from '../../types';

export const LocationManager: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string, name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  
  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newLoc: Location = {
        id: `loc${Date.now()}`,
        name,
        address,
        capacity: Number(capacity)
    };
    setLocations([...locations, newLoc]);
    setIsAdding(false);
    setName(''); setAddress(''); setCapacity('');
  };

  const confirmDelete = () => {
    setLocations(locations.filter(l => l.id !== deleteConfirm.id));
    setDeleteConfirm({ isOpen: false, id: '', name: '' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">Location Presets</h2>
            <p className="text-gray-500">Manage classrooms and venues for scheduling.</p>
         </div>
         <Button onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? 'Cancel' : 'Add Location'}
         </Button>
      </div>

      {isAdding && (
         <Card title="Add New Location">
            <form onSubmit={handleAdd} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700">Location Name</label>
                     <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 border rounded px-3 py-2" placeholder="e.g. Room 101" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700">Capacity</label>
                     <input required type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full mt-1 border rounded px-3 py-2" placeholder="e.g. 20" />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">Address / Description</label>
                  <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full mt-1 border rounded px-3 py-2" placeholder="e.g. Main Building, Floor 2" />
               </div>
               <div className="flex justify-end">
                  <Button type="submit">Save Location</Button>
               </div>
            </form>
         </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {locations.map(loc => (
            <div key={loc.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center group">
               <div className="flex items-start gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                     <Building className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="font-bold text-gray-900">{loc.name}</h3>
                     <p className="text-sm text-gray-500">{loc.address}</p>
                     <p className="text-xs text-gray-400 mt-1">Capacity: {loc.capacity} Students</p>
                  </div>
               </div>
               <button 
                  onClick={() => setDeleteConfirm({ isOpen: true, id: loc.id, name: loc.name })} 
                  className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg" 
                  title="Delete Location"
               >
                  <Trash2 className="w-5 h-5" />
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
