'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { HolidayCalendarDTO, WebResponseDTO } from '@/lib/api/types';
import { ArrowLeft, XCircle } from 'lucide-react';
import { holidaysService } from '@/lib/api/holidayService';

const HolidayPage: React.FC = () => {
  const router = useRouter();
  const { state: { accessToken, user } } = useAuth();
  const [holidayCalendars, setHolidayCalendars] = useState<HolidayCalendarDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [sort, setSort] = useState<{ field: keyof Pick<HolidayCalendarDTO, 'holidayName' | 'holidayDate' | 'holidayType'>; direction: 'asc' | 'desc' }>({
    field: 'holidayDate',
    direction: 'asc',
  });

  // Handle authentication redirect
  useEffect(() => {
    if (!user || !accessToken) {
      console.log('🧩 Redirecting to /auth/login due to missing user or accessToken');
      router.push('/auth/login');
    }
  }, [user, accessToken, router]);

  // Fetch holiday calendars
  const fetchHolidayCalendars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!accessToken || !user || user.role !== 'MANAGER') {
        throw new Error('Unauthorized access. Please log in as a manager.');
      }

      const response: WebResponseDTO<HolidayCalendarDTO[]> = await holidaysService.getAllCalendars();
      console.log('🧩 Holiday calendars fetched:', response);
      if (!response.flag || response.response === null) {
        throw new Error(
          response.message.includes('assignedManager') || response.message.includes('createdByAdminId')
            ? 'Unable to load holiday data. Some data may be misconfigured. Please check settings or contact support.'
            : response.message || 'Failed to fetch holiday calendars'
        );
      }
      // Sort calendars based on current sort state
      const sortedCalendars = [...response.response].sort((a, b) => {
        const fieldA = a[sort.field];
        const fieldB = b[sort.field];
        if (sort.field === 'holidayDate') {
          const dateA = fieldA as string | undefined;
          const dateB = fieldB as string | undefined;
          return sort.direction === 'asc'
            ? new Date(dateA || '1970-01-01').getTime() - new Date(dateB || '1970-01-01').getTime()
            : new Date(dateB || '1970-01-01').getTime() - new Date(dateA || '1970-01-01').getTime();
        }
        return sort.direction === 'asc'
          ? String(fieldA ?? '').localeCompare(String(fieldB ?? ''))
          : String(fieldB ?? '').localeCompare(String(fieldA ?? ''));
      });
      setHolidayCalendars(sortedCalendars);
    } catch (err: any) {
      setError(
        err.message.includes('assignedManager') || err.message.includes('createdByAdminId')
          ? 'Unable to load holiday data. Some data may be misconfigured. Please check settings or contact support.'
          : err.message || 'Failed to load holiday data. Please try again.'
      );
      console.error('❌ Error fetching holiday calendars:', err);
      setHolidayCalendars([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user, sort]);

  useEffect(() => {
    if (user && accessToken) {
      fetchHolidayCalendars();
    }
  }, [fetchHolidayCalendars, user, accessToken]);

  // Handle sort changes
  const handleSortChange = (field: keyof Pick<HolidayCalendarDTO, 'holidayName' | 'holidayDate' | 'holidayType'>) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Dynamic label generation for holiday types
  const getLabel = (value: string): string => {
    const words = value.toLowerCase().split('_');
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="text-gray-600 mt-4">Loading holiday calendars...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          {error.includes('403') ? 'You do not have permission to view this page. Please contact your administrator.' : error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Confirmation Message */}
      {confirmation && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg flex justify-between items-center mb-6">
          <span>{confirmation}</span>
          <button
            onClick={() => setConfirmation(null)}
            className="text-green-700 hover:text-green-900"
          >
            <XCircle size={20} />
          </button>
        </div>
      )}

     {/* Header */}
     <div className="max-w-7xl mx-auto mb-10">
        <div className="relative flex items-center justify-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Holiday Calendar
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
       
        {holidayCalendars.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    <button
                      onClick={() => handleSortChange('holidayName')}
                      className="flex items-center gap-1"
                    >
                      Holiday Name {sort.field === 'holidayName' && (sort.direction === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    <button
                      onClick={() => handleSortChange('holidayDate')}
                      className="flex items-center gap-1"
                    >
                      Date {sort.field === 'holidayDate' && (sort.direction === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    <button
                      onClick={() => handleSortChange('holidayType')}
                      className="flex items-center gap-1"
                    >
                      Type {sort.field === 'holidayType' && (sort.direction === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    Region
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holidayCalendars.map((holiday) => (
                  <tr key={holiday.holidayCalendarId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-base font-medium text-gray-900">
                      {holiday.holidayName ?? 'Unknown'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {holiday.holidayDate ? new Date(holiday.holidayDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {holiday.holidayType ? getLabel(holiday.holidayType) : 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {holiday.locationRegion ?? 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No holiday calendars found.</p>
        )}
      </div>
    </div>
  );
};

export default HolidayPage;