
import React, { useState, useRef } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Award, Plus, Pencil, Trash2, Upload, ChevronLeft, Save, User as UserIcon } from 'lucide-react';
import { MOCK_STUDENTS_OF_THE_MONTH } from '../../constants';
import { StudentOfTheMonth } from '../../types';

export const StudentOfMonthManager: React.FC = () => {
  const [students, setStudents] = useState<StudentOfTheMonth[]>(MOCK_STUDENTS_OF_THE_MONTH);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingItem, setEditingItem] = useState<Partial<StudentOfTheMonth> | null>(null);

  const handleCreate = () => {
    setEditingItem({
      name: '',
      achievement: '',
      monthYear: '',
      image: ''
    });
    setView('editor');
  };

  const handleEdit = (item: StudentOfTheMonth) => {
    setEditingItem(item);
    setView('editor');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this student from the Hall of Fame?')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const handleSave = (item: StudentOfTheMonth) => {
    if (students.find(s => s.id === item.id)) {
      setStudents(students.map(s => s.id === item.id ? item : s));
    } else {
      setStudents([item, ...students]);
    }
    setView('list');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" /> Hall of Fame Management
          </h2>
          <p className="text-gray-500">Celebrate outstanding students of the month.</p>
        </div>
        {view === 'list' && (
          <Button onClick={handleCreate}>
            Add Student
          </Button>
        )}
      </div>

      {view === 'list' ? (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Display Period</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                       <img src={student.image} className="w-12 h-12 rounded-full object-cover bg-gray-100" alt="" />
                       <div>
                          <div className="text-sm font-bold text-gray-900">{student.name}</div>
                          <div className="text-[10px] text-gray-400 line-clamp-1 max-w-xs uppercase tracking-tight">{student.achievement}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-teal-600">
                    {student.monthYear}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(student)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(student.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <StudentEditor 
           item={editingItem as StudentOfTheMonth} 
           onSave={handleSave} 
           onCancel={() => setView('list')} 
        />
      )}
    </div>
  );
};

const StudentEditor: React.FC<{ item: StudentOfTheMonth, onSave: (s: StudentOfTheMonth) => void, onCancel: () => void }> = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState<StudentOfTheMonth>({
    ...item,
    id: item.id || 'sm' + Date.now()
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      setFormData(prev => ({ ...prev, image: base64 }));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
       <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Student</Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
             <Card title="Student Information">
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Name</label>
                      <input 
                         required
                         type="text" 
                         className="w-full border rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                         placeholder="Full Name"
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Month & Year</label>
                      <input 
                         required
                         type="text" 
                         className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                         placeholder="e.g. October 2024"
                         value={formData.monthYear}
                         onChange={e => setFormData({...formData, monthYear: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Achievement Description</label>
                      <textarea 
                         required
                         className="w-full border rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none min-h-[120px]"
                         placeholder="Why is this student featured? Describe their outstanding achievement..."
                         value={formData.achievement}
                         onChange={e => setFormData({...formData, achievement: e.target.value})}
                      />
                   </div>
                </div>
             </Card>
          </div>

          <div className="space-y-6">
             <Card title="Profile Photo">
                <div className="space-y-4 text-center">
                   <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="mx-auto w-48 h-48 border-2 border-dashed border-gray-200 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden bg-gray-50"
                   >
                      {formData.image ? (
                         <img src={formData.image} className="w-full h-full object-cover" alt="Student preview" />
                      ) : (
                         <>
                            <UserIcon className="w-12 h-12 text-gray-300 mb-2" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload Photo</span>
                         </>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                   </div>
                   <p className="text-[10px] text-gray-400 italic leading-relaxed">Best results with square images.</p>
                </div>
             </Card>
          </div>
       </div>
    </form>
  );
};
