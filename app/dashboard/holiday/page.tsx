'use client';

import React, { useEffect, useState } from 'react';
import { holidaysService } from '@/lib/api/holidayService';
import { HolidayCalendarDTO } from '@/lib/api/types';
import { format } from 'date-fns';

const HolidayCalendarPage: React.FC = () => {
  const [holidays, setHolidays] = useState<HolidayCalendarDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayCalendarDTO | null>(null);

  // Available years and regions for filtering
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const regions = ['All', ...new Set(holidays.map((h) => h.locationRegion))];

  // Fetch holidays on mount and when filters change
  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await holidaysService.getAllCalendars();
        if (response.flag && response.response) {
          setHolidays(response.response);
          setError(null);
        } else {
          setError({ message: response.message || 'Failed to fetch holidays' });
        }
      } catch (err: unknown) {
        let errorMessage = 'Failed to fetch holidays';
        let errorStatus: number | undefined;
        if (err instanceof Error) {
          try {
            const parsedError = JSON.parse(err.message);
            errorMessage = parsedError.message;
            errorStatus = parsedError.status;
          } catch {
            errorMessage = err.message;
          }
        }
        setError({ message: errorMessage, status: errorStatus });
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  // Filter holidays based on year and region
  const filteredHolidays = holidays.filter((holiday) => {
    const holidayDate = new Date(holiday.holidayDate);
    const matchesYear = holidayDate.getFullYear() === selectedYear;
    const matchesRegion = selectedRegion === 'All' || holiday.locationRegion === selectedRegion;
    return matchesYear && matchesRegion;
  });

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  // Format holiday type
  const formatHolidayType = (type: string): string => {
    return type
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Holiday Calendar</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-gray-600">Loading holidays...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-6 py-4 rounded-lg mb-6 shadow-sm">
          <p className="font-medium">
            {error.status === 500
              ? 'Server error occurred. Please try again later.'
              : error.message}
            {error.status && ` (Error code: ${error.status})`}
          </p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              holidaysService.getAllCalendars().then((response) => {
                if (response.flag && response.response) {
                  setHolidays(response.response);
                  setError(null);
                } else {
                  setError({ message: response.message || 'Failed to fetch holidays' });
                }
                setLoading(false);
              }).catch((err: unknown) => {
                let errorMessage = 'Failed to fetch holidays';
                let errorStatus: number | undefined;
                if (err instanceof Error) {
                  try {
                    const parsedError = JSON.parse(err.message);
                    errorMessage = parsedError.message;
                    errorStatus = parsedError.status;
                  } catch {
                    errorMessage = err.message;
                  }
                }
                setError({ message: errorMessage, status: errorStatus });
                setLoading(false);
              });
            }}
            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredHolidays.length === 0 && (
        <div className="text-center py-12 text-gray-600 text-lg bg-white rounded-lg shadow-sm">
          No holidays found for {selectedRegion} in {selectedYear}.
        </div>
      )}

      {/* Table View */}
      {!loading && !error && filteredHolidays.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Holiday Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredHolidays.map((holiday) => (
                <tr
                  key={holiday.holidayCalendarId}
                  className="hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                  onClick={() => setSelectedHoliday(holiday)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {holiday.holidayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(holiday.holidayDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatHolidayType(holiday.holidayType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {holiday.locationRegion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {holiday.calendarDescription || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Holiday Details Modal */}
      {selectedHoliday && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedHoliday.holidayName}</h2>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Date:</strong> {formatDate(selectedHoliday.holidayDate)}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Type:</strong> {formatHolidayType(selectedHoliday.holidayType)}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Region:</strong> {selectedHoliday.locationRegion}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Recurrence:</strong> {selectedHoliday.recurrenceRule}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Description:</strong> {selectedHoliday.calendarDescription || 'N/A'}
            </p>
            <button
              onClick={() => setSelectedHoliday(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendarPage;