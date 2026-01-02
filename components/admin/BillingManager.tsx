
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { CreditCard, Search, Filter, Download, CheckCircle, Clock, Smartphone, User, Calendar, Trash2, X, MessageCircle, Send, Loader2 } from 'lucide-react';
import { useInvoices } from '../../hooks/useBilling';
import { TuitionInvoice } from '../../types';

export const BillingManager: React.FC = () => {
  const { invoices: invoicesData, loading, error, markAsPaid: markInvoicePaid, recordReminder } = useInvoices();
  const [monthFilter, setMonthFilter] = useState('November 2024');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // WhatsApp Reminder State
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<TuitionInvoice | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');

  // Map database format to component format
  const invoices: TuitionInvoice[] = invoicesData.map(inv => ({
    id: inv.id,
    studentId: inv.student_id,
    studentName: inv.student_name || 'Unknown',
    month: inv.month,
    amount: inv.amount,
    dueDate: inv.due_date,
    status: inv.status as 'PAID' | 'UNPAID',
    remindedAt: inv.reminded_at || undefined,
  }));

  const handleMarkAsPaid = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menandai tagihan ini sebagai LUNAS? Tindakan ini akan secara manual mengubah status transaksi dan dianggap pembayaran telah diterima via Midtrans/Transfer.")) {
      try {
        await markInvoicePaid(id);
      } catch (err) {
        console.error('Error marking as paid:', err);
        alert('Failed to update invoice status.');
      }
    }
  };

  const openWhatsAppReminder = (inv: TuitionInvoice) => {
    setReminderTarget(inv);
    // Template as requested: "Reminder pembayaran tagihan atas nama x bulan y"
    const template = `Halo Bapak/Ibu, kami dari Admin ELC ingin menginformasikan pengingat (Reminder) pembayaran tagihan SPP bulanan atas nama ${inv.studentName} untuk periode bulan ${inv.month} sebesar Rp ${inv.amount.toLocaleString()}. Mohon segera melakukan pembayaran sebelum batas waktu. Terima kasih.`;
    setReminderMessage(template);
    setIsReminderOpen(true);
  };

  const handleSendReminder = async () => {
    if (!reminderTarget) return;

    try {
      // Record reminder timestamp in database
      await recordReminder(reminderTarget.id);

      // Actually open WA (simulation)
      const phoneNumber = "08123456789"; // In production, fetch linked parent's WA from User records
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(reminderMessage)}`, '_blank');

      setIsReminderOpen(false);
      setReminderTarget(null);
    } catch (err) {
      console.error('Error recording reminder:', err);
      alert('Failed to record reminder.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading invoices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading invoices: {error.message}
      </div>
    );
  }

  const filteredInvoices = invoices.filter(inv => {
    const matchesMonth = inv.month === monthFilter;
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesSearch = inv.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesStatus && matchesSearch;
  });

  const totalCollected = filteredInvoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
  const totalOutstanding = filteredInvoices.filter(i => i.status === 'UNPAID').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" /> Billing & SPP
          </h2>
          <p className="text-xs text-gray-500">Monitor monthly student tuition payments.</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-green-50 border border-green-100 px-3 py-1.5 rounded-xl text-right">
              <div className="text-[9px] font-bold text-green-600 uppercase">Collected</div>
              <div className="text-sm font-black text-green-900">Rp {totalCollected.toLocaleString()}</div>
           </div>
           <div className="bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl text-right">
              <div className="text-[9px] font-bold text-red-600 uppercase">Outstanding</div>
              <div className="text-sm font-black text-red-900">Rp {totalOutstanding.toLocaleString()}</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
         <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search student..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-teal-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
         <select
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-600 bg-white cursor-pointer hover:bg-gray-50 outline-none"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
         >
            <option>October 2024</option>
            <option>November 2024</option>
            <option>December 2024</option>
         </select>
         <select
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-600 bg-white cursor-pointer hover:bg-gray-50 outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
         >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid Only</option>
            <option value="UNPAID">Unpaid Only</option>
         </select>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Due Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-[10px]">{inv.studentName.charAt(0)}</div>
                       <div>
                          <div className="text-xs font-bold text-gray-900">{inv.studentName}</div>
                          <div className="text-[9px] text-gray-400 font-bold uppercase">{inv.month}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs font-bold text-gray-900">Rp {inv.amount.toLocaleString()}</td>
                  <td className="px-3 py-2 text-[10px] font-bold text-gray-500">{new Date(inv.dueDate).toLocaleDateString('id-ID')}</td>
                  <td className="px-3 py-2">
                     <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 w-fit ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                        {inv.status === 'PAID' ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        {inv.status}
                     </span>
                     {inv.remindedAt && inv.status === 'UNPAID' && (
                        <div className="text-[8px] text-orange-500 font-bold mt-0.5">Reminded: {new Date(inv.remindedAt).toLocaleDateString()}</div>
                     )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                       {inv.status === 'UNPAID' ? (
                          <>
                             <button
                                onClick={() => handleMarkAsPaid(inv.id)}
                                className="px-2 py-1 bg-green-600 text-white text-[9px] font-bold uppercase rounded hover:bg-green-700 transition-all"
                             >
                                Mark Paid
                             </button>
                             <button
                                onClick={() => openWhatsAppReminder(inv)}
                                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded border border-green-200 transition-all"
                                title="Kirim Tagihan via WhatsApp"
                             >
                                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                             </button>
                          </>
                       ) : (
                          <span className="text-[9px] text-gray-300 font-bold uppercase italic">Verified</span>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                 <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400 text-xs italic">No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* WHATSAPP REMINDER MODAL - COMPACT */}
      {isReminderOpen && reminderTarget && (
         <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden relative border border-gray-100">
               <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
                           <MessageCircle className="w-5 h-5 fill-current" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Kirim Reminder WA</h3>
                     </div>
                     <button onClick={() => setIsReminderOpen(false)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-md"><Smartphone className="w-4 h-4" /></div>
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Penerima</p>
                           <p className="text-xs font-bold text-gray-800">0812-3456-7890</p>
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Draft Pesan</label>
                        <textarea 
                           className="w-full border border-gray-200 rounded-xl p-3 text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all h-32 font-medium text-gray-700 leading-relaxed"
                           value={reminderMessage}
                           onChange={e => setReminderMessage(e.target.value)}
                        />
                     </div>
                  </div>

                  <div className="pt-2">
                     <Button 
                        onClick={handleSendReminder}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] shadow-lg border-none"
                     >
                        <Send className="w-3.5 h-3.5" /> Send to WhatsApp
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
