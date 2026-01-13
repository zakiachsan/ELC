import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../Card';
import {
  Trophy, Eye, Star, MessageSquare, TrendingUp,
  Calendar, Users, Search, Loader2, ChevronDown, LogIn
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import parentEngagementService, { 
  ParentEngagementStats, 
  formatMonth,
  getCurrentMonth 
} from '../../services/parentEngagement.service';

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'teal';
}> = ({ icon, label, value, color }) => {
  const bgColors = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-400',
    green: 'bg-gradient-to-r from-green-500 to-green-400',
    yellow: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-400',
    teal: 'bg-gradient-to-r from-teal-500 to-teal-400'
  };
  
  return (
    <Card className={`${bgColors[color]} !p-4`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5 text-white' })}
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
          <div className="text-xs text-white/80">{label}</div>
        </div>
      </div>
    </Card>
  );
};

// Rank Badge Component
const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-white font-bold shadow-lg">
        <Trophy className="w-4 h-4" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-gray-700 font-bold">
        {rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white font-bold">
        {rank}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-gray-500 font-medium">
      {rank}
    </span>
  );
};

// Chart colors
const CHART_COLORS = ['#3B82F6', '#F59E0B', '#8B5CF6'];

export const ParentEngagementRanking: React.FC = () => {
  const [viewMode, setViewMode] = useState<'cumulative' | 'monthly'>('cumulative');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [rankings, setRankings] = useState<ParentEngagementStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load available months on mount
  useEffect(() => {
    const loadMonths = async () => {
      try {
        const months = await parentEngagementService.getAvailableMonths();
        setAvailableMonths(months);
        if (months.length > 0 && !months.includes(selectedMonth)) {
          setSelectedMonth(months[0]);
        }
      } catch (error) {
        console.error('Error loading months:', error);
      }
    };
    loadMonths();
  }, []);

  // Load rankings based on view mode
  useEffect(() => {
    const loadRankings = async () => {
      setLoading(true);
      try {
        if (viewMode === 'cumulative') {
          const data = await parentEngagementService.getCumulativeRanking();
          setRankings(data);
        } else if (selectedMonth) {
          const data = await parentEngagementService.getMonthlyRanking(selectedMonth);
          setRankings(data);
        }
      } catch (error) {
        console.error('Error loading rankings:', error);
      }
      setLoading(false);
    };
    loadRankings();
  }, [viewMode, selectedMonth]);

  // Filter by search
  const filteredRankings = useMemo(() => {
    if (!searchQuery) return rankings;
    const q = searchQuery.toLowerCase();
    return rankings.filter(r => 
      r.parentName.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.parentEmail.toLowerCase().includes(q)
    );
  }, [rankings, searchQuery]);

  // Chart data (top 10)
  const chartData = useMemo(() => {
    return filteredRankings.slice(0, 10).map((r, idx) => ({
      name: r.parentName.split(' ')[0], // First name only for chart
      sessions: r.sessions,
      pageViews: r.pageViews,
      reviews: r.teacherReviews,
      feedback: r.feedbackCount,
      total: r.totalEngagement,
      rank: idx + 1
    }));
  }, [filteredRankings]);

  // Calculate totals
  const totals = useMemo(() => ({
    parents: rankings.length,
    sessions: rankings.reduce((sum, r) => sum + r.sessions, 0),
    pageViews: rankings.reduce((sum, r) => sum + r.pageViews, 0),
    reviews: rankings.reduce((sum, r) => sum + r.teacherReviews, 0),
    feedback: rankings.reduce((sum, r) => sum + r.feedbackCount, 0),
  }), [rankings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Parent Engagement Ranking
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track parent engagement melalui kunjungan dashboard, review guru, dan feedback
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('cumulative')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'cumulative' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cumulative
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'monthly' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Month Filter (only for monthly view) */}
      {viewMode === 'monthly' && (
        <div className="relative w-fit">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white min-w-48"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={<Users />}
          label="Total Parents"
          value={totals.parents}
          color="blue"
        />
        <StatCard
          icon={<LogIn />}
          label="Total Sessions"
          value={totals.sessions}
          color="teal"
        />
        <StatCard
          icon={<Eye />}
          label="Total Page Views"
          value={totals.pageViews}
          color="green"
        />
        <StatCard
          icon={<Star />}
          label="Total Reviews"
          value={totals.reviews}
          color="yellow"
        />
        <StatCard
          icon={<MessageSquare />}
          label="Total Feedback"
          value={totals.feedback}
          color="purple"
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="!p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Top 10 Most Engaged Parents
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="sessions" name="Sessions" fill="#14B8A6" stackId="stack" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pageViews" name="Page Views" fill="#3B82F6" stackId="stack" radius={[0, 0, 0, 0]} />
              <Bar dataKey="reviews" name="Reviews" fill="#F59E0B" stackId="stack" radius={[0, 0, 0, 0]} />
              <Bar dataKey="feedback" name="Feedback" fill="#8B5CF6" stackId="stack" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama parent atau student..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Rankings Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <LogIn className="w-3.5 h-3.5" />
                    Sessions
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Views
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    Reviews
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Feedback
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Total
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    <p className="mt-2 text-sm text-gray-500">Loading data...</p>
                  </td>
                </tr>
              ) : filteredRankings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">Belum ada data engagement</p>
                  </td>
                </tr>
              ) : (
                filteredRankings.map((ranking, index) => (
                  <tr key={ranking.parentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <RankBadge rank={index + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{ranking.parentName}</div>
                      <div className="text-xs text-gray-500">{ranking.parentEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ranking.studentName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                        {ranking.sessions}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {ranking.pageViews}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        {ranking.teacherReviews}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {ranking.feedbackCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-900 text-white">
                        {ranking.totalEngagement}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Footer */}
      <div className="text-xs text-gray-500 text-center">
        <p>Engagement Score = Sessions + Page Views + Teacher Reviews + Feedback Submissions</p>
        <p className="mt-1">
          {viewMode === 'cumulative'
            ? 'Menampilkan data dari semua periode'
            : `Menampilkan data untuk ${formatMonth(selectedMonth)}`
          }
        </p>
      </div>
    </div>
  );
};

export default ParentEngagementRanking;
