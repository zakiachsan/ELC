import React from 'react';
import { Card } from '../Card';
import { MOCK_SESSIONS, MOCK_USERS } from '../../constants';
import { UserRole } from '../../types';
import { Calendar, MapPin, Check, X } from 'lucide-react';
import { Button } from '../Button';

export const AttendanceManager: React.FC = () => {
  const students = MOCK_USERS.filter(u => u.role === UserRole.STUDENT);
  // Mock recent session
  const session = MOCK_SESSIONS[0];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Class Attendance</h2>

      <Card title={`Session: ${session.topic}`}>
        <div className="flex items-center gap-2 mb-6 text-gray-500 text-sm">
          <Calendar className="w-4 h-4" />
          {new Date(session.dateTime).toLocaleString()}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Location Check-in</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student, idx) => {
                // Mock statuses
                const isPresent = idx % 2 === 0;
                return (
                  <tr key={student.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                    <td className="px-4 py-3">
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                          <Check className="w-3 h-3" /> Present
                        </span>
                      ) : (
                         <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-bold">
                          <X className="w-3 h-3" /> Absent
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {isPresent ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span>-6.2088, 106.8456</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No Data</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" className="text-xs py-1 h-auto">
                        Override
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
