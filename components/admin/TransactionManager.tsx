
import React, { useState } from 'react';
import { Card } from '../Card';
import { CreditCard, Search, Download, Filter, CheckCircle, BookOpen, Trophy, Loader2 } from 'lucide-react';
import { useTransactions } from '../../hooks/useBilling';
import { Transaction } from '../../types';

export const TransactionManager: React.FC = () => {
  const { transactions: txData, loading, error } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LEARNING_HUB' | 'OLYMPIAD'>('ALL');

  // Map database format to component format and filter successful transactions
  const allTransactions: Transaction[] = txData.map(tx => ({
    id: tx.id,
    studentId: tx.student_id,
    studentName: tx.student_name || 'Unknown',
    type: tx.type as 'LEARNING_HUB' | 'OLYMPIAD',
    itemName: tx.item_name,
    amount: tx.amount,
    status: tx.status as 'SUCCESS' | 'PENDING' | 'FAILED',
    paymentMethod: tx.payment_method || undefined,
    timestamp: tx.created_at,
  }));

  // Only show successful transactions (online payments that went through)
  const successfulTransactions = allTransactions.filter(t => t.status === 'SUCCESS');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading transactions: {error.message}
      </div>
    );
  }

  const filteredTransactions = successfulTransactions.filter(t => {
    const matchesSearch = t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalRevenue = successfulTransactions.reduce((sum, t) => sum + t.amount, 0);
  const learningHubRevenue = successfulTransactions.filter(t => t.type === 'LEARNING_HUB').reduce((sum, t) => sum + t.amount, 0);
  const olympiadRevenue = successfulTransactions.filter(t => t.type === 'OLYMPIAD').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" /> Transaksi Online
          </h2>
          <p className="text-xs text-gray-500">Pembayaran online yang berhasil (Learning Hub & Olimpiade).</p>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-teal-600" />
            <span className="text-[9px] font-black text-teal-600 uppercase tracking-wider">Total Pendapatan</span>
          </div>
          <div className="text-lg font-black text-teal-900">Rp {totalRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-teal-600">{successfulTransactions.length} transaksi</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span className="text-[9px] font-black text-purple-600 uppercase tracking-wider">Learning Hub</span>
          </div>
          <div className="text-lg font-black text-purple-900">Rp {learningHubRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-purple-600">{successfulTransactions.filter(t => t.type === 'LEARNING_HUB').length} langganan</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-orange-600" />
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider">Olimpiade</span>
          </div>
          <div className="text-lg font-black text-orange-900">Rp {olympiadRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-orange-600">{successfulTransactions.filter(t => t.type === 'OLYMPIAD').length} pendaftaran</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-2">
         <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama siswa, item, atau TX ID..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-teal-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
           <button
             onClick={() => setTypeFilter('ALL')}
             className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${typeFilter === 'ALL' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Semua
           </button>
           <button
             onClick={() => setTypeFilter('LEARNING_HUB')}
             className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${typeFilter === 'LEARNING_HUB' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <BookOpen className="w-3 h-3" /> Hub
           </button>
           <button
             onClick={() => setTypeFilter('OLYMPIAD')}
             className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${typeFilter === 'OLYMPIAD' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <Trophy className="w-3 h-3" /> Olimpiade
           </button>
         </div>
         <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-900 transition-colors">
            <Download className="w-3 h-3" /> Export
         </button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-3 py-2">TX ID</th>
              <th className="px-3 py-2">Siswa</th>
              <th className="px-3 py-2">Tipe</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Jumlah</th>
              <th className="px-3 py-2">Metode</th>
              <th className="px-3 py-2">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 text-[10px] font-mono text-gray-500 uppercase">{tx.id}</td>
                <td className="px-3 py-2">
                  <div className="text-xs font-bold text-gray-900">{tx.studentName}</div>
                  <div className="text-[9px] text-gray-400">ID: {tx.studentId}</div>
                </td>
                <td className="px-3 py-2">
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    tx.type === 'LEARNING_HUB' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {tx.type === 'LEARNING_HUB' ? <BookOpen className="w-2.5 h-2.5" /> : <Trophy className="w-2.5 h-2.5" />}
                    {tx.type === 'LEARNING_HUB' ? 'Hub' : 'Olimpiade'}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs text-gray-700 max-w-[180px] truncate">{tx.itemName}</div>
                </td>
                <td className="px-3 py-2">
                   <div className="text-xs font-bold text-gray-900">Rp {tx.amount.toLocaleString()}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-[10px] text-gray-600">{tx.paymentMethod || '-'}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-[10px] text-gray-500">
                    {new Date(tx.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-[9px] text-gray-400">
                    {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-xs italic">Tidak ada transaksi ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
