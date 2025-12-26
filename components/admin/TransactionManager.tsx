
import React, { useState } from 'react';
import { Card } from '../Card';
import { CreditCard, Search, Download, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { MOCK_TRANSACTIONS } from '../../constants';
import { Transaction } from '../../types';

export const TransactionManager: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions.filter(t => 
    t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.olympiadTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = transactions
    .filter(t => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-600" /> Transaction Logs
          </h2>
          <p className="text-gray-500">Monitor all student payments and competition registrations.</p>
        </div>
        <div className="bg-teal-50 border border-teal-100 px-6 py-3 rounded-2xl text-right">
           <div className="text-xs font-bold text-teal-600 uppercase tracking-widest">Total Revenue</div>
           <div className="text-2xl font-black text-teal-900">Rp {totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by student, competition, or TX ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" /> Filter
         </button>
         <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-900 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
         </button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Olympiad</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-gray-500 uppercase">{tx.id}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{tx.studentName}</div>
                  <div className="text-[10px] text-gray-400">ID: {tx.studentId}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-700">{tx.olympiadTitle}</div>
                </td>
                <td className="px-6 py-4">
                   <div className="text-sm font-black text-gray-900">Rp {tx.amount.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                    tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                    tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {tx.status === 'SUCCESS' ? <CheckCircle className="w-3 h-3" /> : 
                     tx.status === 'PENDING' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {tx.status}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(tx.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
