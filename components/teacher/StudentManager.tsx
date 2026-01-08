import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { 
  Users, Search, Plus, Pencil, Trash2, X, Mail, Phone, 
  School, GraduationCap, Loader2, ShieldAlert, ChevronLeft, 
  ChevronRight, ChevronsLeft, ChevronsRight, MapPin
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocations } from '../../hooks/useProfiles';
import { profilesService } from '../../services/profiles.service';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ClassItem = { id: string; location_id: string; name: string; class_type: string | null };

export const StudentManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { locations } = useLocations();
  const [locationClasses, setLocationClasses] = useState<ClassItem[]>([]);

  // Teacher's assigned data
  const teacherLocationIds = currentUser?.assignedLocationIds || [];
  const teacherClasses = currentUser?.assignedClasses || [];

  // State
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    locationId: '',
    className: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  // Get locations for this teacher
  const teacherLocations = useMemo(() => {
    return locations.filter(loc => teacherLocationIds.includes(loc.id));
  }, [locations, teacherLocationIds]);

  // Fetch classes when location changes in form
  useEffect(() => {
    const fetchClassesForLocation = async () => {
      if (!formData.locationId) {
        setLocationClasses([]);
        return;
      }
      console.log('Fetching classes for location:', formData.locationId);
      try {
        const data = await profilesService.getClassesByLocation(formData.locationId);
        console.log('Classes fetched from DB:', data);
        setLocationClasses(data as ClassItem[]);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setLocationClasses([]);
      }
    };
    fetchClassesForLocation();
  }, [formData.locationId]);

  // Get classes for selected location (filtered by teacher's assigned classes)
  const availableClasses = useMemo(() => {
    console.log('Teacher assigned classes:', teacherClasses);
    console.log('Classes for location:', locationClasses.map(c => c.name));
    
    if (!formData.locationId || locationClasses.length === 0) {
      console.log('Filtered classes:', []);
      return [];
    }
    
    // Filter by teacher's assigned classes with flexible matching
    // Match if: exact match OR teacher class contains DB class OR DB class contains teacher class
    const filtered = locationClasses.filter(dbClass => {
      const dbName = dbClass.name.toLowerCase().trim();
      return teacherClasses.some(tc => {
        const teacherName = tc.toLowerCase().trim();
        // Exact match
        if (teacherName === dbName) return true;
        // Teacher class contains DB class name (e.g., "KELAS 2A" contains "2A")
        if (teacherName.includes(dbName)) return true;
        // DB class contains teacher class name
        if (dbName.includes(teacherName)) return true;
        // Normalize: remove "KELAS " prefix and compare
        const normalizedTeacher = teacherName.replace(/^kelas\s*/i, '').trim();
        const normalizedDb = dbName.replace(/^kelas\s*/i, '').trim();
        if (normalizedTeacher === normalizedDb) return true;
        return false;
      });
    });
    console.log('Filtered classes:', filtered.map(c => c.name));
    return filtered;
  }, [locationClasses, formData.locationId, teacherClasses]);

  // Fetch students for teacher's assigned schools
  useEffect(() => {
    const fetchStudents = async () => {
      if (teacherLocationIds.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch students from all teacher's locations
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'STUDENT')
          .in('assigned_location_id', teacherLocationIds)
          .order('name');

        if (error) throw error;

        // Filter students by teacher's assigned classes (check school_origin)
        const filteredStudents = (data || []).filter(student => {
          if (!student.school_origin) return false;
          // Extract class from school_origin format: "SCHOOL - CLASS (TYPE)" or "SCHOOL - CLASS"
          const classMatch = student.school_origin.match(/^.+?\s*-\s*(.+?)(?:\s*\(.+?\))?$/);
          const studentClass = classMatch ? classMatch[1].trim() : '';
          return teacherClasses.some(tc => 
            tc.toLowerCase() === studentClass.toLowerCase() ||
            studentClass.toLowerCase().includes(tc.toLowerCase()) ||
            tc.toLowerCase().includes(studentClass.toLowerCase())
          );
        });

        setStudents(filteredStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [teacherLocationIds, teacherClasses]);

  // Helper function to extract class name from school_origin
  const extractClassFromSchoolOrigin = (schoolOrigin?: string | null): string => {
    if (!schoolOrigin) return '';
    const match = schoolOrigin.match(/^.+?\s*-\s*(.+?)(?:\s*\(.+?\))?$/);
    return match ? match[1].trim() : '';
  };

  // Get school name from location id
  const getSchoolName = (locationId: string | null): string => {
    if (!locationId) return '-';
    const location = locations.find(l => l.id === locationId);
    return location?.name || '-';
  };

  // Filtered students based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!student.name.toLowerCase().includes(query) && 
            !student.email.toLowerCase().includes(query)) {
          return false;
        }
      }

      // School filter
      if (schoolFilter && student.assigned_location_id !== schoolFilter) {
        return false;
      }

      // Class filter
      if (classFilter) {
        const studentClass = extractClassFromSchoolOrigin(student.school_origin);
        if (!studentClass.toLowerCase().includes(classFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [students, searchQuery, schoolFilter, classFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      locationId: teacherLocations[0]?.id || '',
      className: '',
      status: 'ACTIVE'
    });
    setIsEditing(false);
    setEditingStudentId(null);
    setSubmitError(null);
  };

  // Open create modal
  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (student: Profile) => {
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      password: '',
      locationId: student.assigned_location_id || '',
      className: extractClassFromSchoolOrigin(student.school_origin),
      status: student.status as 'ACTIVE' | 'INACTIVE'
    });
    setIsEditing(true);
    setEditingStudentId(student.id);
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedLocation = locations.find(l => l.id === formData.locationId);
      const schoolOrigin = selectedLocation 
        ? `${selectedLocation.name} - ${formData.className}`
        : formData.className;

      if (isEditing && editingStudentId) {
        // Update existing student
        const updates: any = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          assigned_location_id: formData.locationId,
          school_origin: schoolOrigin,
          status: formData.status
        };

        await profilesService.update(editingStudentId, updates);

        // Update local state
        setStudents(prev => prev.map(s => 
          s.id === editingStudentId 
            ? { ...s, ...updates }
            : s
        ));
      } else {
        // Create new student using admin client
        // First create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true
        });

        if (authError) throw authError;

        // Then create profile
        const newProfile = await profilesService.create({
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          role: 'STUDENT',
          status: formData.status,
          assigned_location_id: formData.locationId,
          school_origin: schoolOrigin
        });

        // Add to local state
        setStudents(prev => [...prev, newProfile]);
      }

      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving student:', error);
      setSubmitError(error.message || 'Failed to save student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await profilesService.delete(deleteConfirm.id);
      setStudents(prev => prev.filter(s => s.id !== deleteConfirm.id));
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get unique classes from students for filter dropdown
  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    students.forEach(s => {
      const cls = extractClassFromSchoolOrigin(s.school_origin);
      if (cls) classes.add(cls);
    });
    return Array.from(classes).sort();
  }, [students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Student Management
          </h2>
          <p className="text-xs text-gray-500">Manage students in your assigned classes</p>
        </div>
        <Button onClick={handleOpenCreate} className="text-xs py-2 px-4 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <Card className="!p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs border rounded-lg"
            />
          </div>

          {/* School Filter */}
          <select
            value={schoolFilter}
            onChange={e => { setSchoolFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs border rounded-lg bg-white min-w-[150px]"
          >
            <option value="">All Schools</option>
            {teacherLocations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={e => { setClassFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs border rounded-lg bg-white min-w-[120px]"
          >
            <option value="">All Classes</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="!p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{students.length}</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold">Total Students</p>
        </Card>
        <Card className="!p-3 text-center">
          <p className="text-2xl font-bold text-green-600">
            {students.filter(s => s.status === 'ACTIVE').length}
          </p>
          <p className="text-[10px] text-gray-500 uppercase font-bold">Active</p>
        </Card>
        <Card className="!p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{teacherLocations.length}</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold">Schools</p>
        </Card>
        <Card className="!p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{uniqueClasses.length}</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold">Classes</p>
        </Card>
      </div>

      {/* Student List */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    {searchQuery || schoolFilter || classFilter 
                      ? 'No students found matching your filters'
                      : 'No students in your assigned classes yet'
                    }
                  </td>
                </tr>
              ) : (
                paginatedStudents.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-[10px] text-gray-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{getSchoolName(student.assigned_location_id)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                        {extractClassFromSchoolOrigin(student.school_origin) || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        student.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, id: student.id, name: student.name })}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md !p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                {isEditing ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-xs mt-1"
                  placeholder="Student full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-xs mt-1 disabled:bg-gray-50"
                  placeholder="student@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-xs mt-1"
                  placeholder="08123456789"
                />
              </div>

              {/* Password (only for new students) */}
              {!isEditing && (
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required={!isEditing}
                    className="w-full border rounded-lg px-3 py-2 text-xs mt-1"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                  />
                </div>
              )}

              {/* School */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">School *</label>
                <select
                  value={formData.locationId}
                  onChange={e => setFormData({ ...formData, locationId: e.target.value, className: '' })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-xs mt-1 bg-white"
                >
                  <option value="">Select school...</option>
                  {teacherLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Class *</label>
                <select
                  value={formData.className}
                  onChange={e => setFormData({ ...formData, className: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-xs mt-1 bg-white"
                  disabled={!formData.locationId}
                >
                  <option value="">Select class...</option>
                  {availableClasses.map(cls => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
                {formData.locationId && availableClasses.length === 0 && (
                  <p className="text-[9px] text-orange-500 mt-1">No classes assigned to you at this school</p>
                )}
              </div>

              {/* Status Toggle - Only show in edit mode */}
              {isEditing && (
                <div className="pt-2 border-t border-gray-100">
                  <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Account Status</label>
                  {formData.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'INACTIVE' })}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-gray-700">Currently Active</span>
                      </div>
                      <span className="text-[10px] font-bold text-red-600 uppercase">Click to Deactivate</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'ACTIVE' })}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="text-xs font-medium text-gray-700">Currently Inactive</span>
                      </div>
                      <span className="text-[10px] font-bold text-green-600 uppercase">Click to Activate</span>
                    </button>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.email || !formData.locationId || !formData.className || (!isEditing && !formData.password)}
                  className="flex-1 text-xs py-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    isEditing ? 'Save Changes' : 'Create Student'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[200] bg-red-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-xl shadow-xl overflow-hidden border border-red-100">
            <div className="p-4 text-center space-y-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">Delete Student</h3>
                <p className="text-[10px] text-gray-500">
                  Are you sure you want to delete <span className="font-bold">"{deleteConfirm.name}"</span>?
                </p>
                <p className="text-[9px] text-red-500">This action cannot be undone.</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold text-[10px] uppercase disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] uppercase disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
