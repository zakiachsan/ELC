import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { useAttendance, useAttendanceStats } from '../../hooks/useAttendance';
import { useLocations } from '../../hooks/useProfiles';
import { useAuth } from '../../contexts/AuthContext';
import {
  Clock,
  MapPin,
  Calendar,
  LogIn,
  LogOut,
  Navigation,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const TeacherAttendance: React.FC = () => {
  const { user: currentTeacher } = useAuth();
  const { attendance, todayAttendance, loading, checkIn, checkOut, refetch } = useAttendance(currentTeacher?.id);
  const { locations: locationsData } = useLocations();

  // Current month/year for stats
  const now = new Date();
  const [statsMonth, setStatsMonth] = useState(now.getMonth() + 1);
  const [statsYear, setStatsYear] = useState(now.getFullYear());
  const { stats, loading: statsLoading } = useAttendanceStats(currentTeacher?.id || '', statsYear, statsMonth);

  // Check-in states
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        setLocationError('Failed to get location. Make sure GPS is active.');
        console.error('Geolocation error:', error);
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleCheckIn = async () => {
    if (!currentTeacher?.id || !selectedLocation) return;

    setIsCheckingIn(true);
    try {
      const selectedLoc = locationsData.find(l => l.id === selectedLocation);
      await checkIn({
        teacher_id: currentTeacher.id,
        location_id: selectedLocation,
        location_name: selectedLoc?.name || 'Unknown',
        latitude: currentPosition?.lat || null,
        longitude: currentPosition?.lng || null,
      });
      setShowCheckInModal(false);
      setSelectedLocation('');
    } catch (err) {
      console.error('Check-in error:', err);
      alert('Check-in failed. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance?.id) return;
    setIsCheckingIn(true);
    try {
      await checkOut(todayAttendance.id);
    } catch (err) {
      console.error('Check-out error:', err);
      alert('Check-out failed. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const prevMonth = () => {
    if (statsMonth === 1) {
      setStatsMonth(12);
      setStatsYear(statsYear - 1);
    } else {
      setStatsMonth(statsMonth - 1);
    }
  };

  const nextMonth = () => {
    if (statsMonth === 12) {
      setStatsMonth(1);
      setStatsYear(statsYear + 1);
    } else {
      setStatsMonth(statsMonth + 1);
    }
  };

  const monthName = new Date(statsYear, statsMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading attendance...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" /> Attendance
        </h2>
        <p className="text-xs text-gray-500">Manage attendance and view your attendance history.</p>
      </div>

      {/* Today's Attendance Card */}
      <Card className={`!p-4 ${todayAttendance && !todayAttendance.check_out_time ? 'bg-gradient-to-br from-green-50 to-white border-green-200' : 'bg-gradient-to-br from-orange-50 to-white border-orange-200'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${todayAttendance && !todayAttendance.check_out_time ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              {todayAttendance && !todayAttendance.check_out_time ? <LogOut className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Today's Attendance</div>
              <div className="text-sm font-bold text-gray-900 mt-1">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {todayAttendance ? (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <LogIn className="w-3 h-3" /> Check-in: {new Date(todayAttendance.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {todayAttendance.check_out_time && (
                      <span className="text-blue-600 font-medium flex items-center gap-1">
                        <LogOut className="w-3 h-3" /> Check-out: {new Date(todayAttendance.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {todayAttendance.location_name || 'Unknown Location'}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 mt-1">You haven't checked in today</div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {currentPosition && (
              <div className="text-[9px] text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                <Navigation className="w-3 h-3" /> GPS Active
              </div>
            )}
            {!todayAttendance ? (
              <Button
                onClick={() => setShowCheckInModal(true)}
                disabled={isCheckingIn}
                className="text-xs py-2 px-6"
              >
                {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check-in Now'}
              </Button>
            ) : !todayAttendance.check_out_time ? (
              <Button
                onClick={handleCheckOut}
                disabled={isCheckingIn}
                variant="outline"
                className="text-xs py-2 px-6 border-green-300 text-green-700 hover:bg-green-50"
              >
                {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check-out Now'}
              </Button>
            ) : (
              <span className="text-xs font-bold text-green-600 bg-green-100 px-4 py-2 rounded-full flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Attendance Complete
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Monthly Stats */}
      <Card className="!p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" /> Monthly Statistics
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xs font-medium text-gray-700 min-w-[120px] text-center">{monthName}</span>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        {statsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalDays}</div>
              <div className="text-[9px] font-black text-blue-400 uppercase">Total Days</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <div className="text-[9px] font-black text-green-400 uppercase">Present</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <div className="text-[9px] font-black text-yellow-400 uppercase">Late</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.earlyLeave}</div>
              <div className="text-[9px] font-black text-red-400 uppercase">Early Leave</div>
            </div>
          </div>
        )}
      </Card>

      {/* Attendance History */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-black text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" /> Attendance History
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {attendance.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No attendance history yet.
            </div>
          ) : (
            attendance.slice(0, 20).map((record) => (
              <div key={record.id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      record.status === 'PRESENT' ? 'bg-green-100 text-green-600' :
                      record.status === 'LATE' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {record.status === 'PRESENT' ? <CheckCircle className="w-4 h-4" /> :
                       record.status === 'LATE' ? <AlertCircle className="w-4 h-4" /> :
                       <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        {new Date(record.check_in_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <LogIn className="w-3 h-3 text-green-500" />
                          {new Date(record.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {record.check_out_time && (
                          <span className="flex items-center gap-1">
                            <LogOut className="w-3 h-3 text-blue-500" />
                            {new Date(record.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {record.location_name || 'Unknown'}
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      record.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                      record.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {record.status === 'PRESENT' ? 'Present' :
                       record.status === 'LATE' ? 'Late' : 'Early Leave'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md !p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <LogIn className="w-4 h-4 text-orange-600" /> Check-in
              </h3>
              <button onClick={() => setShowCheckInModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Select School Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-white mt-1"
                >
                  <option value="">Select location...</option>
                  {locationsData.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              {currentPosition ? (
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-[10px] text-green-700 flex items-center gap-1 font-medium">
                    <Navigation className="w-3 h-3" /> GPS Active
                  </p>
                  <p className="text-[9px] text-green-600 mt-1">
                    Coordinates: {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                  </p>
                </div>
              ) : locationError ? (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                  <p className="text-[10px] text-yellow-700">{locationError}</p>
                  <button
                    onClick={getCurrentLocation}
                    className="text-[10px] text-yellow-600 font-bold mt-1 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Getting location...
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <Button
                onClick={handleCheckIn}
                disabled={!selectedLocation || isCheckingIn}
                className="flex-1 text-xs py-2"
              >
                {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Check-in'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
