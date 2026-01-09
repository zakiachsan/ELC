
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Award, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useStudentsOfMonth } from '../../hooks/useContent';
import { StudentOfTheMonth } from '../../types';

export const StudentOfMonthManager: React.FC = () => {
  const { students: studentsData, loading, error, createStudent, deleteStudent } = useStudentsOfMonth();
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingItem, setEditingItem] = useState<Partial<StudentOfTheMonth> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map database format to component format
  const students: StudentOfTheMonth[] = studentsData.map(s => ({
    id: s.id,
    name: s.name,
    school: s.school || '',
    className: s.class_name || '',
    achievement: s.achievement,
    monthYear: s.month_year,
  }));

  const handleCreate = () => {
    setEditingItem({
      name: '',
      school: '',
      className: '',
      achievement: '',
      monthYear: '',
    });
    setView('editor');
  };

  const handleEdit = (item: StudentOfTheMonth) => {
    setEditingItem(item);
    setView('editor');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this student from the Hall of Fame?')) {
      try {
        await deleteStudent(id);
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Failed to delete student.');
      }
    }
  };

  const handleSave = async (item: StudentOfTheMonth) => {
    setIsSubmitting(true);
    try {
      const existing = studentsData.find(s => s.id === item.id);
      if (existing) {
        // For editing, we'd need updateStudent - for now just delete and create
        await deleteStudent(item.id);
      }
      await createStudent({
        name: item.name,
        school: item.school,
        class_name: item.className,
        achievement: item.achievement,
        month_year: item.monthYear,
      });
      setView('list');
    } catch (err) {
      console.error('Error saving student:', err);
      alert('Failed to save student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading students: {error.message}
      </div>
    );
  }

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
                    <div>
                       <div className="text-sm font-bold text-gray-900">{student.name}</div>
                       <div className="text-xs text-gray-500">{student.school} - Kelas {student.className}</div>
                       <div className="text-[10px] text-gray-400 line-clamp-1 max-w-xs uppercase tracking-tight mt-1">{student.achievement}</div>
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

       <Card title="Student Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                   placeholder="e.g. January 2025"
                   value={formData.monthYear}
                   onChange={e => setFormData({...formData, monthYear: e.target.value})}
                />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">School</label>
                <input 
                   required
                   type="text" 
                   className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                   placeholder="e.g. SMP Abdi Siswa Bintaro"
                   value={formData.school}
                   onChange={e => setFormData({...formData, school: e.target.value})}
                />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class</label>
                <input 
                   required
                   type="text" 
                   className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                   placeholder="e.g. 7A"
                   value={formData.className}
                   onChange={e => setFormData({...formData, className: e.target.value})}
                />
             </div>
             <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Achievement Description</label>
                <textarea 
                   required
                   className="w-full border rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none min-h-[100px]"
                   placeholder="Why is this student featured? Describe their outstanding achievement..."
                   value={formData.achievement}
                   onChange={e => setFormData({...formData, achievement: e.target.value})}
                />
             </div>
          </div>
       </Card>
    </form>
  );
};
