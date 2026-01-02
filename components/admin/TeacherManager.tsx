import React, { useState, useMemo } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  Users, Search, Calendar, Clock, MapPin, BookOpen, FileText,
  ChevronRight, BarChart3, User, Mail, Phone, Loader2,
  GraduationCap, TrendingUp, TrendingDown, Minus, Eye, X,
  Download, Filter, CalendarDays
} from 'lucide-react';
import { useTeachers } from '../../hooks/useProfiles';
import { useSessions } from '../../hooks/useSessions';

type TabType = 'list' | 'schedule' | 'analytics';

export const TeacherManager: React.FC = () => {
  const { profiles: teachers, loading: teachersLoading } = useTeachers();
  const { sessions: allSessions, loading: sessionsLoading } = useSessions();

  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'week' | 'month' | 'custom'>('month');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Filter teachers by search
  const filteredTeachers = useMemo(() => {
    if (!searchQuery) return teachers;
    const query = searchQuery.toLowerCase();
    return teachers.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query)
    );
  }, [teachers, searchQuery]);

  // Get sessions for selected teacher
  const teacherSessions = useMemo(() => {
    if (!selectedTeacherId) return [];
    return allSessions.filter(s => s.teacher_id === selectedTeacherId);
  }, [allSessions, selectedTeacherId]);

  // Calculate session count per teacher for the current month
  const teacherSessionCounts = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const counts: Record<string, number> = {};
    allSessions.forEach(s => {
      const sessionDate = new Date(s.date_time);
      if (sessionDate >= startOfMonth && sessionDate <= endOfMonth) {
        counts[s.teacher_id] = (counts[s.teacher_id] || 0) + 1;
      }
    });
    return counts;
  }, [allSessions]);

  // Analytics data
  const analyticsData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    if (analyticsPeriod === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (analyticsPeriod === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = dateRange.start ? new Date(dateRange.start) : new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = dateRange.end ? new Date(dateRange.end) : now;
    }

    // Group sessions by teacher
    const teacherStats: Record<string, {
      name: string;
      sessions: number;
      hours: number;
      locations: Set<string>;
    }> = {};

    teachers.forEach(t => {
      teacherStats[t.id] = { name: t.name, sessions: 0, hours: 0, locations: new Set() };
    });

    allSessions.forEach(s => {
      const sessionDate = new Date(s.date_time);
      if (sessionDate >= startDate && sessionDate <= endDate && teacherStats[s.teacher_id]) {
        teacherStats[s.teacher_id].sessions += 1;
        teacherStats[s.teacher_id].hours += 1.5; // Assume 1.5 hours per session for now
        teacherStats[s.teacher_id].locations.add(s.location);
      }
    });

    return Object.entries(teacherStats)
      .map(([id, stats]) => ({
        id,
        ...stats,
        locationCount: stats.locations.size
      }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [teachers, allSessions, analyticsPeriod, dateRange]);

  // Max sessions for bar chart scaling
  const maxSessions = useMemo(() => {
    return Math.max(...analyticsData.map(d => d.sessions), 1);
  }, [analyticsData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTeacherClick = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setActiveTab('schedule');
  };

  if (teachersLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" /> Manajemen Guru
          </h2>
          <p className="text-xs text-gray-500">Kelola dan pantau aktivitas mengajar guru</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'list'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Daftar Guru
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'schedule'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" /> Jadwal & Materi
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Analitik
        </button>
      </div>

      {/* Tab 1: Teacher List */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="!p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <p className="text-[9px] font-bold text-blue-600 uppercase">Total Guru</p>
              <p className="text-xl font-bold text-blue-900">{teachers.length}</p>
            </Card>
            <Card className="!p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
              <p className="text-[9px] font-bold text-green-600 uppercase">Aktif</p>
              <p className="text-xl font-bold text-green-900">
                {teachers.filter(t => t.status === 'ACTIVE').length}
              </p>
            </Card>
            <Card className="!p-3 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
              <p className="text-[9px] font-bold text-purple-600 uppercase">Sesi Bulan Ini</p>
              <p className="text-xl font-bold text-purple-900">
                {Object.values(teacherSessionCounts).reduce((a, b) => a + b, 0)}
              </p>
            </Card>
            <Card className="!p-3 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
              <p className="text-[9px] font-bold text-orange-600 uppercase">Rata-rata/Guru</p>
              <p className="text-xl font-bold text-orange-900">
                {teachers.length > 0
                  ? Math.round(Object.values(teacherSessionCounts).reduce((a, b) => a + b, 0) / teachers.length)
                  : 0}
              </p>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau email guru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Teacher Table */}
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3">Guru</th>
                  <th className="px-4 py-3">Kontak</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Sesi Bulan Ini</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTeachers.map((teacher) => {
                  const sessionCount = teacherSessionCounts[teacher.id] || 0;
                  return (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                            {teacher.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{teacher.name}</p>
                            <p className="text-[10px] text-gray-500">{teacher.branch || 'All Branches'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1 text-[10px] text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" /> {teacher.email}
                          </p>
                          {teacher.phone && (
                            <p className="flex items-center gap-1 text-[10px] text-gray-600">
                              <Phone className="w-3 h-3 text-gray-400" /> {teacher.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-[10px] text-gray-600">
                          <MapPin className="w-3 h-3 text-orange-500" />
                          {teacher.assigned_location_id ? 'Assigned' : 'Flexible'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          teacher.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {teacher.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-bold ${
                            sessionCount >= 10 ? 'text-green-600' :
                            sessionCount >= 5 ? 'text-yellow-600' : 'text-red-500'
                          }`}>
                            {sessionCount}
                          </span>
                          {sessionCount >= 10 ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : sessionCount >= 5 ? (
                            <Minus className="w-3 h-3 text-yellow-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleTeacherClick(teacher.id)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100 flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" /> Lihat Jadwal
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredTeachers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs italic">
                      Tidak ada guru ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Tab 2: Schedule & Materials */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Teacher Selector */}
          <Card className="!p-3">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                  Pilih Guru
                </label>
                <select
                  value={selectedTeacherId || ''}
                  onChange={(e) => setSelectedTeacherId(e.target.value || null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              {selectedTeacherId && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Total Sesi</p>
                  <p className="text-xl font-bold text-blue-600">{teacherSessions.length}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Sessions List */}
          {selectedTeacherId ? (
            <Card className="!p-0 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" /> Jadwal Mengajar
                </h3>
                <span className="text-[10px] text-gray-500">
                  {teacherSessions.length} sesi tercatat
                </span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-2">Tanggal</th>
                    <th className="px-4 py-2">Waktu</th>
                    <th className="px-4 py-2">Topik</th>
                    <th className="px-4 py-2">Lokasi</th>
                    <th className="px-4 py-2">Materi</th>
                    <th className="px-4 py-2 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teacherSessions
                    .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
                    .map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="text-xs font-medium text-gray-900">
                          {formatDate(session.date_time)}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-1 text-[10px] text-gray-600">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatTime(session.date_time)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          <p className="font-bold text-gray-900">{session.topic}</p>
                          <p className="text-[10px] text-gray-500">
                            {session.skill_category} • {session.difficulty_level}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-1 text-[10px] text-gray-600">
                          <MapPin className="w-3 h-3 text-orange-500" />
                          {session.location}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {session.materials && session.materials.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-red-500" />
                            <span className="text-[10px] text-gray-600">
                              {session.materials.length} file
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Tidak ada</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teacherSessions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs italic">
                        Belum ada jadwal tercatat untuk guru ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card className="!p-8 text-center">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Pilih guru untuk melihat jadwal mengajar</p>
            </Card>
          )}
        </div>
      )}

      {/* Tab 3: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* Period Selector */}
          <Card className="!p-3">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                  Periode
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setAnalyticsPeriod('week')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      analyticsPeriod === 'week'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    onClick={() => setAnalyticsPeriod('month')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      analyticsPeriod === 'month'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Bulan Ini
                  </button>
                  <button
                    onClick={() => setAnalyticsPeriod('custom')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      analyticsPeriod === 'custom'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>
              {analyticsPeriod === 'custom' && (
                <div className="flex gap-2">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase">Dari</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="block border rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase">Sampai</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="block border rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Bar Chart */}
          <Card className="!p-4">
            <h3 className="text-xs font-bold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" /> Perbandingan Jam Mengajar
            </h3>
            <div className="space-y-2">
              {analyticsData.map((data) => (
                <div key={data.id} className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{data.name}</p>
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        data.sessions >= 10 ? 'bg-green-500' :
                        data.sessions >= 5 ? 'bg-yellow-500' : 'bg-red-400'
                      }`}
                      style={{ width: `${(data.sessions / maxSessions) * 100}%` }}
                    />
                  </div>
                  <div className="w-20 text-right shrink-0">
                    <span className={`text-xs font-bold ${
                      data.sessions >= 10 ? 'text-green-600' :
                      data.sessions >= 5 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {data.sessions} sesi
                    </span>
                  </div>
                </div>
              ))}
              {analyticsData.length === 0 && (
                <p className="text-center text-gray-400 text-xs italic py-4">
                  Tidak ada data untuk periode ini.
                </p>
              )}
            </div>
          </Card>

          {/* Summary Table */}
          <Card className="!p-0 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-bold text-gray-700">Ringkasan Detail</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-2">Guru</th>
                  <th className="px-4 py-2 text-center">Total Sesi</th>
                  <th className="px-4 py-2 text-center">Estimasi Jam</th>
                  <th className="px-4 py-2 text-center">Lokasi</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analyticsData.map((data) => (
                  <tr key={data.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <p className="font-bold text-gray-900">{data.name}</p>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="font-bold text-gray-900">{data.sessions}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-gray-600">{data.hours.toFixed(1)} jam</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-gray-600">{data.locationCount} lokasi</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {data.sessions >= 10 ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-700">
                          Aktif
                        </span>
                      ) : data.sessions >= 5 ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-yellow-100 text-yellow-700">
                          Sedang
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700">
                          Kurang
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Legend */}
          <Card className="!p-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Keterangan Status</p>
            <div className="flex gap-4 text-[10px]">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Aktif (≥10 sesi)</span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-600">Sedang (5-9 sesi)</span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-gray-600">Kurang (&lt;5 sesi)</span>
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-lg !p-0 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Detail Sesi
              </h3>
              <button onClick={() => setSelectedSession(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Session Info */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900">{selectedSession.topic}</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold">
                    {selectedSession.skill_category}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-bold">
                    {selectedSession.difficulty_level}
                  </span>
                </div>
              </div>

              {/* Date & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Tanggal & Waktu</p>
                  <p className="text-xs font-medium text-gray-900">
                    {formatDate(selectedSession.date_time)} • {formatTime(selectedSession.date_time)}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Lokasi</p>
                  <p className="text-xs font-medium text-gray-900 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-500" />
                    {selectedSession.location}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedSession.description && (
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Deskripsi</p>
                  <p className="text-xs text-gray-600">{selectedSession.description}</p>
                </div>
              )}

              {/* Materials */}
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Materi & Lampiran</p>
                {selectedSession.materials && selectedSession.materials.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSession.materials.map((file: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-xs text-gray-700 flex-1 truncate">{file}</span>
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Tidak ada materi terlampir</p>
                )}
              </div>

              {/* Video URL */}
              {selectedSession.video_url && (
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Video Recording</p>
                  <a
                    href={selectedSession.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {selectedSession.video_url}
                  </a>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setSelectedSession(null)}
                className="w-full text-xs py-2"
              >
                Tutup
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeacherManager;
