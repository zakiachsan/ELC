
import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MessageSquare, Send, CheckCircle, Star } from 'lucide-react';
import { User } from '../../types';
import { parentEngagementService } from '../../services/parentEngagement.service';

interface FeedbackFormProps {
  user: User;
}

type FeedbackCategory = 'GENERAL' | 'SUGGESTION' | 'COMPLAINT' | 'APPRECIATION';

interface FeedbackSubmission {
  id: string;
  userId: string;
  userName: string;
  category: FeedbackCategory;
  rating: number;
  message: string;
  timestamp: string;
}

// Mock submitted feedback
const MOCK_MY_FEEDBACK: FeedbackSubmission[] = [
  {
    id: 'fb1',
    userId: 'u3',
    userName: 'Sarah Connor',
    category: 'SUGGESTION',
    rating: 4,
    message: 'Akan lebih bagus kalau ada fitur notifikasi untuk jadwal kelas.',
    timestamp: '2024-12-20T10:30:00'
  },
  {
    id: 'fb2',
    userId: 'u3',
    userName: 'Sarah Connor',
    category: 'APPRECIATION',
    rating: 5,
    message: 'Terima kasih untuk guru-guru yang sangat membantu!',
    timestamp: '2024-12-15T14:00:00'
  }
];

const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string; color: string }[] = [
  { value: 'GENERAL', label: 'Umum', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'SUGGESTION', label: 'Saran', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'COMPLAINT', label: 'Keluhan', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'APPRECIATION', label: 'Apresiasi', color: 'bg-green-100 text-green-700 border-green-200' },
];

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ user }) => {
  const [category, setCategory] = useState<FeedbackCategory>('GENERAL');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // Track page view for parents
  useEffect(() => {
    if (user?.id && user.role === 'PARENT') {
      parentEngagementService.trackPageView(user.id, 'feedback', '/parent/feedback');
    }
  }, [user?.id, user?.role]);

  const handleSubmit = async () => {
    if (!message.trim() || rating === 0) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setShowSuccess(true);

    // Reset form after showing success
    setTimeout(() => {
      setShowSuccess(false);
      setMessage('');
      setRating(0);
      setCategory('GENERAL');
    }, 2000);
  };

  const getCategoryStyle = (cat: FeedbackCategory) => {
    return CATEGORY_OPTIONS.find(c => c.value === cat)?.color || '';
  };

  const getCategoryLabel = (cat: FeedbackCategory) => {
    return CATEGORY_OPTIONS.find(c => c.value === cat)?.label || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" /> Feedback
          </h2>
          <p className="text-xs text-gray-500">Sampaikan saran, kritik, atau apresiasi Anda kepada manajemen.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('submit')}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'submit' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Kirim Feedback
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'history' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Riwayat
        </button>
      </div>

      {activeTab === 'submit' && (
        <Card className="!p-5">
          {showSuccess ? (
            <div className="text-center py-8 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Terima Kasih!</h3>
              <p className="text-xs text-gray-500">Feedback Anda telah berhasil dikirim ke manajemen.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Kategori
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCategory(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        category === opt.value
                          ? opt.color + ' ring-2 ring-offset-1 ring-gray-300'
                          : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Rating Pengalaman
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        star <= rating
                          ? 'bg-yellow-100 text-yellow-500'
                          : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Pesan Anda
                </label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="Tuliskan feedback Anda di sini..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={!message.trim() || rating === 0}
                className="w-full py-2.5 text-xs font-bold"
              >
                Kirim Feedback
              </Button>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {MOCK_MY_FEEDBACK.length === 0 ? (
            <Card className="!p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-500">Belum ada feedback yang dikirim.</p>
            </Card>
          ) : (
            MOCK_MY_FEEDBACK.map(fb => (
              <Card key={fb.id} className="!p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getCategoryStyle(fb.category)}`}>
                    {getCategoryLabel(fb.category)}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {new Date(fb.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${star <= fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{fb.message}</p>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
