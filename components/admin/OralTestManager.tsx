
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  Phone, Plus, Pencil, Trash2, Calendar, Clock, User,
  CheckCircle, XCircle, MessageCircle, Video, ChevronRight
} from 'lucide-react';

// Types
interface OralTestSlot {
  id: string;
  date: string;
  day: string;
  times: string[];
}

interface OralTestBooking {
  id: string;
  studentName: string;
  studentPhone: string;
  sessionId: string;
  cefrLevel: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

// Mock Data
const INITIAL_SLOTS: OralTestSlot[] = [
  { id: 'slot-1', date: '2025-01-06', day: 'Senin', times: ['09:00', '10:00', '14:00', '15:00'] },
  { id: 'slot-2', date: '2025-01-07', day: 'Selasa', times: ['09:00', '10:00', '11:00', '14:00'] },
  { id: 'slot-3', date: '2025-01-08', day: 'Rabu', times: ['10:00', '11:00', '15:00', '16:00'] },
  { id: 'slot-4', date: '2025-01-09', day: 'Kamis', times: ['09:00', '14:00', '15:00'] },
  { id: 'slot-5', date: '2025-01-10', day: 'Jumat', times: ['09:00', '10:00', '11:00'] },
];

const INITIAL_BOOKINGS: OralTestBooking[] = [
  {
    id: 'book-1',
    studentName: 'Ahmad Fauzi',
    studentPhone: '081234567890',
    sessionId: 'FT-AHM-123456',
    cefrLevel: 'B1',
    date: '2025-01-06',
    time: '09:00',
    status: 'confirmed',
    createdAt: '2024-12-27'
  },
  {
    id: 'book-2',
    studentName: 'Siti Nurhaliza',
    studentPhone: '081234567891',
    sessionId: 'FT-SIT-654321',
    cefrLevel: 'A2',
    date: '2025-01-07',
    time: '10:00',
    status: 'pending',
    createdAt: '2024-12-27'
  },
  {
    id: 'book-3',
    studentName: 'Budi Santoso',
    studentPhone: '081234567892',
    sessionId: 'FT-BUD-789012',
    cefrLevel: 'B2',
    date: '2025-01-06',
    time: '14:00',
    status: 'completed',
    createdAt: '2024-12-26'
  },
];

export const OralTestManager: React.FC = () => {
  const [slots, setSlots] = useState<OralTestSlot[]>(INITIAL_SLOTS);
  const [bookings, setBookings] = useState<OralTestBooking[]>(INITIAL_BOOKINGS);
  const [activeTab, setActiveTab] = useState<'bookings' | 'slots'>('bookings');
  const [editingSlot, setEditingSlot] = useState<OralTestSlot | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTimes, setNewSlotTimes] = useState<string[]>([]);

  const getDayName = (dateStr: string) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date(dateStr).getDay()];
  };

  const handleAddSlot = () => {
    setEditingSlot(null);
    setNewSlotDate('');
    setNewSlotTimes([]);
    setShowSlotModal(true);
  };

  const handleEditSlot = (slot: OralTestSlot) => {
    setEditingSlot(slot);
    setNewSlotDate(slot.date);
    setNewSlotTimes([...slot.times]);
    setShowSlotModal(true);
  };

  const handleDeleteSlot = (id: string) => {
    if (window.confirm('Hapus slot ini?')) {
      setSlots(slots.filter(s => s.id !== id));
    }
  };

  const handleSaveSlot = () => {
    if (!newSlotDate || newSlotTimes.length === 0) {
      alert('Pilih tanggal dan minimal 1 waktu!');
      return;
    }

    const newSlot: OralTestSlot = {
      id: editingSlot?.id || `slot-${Date.now()}`,
      date: newSlotDate,
      day: getDayName(newSlotDate),
      times: newSlotTimes.sort()
    };

    if (editingSlot) {
      setSlots(slots.map(s => s.id === editingSlot.id ? newSlot : s));
    } else {
      setSlots([...slots, newSlot].sort((a, b) => a.date.localeCompare(b.date)));
    }

    setShowSlotModal(false);
  };

  const toggleTime = (time: string) => {
    if (newSlotTimes.includes(time)) {
      setNewSlotTimes(newSlotTimes.filter(t => t !== time));
    } else {
      setNewSlotTimes([...newSlotTimes, time]);
    }
  };

  const handleUpdateBookingStatus = (id: string, status: OralTestBooking['status']) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleWhatsAppReminder = (booking: OralTestBooking) => {
    const message = encodeURIComponent(
      `Halo ${booking.studentName}!\n\n` +
      `Reminder Oral Test:\n` +
      `📅 ${new Date(booking.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}\n` +
      `⏰ ${booking.time} WIB\n` +
      `📋 ${booking.sessionId}\n` +
      `📊 CEFR: ${booking.cefrLevel}\n\n` +
      `Tim ELC`
    );
    window.open(`https://wa.me/${booking.studentPhone.replace(/^0/, '62')}?text=${message}`, '_blank');
  };

  const availableTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const getStatusBadge = (status: OralTestBooking['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Done',
      cancelled: 'Cancel'
    };
    return (
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-teal-600" /> Oral Test Manager
          </h2>
          <p className="text-xs text-gray-500">Kelola jadwal dan booking oral test.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="!p-3 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100">
          <p className="text-[9px] font-bold text-yellow-600 uppercase">Pending</p>
          <p className="text-xl font-bold text-yellow-900">{bookings.filter(b => b.status === 'pending').length}</p>
        </Card>
        <Card className="!p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <p className="text-[9px] font-bold text-blue-600 uppercase">Confirmed</p>
          <p className="text-xl font-bold text-blue-900">{bookings.filter(b => b.status === 'confirmed').length}</p>
        </Card>
        <Card className="!p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <p className="text-[9px] font-bold text-green-600 uppercase">Done</p>
          <p className="text-xl font-bold text-green-900">{bookings.filter(b => b.status === 'completed').length}</p>
        </Card>
        <Card className="!p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
          <p className="text-[9px] font-bold text-purple-600 uppercase">Slots</p>
          <p className="text-xl font-bold text-purple-900">{slots.reduce((sum, s) => sum + s.times.length, 0)}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'bookings'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Booking List
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'slots'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Manage Slots
        </button>
      </div>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-2.5">Student</th>
                <th className="px-4 py-2.5">Session</th>
                <th className="px-4 py-2.5">Jadwal</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{booking.studentName}</div>
                        <div className="text-[10px] text-gray-400">{booking.studentPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-[10px] font-mono text-blue-600 font-semibold">{booking.sessionId}</div>
                    <div className="text-[10px] text-gray-400">CEFR: {booking.cefrLevel}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1 text-xs text-gray-700">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {new Date(booking.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Clock className="w-2.5 h-2.5 text-gray-400" />
                      {booking.time} WIB
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-all"
                          title="Confirm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="Mark Done"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleWhatsAppReminder(booking)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-all"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                          title="Cancel"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <Phone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Belum ada booking.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Slots Tab */}
      {activeTab === 'slots' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={handleAddSlot} className="bg-teal-600 hover:bg-teal-700 text-xs py-1.5 px-3">
              Tambah Slot
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {slots.map(slot => (
              <Card key={slot.id} className="!p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{slot.day}</p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(slot.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => handleEditSlot(slot)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDeleteSlot(slot.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {slot.times.map(time => (
                    <span key={time} className="px-2 py-1 bg-teal-50 text-teal-700 text-[10px] font-medium rounded">
                      {time}
                    </span>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400">{slot.times.length} slot</p>
              </Card>
            ))}
            {slots.length === 0 && (
              <Card className="!p-6 text-center col-span-full">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Belum ada slot.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm !p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">
              {editingSlot ? 'Edit Slot' : 'Tambah Slot'}
            </h3>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase">Pilih Tanggal</label>
              <input
                type="date"
                value={newSlotDate}
                onChange={(e) => setNewSlotDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase">Pilih Waktu</label>
              <div className="flex flex-wrap gap-1.5">
                {availableTimes.map(time => (
                  <button
                    key={time}
                    onClick={() => toggleTime(time)}
                    className={`px-2.5 py-1.5 text-[10px] font-medium rounded border transition-all ${
                      newSlotTimes.includes(time)
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-gray-400">{newSlotTimes.length} waktu dipilih</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSlotModal(false)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <Button onClick={handleSaveSlot} className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs py-1.5">
                Simpan
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
