import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { 
  Megaphone, Plus, Trash2, Edit2, X, Loader2, 
  AlertCircle, Clock, Users, Eye, EyeOff, Bell
} from 'lucide-react';
import { Announcement } from '../../types';
import { 
  fetchAllAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement,
  toggleAnnouncementActive
} from '../../services/announcements.service';
import { useAuth } from '../../contexts/AuthContext';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

const AUDIENCE_OPTIONS = [
  { value: 'teachers', label: 'Teachers Only', icon: Users },
  { value: 'students', label: 'Students Only', icon: Users },
  { value: 'parents', label: 'Parents Only', icon: Users },
  { value: 'all', label: 'Everyone', icon: Users },
];

interface FormData {
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | 'teachers' | 'students' | 'parents';
  startsAt: string;
  expiresAt: string;
}

const initialFormData: FormData = {
  title: '',
  content: '',
  priority: 'normal',
  targetAudience: 'teachers',
  startsAt: '',
  expiresAt: '',
};

export const AnnouncementManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await fetchAllAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          targetAudience: formData.targetAudience,
          startsAt: formData.startsAt || null,
          expiresAt: formData.expiresAt || null,
        });
      } else {
        await createAnnouncement({
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          targetAudience: formData.targetAudience,
          startsAt: formData.startsAt || null,
          expiresAt: formData.expiresAt || null,
        }, currentUser?.id || '');
      }
      await loadAnnouncements();
      resetForm();
    } catch (err) {
      console.error('Error saving announcement:', err);
      alert('Failed to save announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      startsAt: announcement.startsAt ? announcement.startsAt.slice(0, 16) : '',
      expiresAt: announcement.expiresAt ? announcement.expiresAt.slice(0, 16) : '',
    });
    setIsAdding(true);
    setSelectedAnnouncement(null);
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    setIsSubmitting(true);
    try {
      await deleteAnnouncement(selectedAnnouncement.id);
      await loadAnnouncements();
      setSelectedAnnouncement(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Failed to delete announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      await toggleAnnouncementActive(announcement.id, !announcement.isActive);
      await loadAnnouncements();
    } catch (err) {
      console.error('Error toggling announcement:', err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const option = PRIORITY_OPTIONS.find(p => p.value === priority);
    return option ? option.color : 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-teal-600" />
            Announcement Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage announcements for teachers
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </div>

      {/* Add/Edit Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Announcement title..."
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Announcement content..."
                  required
                />
              </div>

              {/* Priority & Audience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      priority: e.target.value as FormData['priority']
                    }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    {PRIORITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      targetAudience: e.target.value as FormData['targetAudience']
                    }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    {AUDIENCE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Start Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, startsAt: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                  {editingId ? 'Update' : 'Create'} Announcement
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Announcements List */}
      <div className="grid gap-4">
        {announcements.length === 0 ? (
          <Card className="p-8 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No announcements yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Create your first announcement to notify teachers
            </p>
          </Card>
        ) : (
          announcements.map(announcement => (
            <Card
              key={announcement.id}
              className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
                !announcement.isActive ? 'opacity-60 bg-gray-50' : ''
              }`}
              onClick={() => setSelectedAnnouncement(announcement)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(announcement.priority)}`}>
                      {announcement.priority.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                      {announcement.targetAudience === 'all' ? 'Everyone' : announcement.targetAudience}
                    </span>
                    {!announcement.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {formatDate(announcement.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(announcement);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      announcement.isActive 
                        ? 'hover:bg-gray-100 text-gray-500' 
                        : 'hover:bg-green-100 text-green-600'
                    }`}
                    title={announcement.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {announcement.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(announcement);
                    }}
                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedAnnouncement && !isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-gray-900">Announcement Detail</h2>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(selectedAnnouncement.priority)}`}>
                  {selectedAnnouncement.priority.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                  {selectedAnnouncement.targetAudience === 'all' ? 'Everyone' : selectedAnnouncement.targetAudience}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedAnnouncement.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {selectedAnnouncement.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedAnnouncement.title}</h3>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(selectedAnnouncement.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Expires</p>
                  <p className="font-medium">{formatDate(selectedAnnouncement.expiresAt)}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => handleEdit(selectedAnnouncement)}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-sm">
            <div className="p-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Announcement?</h3>
              <p className="text-gray-500 text-sm mb-4">
                This action cannot be undone. The announcement will be permanently removed.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManager;
