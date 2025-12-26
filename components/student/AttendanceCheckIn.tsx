import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MapPin, Clock, Check } from 'lucide-react';

export const AttendanceCheckIn: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setTime(new Date().toLocaleTimeString());
        setStatus('success');
      },
      (error) => {
        console.error(error);
        setStatus('error');
      }
    );
  };

  return (
    <Card className="max-w-md mx-auto">
      <div className="text-center space-y-4">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
          <MapPin className="w-8 h-8 text-blue-600" />
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-gray-900">Class Attendance</h3>
          <p className="text-sm text-gray-500">Verify your location to check in.</p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
              <Check className="w-5 h-5" />
              Check-in Successful
            </div>
            <div className="text-xs text-green-800 space-y-1">
              <p>Time: {time}</p>
              <p>Lat: {location?.lat.toFixed(4)}, Lng: {location?.lng.toFixed(4)}</p>
            </div>
          </div>
        ) : (
          <Button 
            onClick={handleCheckIn} 
            isLoading={status === 'locating'}
            className="w-full"
          >
            {status === 'locating' ? 'Verifying Location...' : 'Check In Now'}
          </Button>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-600">
            Could not verify location. Please allow permissions.
          </p>
        )}
      </div>
    </Card>
  );
};