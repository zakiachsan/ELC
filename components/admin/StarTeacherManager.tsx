import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  Star, GripVertical, Eye, EyeOff, Loader2, Users,
  ChevronUp, ChevronDown, Globe, Award, Clock
} from 'lucide-react';
import { useFeaturedTeachers } from '../../hooks/useContent';
import { contentService } from '../../services/content.service';

interface Teacher {
  id: string;
  name: string;
  country: string;
  country_flag: string;
  type: 'native' | 'local';
  photo_url: string;
  certifications: string[];
  experience: number;
  specialty: string;
  quote: string;
  is_active: boolean;
  display_order: number;
  user_id: string | null;
}

export const StarTeacherManager: React.FC = () => {
  const { teachers: teachersData, loading, error, refetch } = useFeaturedTeachers();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  // Sort teachers by display_order
  useEffect(() => {
    if (teachersData) {
      const sorted = [...teachersData].sort((a, b) =>
        (a.display_order || 999) - (b.display_order || 999)
      );
      setTeachers(sorted as Teacher[]);
    }
  }, [teachersData]);

  const handleToggleActive = async (teacher: Teacher) => {
    setSaving(teacher.id);
    try {
      await contentService.toggleFeaturedTeacherActive(teacher.id, !teacher.is_active);
      await refetch();
    } catch (err) {
      console.error('Error toggling teacher:', err);
      alert('Failed to update teacher status');
    } finally {
      setSaving(null);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    setReordering(true);

    try {
      const newTeachers = [...teachers];
      const temp = newTeachers[index];
      newTeachers[index] = newTeachers[index - 1];
      newTeachers[index - 1] = temp;

      // Update display_order for both
      await Promise.all([
        contentService.updateFeaturedTeacher(newTeachers[index].id, { display_order: index + 1 }),
        contentService.updateFeaturedTeacher(newTeachers[index - 1].id, { display_order: index }),
      ]);

      setTeachers(newTeachers);
    } catch (err) {
      console.error('Error reordering:', err);
      alert('Failed to reorder teachers');
    } finally {
      setReordering(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === teachers.length - 1) return;
    setReordering(true);

    try {
      const newTeachers = [...teachers];
      const temp = newTeachers[index];
      newTeachers[index] = newTeachers[index + 1];
      newTeachers[index + 1] = temp;

      // Update display_order for both
      await Promise.all([
        contentService.updateFeaturedTeacher(newTeachers[index].id, { display_order: index + 1 }),
        contentService.updateFeaturedTeacher(newTeachers[index + 1].id, { display_order: index + 2 }),
      ]);

      setTeachers(newTeachers);
    } catch (err) {
      console.error('Error reordering:', err);
      alert('Failed to reorder teachers');
    } finally {
      setReordering(false);
    }
  };

  const activeCount = teachers.filter(t => t.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading teachers: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Star Teachers Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage teacher profiles displayed on the homepage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-xs font-bold">
            <Eye className="w-3.5 h-3.5" />
            {activeCount} Active
          </div>
          <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            {teachers.length} Total
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="text-xs space-y-1 text-blue-700">
              <li>• Teachers can create/edit their own profiles from their dashboard</li>
              <li>• Use the arrows to set the display order on the homepage</li>
              <li>• Toggle visibility to show/hide teachers from the public homepage</li>
              <li>• Only the top 3 active teachers are shown by default (carousel if more)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Teachers List */}
      <Card title="Teacher Profiles" subtitle={`Drag to reorder • ${activeCount} visible on homepage`}>
        {teachers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No teacher profiles yet</p>
            <p className="text-sm mt-1">Teachers can create their profiles from their dashboard</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {teachers.map((teacher, index) => (
              <div
                key={teacher.id}
                className={`flex items-center gap-4 p-4 transition-all ${
                  !teacher.is_active ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
                } ${reordering ? 'pointer-events-none' : ''}`}
              >
                {/* Order Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || reordering}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-500">
                    {index + 1}
                  </div>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === teachers.length - 1 || reordering}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Photo */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {teacher.photo_url ? (
                    <img
                      src={teacher.photo_url}
                      alt={teacher.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Users className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 truncate">{teacher.name}</h3>
                    <span className="text-lg">{teacher.country_flag}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      teacher.type === 'native'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {teacher.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{teacher.specialty}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      {teacher.experience} yrs
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Award className="w-3 h-3" />
                      {(teacher.certifications as string[] || []).length} certs
                    </div>
                    {teacher.user_id && (
                      <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                        Linked Account
                      </span>
                    )}
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleActive(teacher)}
                    disabled={saving === teacher.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      teacher.is_active
                        ? 'bg-teal-500 text-white hover:bg-teal-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {saving === teacher.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : teacher.is_active ? (
                      <>
                        <Eye className="w-4 h-4" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hidden
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Preview Info */}
      {activeCount > 0 && (
        <Card>
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
            <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-2">
              <Star className="w-4 h-4" />
              Homepage Preview Order
            </h4>
            <div className="flex flex-wrap gap-2">
              {teachers.filter(t => t.is_active).map((teacher, idx) => (
                <div
                  key={teacher.id}
                  className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-yellow-200 text-sm"
                >
                  <span className="w-5 h-5 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-gray-700">{teacher.name}</span>
                  {idx < 3 && (
                    <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                      SHOWN
                    </span>
                  )}
                </div>
              ))}
            </div>
            {activeCount > 3 && (
              <p className="text-xs text-yellow-700 mt-2">
                * Teachers #4 and beyond are accessible via carousel navigation
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StarTeacherManager;
