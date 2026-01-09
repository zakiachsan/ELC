
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  User, Globe, Award, Clock, MessageSquare, Camera,
  Loader2, Save, Eye, EyeOff, Plus, X, Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { contentService } from '../../services/content.service';
import type { Database } from '../../lib/database.types';

type FeaturedTeacher = Database['public']['Tables']['featured_teachers']['Row'];

const COUNTRY_OPTIONS = [
  { code: 'US', name: 'United States', flag: 'US' },
  { code: 'GB', name: 'United Kingdom', flag: 'GB' },
  { code: 'AU', name: 'Australia', flag: 'AU' },
  { code: 'CA', name: 'Canada', flag: 'CA' },
  { code: 'NZ', name: 'New Zealand', flag: 'NZ' },
  { code: 'IE', name: 'Ireland', flag: 'IE' },
  { code: 'ZA', name: 'South Africa', flag: 'ZA' },
  { code: 'ID', name: 'Indonesia', flag: 'ID' },
  { code: 'PH', name: 'Philippines', flag: 'PH' },
  { code: 'MY', name: 'Malaysia', flag: 'MY' },
];

const CERTIFICATION_SUGGESTIONS = [
  'TEFL Certified',
  'Cambridge CELTA',
  'DELTA Module 1',
  'DELTA Module 2',
  'TESOL Certified',
  'TESOL Masters',
  'TKT Cambridge',
  'IELTS Examiner',
  'IELTS Band 8.5',
  'IELTS Band 9',
  'TOEFL iBT Trainer',
  'Pronunciation Specialist',
  'Business English Certified',
  'Young Learners Specialist',
];

export const TeacherProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<FeaturedTeacher> | null>(null);
  const [newCertification, setNewCertification] = useState('');
  const [showCertSuggestions, setShowCertSuggestions] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    country: 'ID',
    country_flag: 'ID',
    type: 'local' as 'native' | 'local',
    photo_url: '',
    certifications: [] as string[],
    experience: 0,
    specialty: '',
    quote: '',
    is_active: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const data = await contentService.getTeacherProfileByUserId(user.id);
        if (data) {
          setProfile(data);
          setFormData({
            name: data.name || user.name || '',
            country: data.country || 'ID',
            country_flag: data.country_flag || 'ID',
            type: data.type || 'local',
            photo_url: data.photo_url || '',
            certifications: data.certifications || [],
            experience: data.experience || 0,
            specialty: data.specialty || '',
            quote: data.quote || '',
            is_active: data.is_active || false,
          });
        } else {
          // Initialize with user's name
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      await contentService.upsertTeacherProfile(user.id, {
        name: formData.name,
        country: formData.country,
        country_flag: formData.country_flag,
        type: formData.type,
        photo_url: formData.photo_url,
        certifications: formData.certifications,
        experience: formData.experience,
        specialty: formData.specialty,
        quote: formData.quote,
        is_active: formData.is_active,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRY_OPTIONS.find(c => c.code === countryCode);
    setFormData(prev => ({
      ...prev,
      country: country?.name || countryCode,
      country_flag: countryCode,
      type: ['US', 'GB', 'AU', 'CA', 'NZ', 'IE', 'ZA'].includes(countryCode) ? 'native' : 'local',
    }));
  };

  const handleAddCertification = (cert: string) => {
    if (cert.trim() && !formData.certifications.includes(cert.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert.trim()],
      }));
    }
    setNewCertification('');
    setShowCertSuggestions(false);
  };

  const handleRemoveCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert),
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for now (in production, upload to storage)
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        photo_url: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const filteredSuggestions = CERTIFICATION_SUGGESTIONS.filter(
    cert => !formData.certifications.includes(cert) &&
            cert.toLowerCase().includes(newCertification.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" /> Teacher Profile
          </h2>
          <p className="text-gray-500 text-sm">
            Manage your public profile for the "Meet Our Star Teachers" section
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved!
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Profile
          </Button>
        </div>
      </div>

      {/* Visibility Toggle */}
      <Card className="!p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {formData.is_active ? (
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <Eye className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 bg-gray-100 text-gray-400 rounded-lg">
                <EyeOff className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900">Profile Visibility</h3>
              <p className="text-xs text-gray-500">
                {formData.is_active
                  ? 'Your profile is visible on the homepage'
                  : 'Your profile is hidden from the homepage'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              formData.is_active ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              formData.is_active ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photo & Basic Info */}
        <div className="space-y-6">
          {/* Photo Upload */}
          <Card title="Profile Photo">
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative mx-auto w-40 h-40 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 cursor-pointer hover:border-teal-400 transition-colors group"
              >
                {formData.photo_url ? (
                  <>
                    <img src={formData.photo_url} className="w-full h-full object-cover" alt="Profile" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                    <Camera className="w-10 h-10 text-gray-300 mb-2" />
                    <span className="text-xs text-gray-400">Upload Photo</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              <p className="text-[10px] text-gray-400 text-center">
                Recommended: Square image, min 400x400px
              </p>
            </div>
          </Card>

          {/* Country & Type */}
          <Card title="Origin & Type">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Country</label>
                <select
                  value={formData.country_flag}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {COUNTRY_OPTIONS.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teacher Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'native' }))}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      formData.type === 'native'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Native Speaker
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'local' }))}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      formData.type === 'local'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Local Expert
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card title="Basic Information">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Ms. Sarah Johnson"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Specialty / Highlight</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  placeholder="e.g. Business English & IELTS Preparation"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <p className="text-[10px] text-gray-400">This appears below your name on the homepage</p>
              </div>
            </div>
          </Card>

          {/* Certifications */}
          <Card title="Certifications">
            <div className="space-y-4">
              {/* Current certifications */}
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map(cert => (
                  <span
                    key={cert}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                  >
                    <Award className="w-3 h-3 text-teal-600" />
                    {cert}
                    <button
                      onClick={() => handleRemoveCertification(cert)}
                      className="ml-1 p-0.5 hover:bg-gray-200 rounded"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </span>
                ))}
                {formData.certifications.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No certifications added yet</p>
                )}
              </div>

              {/* Add certification */}
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => {
                      setNewCertification(e.target.value);
                      setShowCertSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowCertSuggestions(newCertification.length > 0)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCertification(newCertification);
                      }
                    }}
                    placeholder="Add certification..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  <Button
                    onClick={() => handleAddCertification(newCertification)}
                    disabled={!newCertification.trim()}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Suggestions dropdown */}
                {showCertSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-12 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {filteredSuggestions.map(cert => (
                      <button
                        key={cert}
                        onClick={() => handleAddCertification(cert)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Award className="w-3 h-3 text-gray-400" />
                        {cert}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Quote */}
          <Card title="Personal Quote">
            <div className="space-y-2">
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-300" />
                <textarea
                  value={formData.quote}
                  onChange={(e) => setFormData(prev => ({ ...prev, quote: e.target.value }))}
                  placeholder="Share your teaching philosophy or an inspiring message..."
                  className="w-full border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none min-h-[100px] resize-none"
                  maxLength={200}
                />
              </div>
              <p className="text-[10px] text-gray-400 text-right">{formData.quote.length}/200 characters</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Preview */}
      {formData.is_active && (
        <Card title="Preview - How it appears on homepage">
          <div className="max-w-xs mx-auto">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {/* Photo */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                {formData.photo_url ? (
                  <img src={formData.photo_url} className="w-full h-full object-cover" alt={formData.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {/* Country badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span>{formData.country_flag}</span>
                  <span>{formData.country}</span>
                </div>
                {/* Type badge */}
                <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                  formData.type === 'native' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {formData.type === 'native' ? 'Native Speaker' : 'Local Expert'}
                </div>
              </div>
              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-gray-900">{formData.name || 'Your Name'}</h3>
                  <p className="text-xs text-gray-500">{formData.specialty || 'Your Specialty'}</p>
                </div>
                {formData.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.certifications.slice(0, 3).map(cert => (
                      <span key={cert} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formData.experience} tahun pengalaman
                </p>
                {formData.quote && (
                  <p className="text-xs text-gray-600 italic">"{formData.quote}"</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
