'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { holidaysService } from '@/lib/api/holidayService';
import { leaveService } from '@/lib/api/leaveService';
import { HolidayCalendarDTO, EmployeeLeaveDayDTO, LeaveResponseDTO, PageLeaveResponseDTO, LeaveCategoryType } from '@/lib/api/types';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay, eachDayOfInterval, parseISO } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

const EmployeeCalendarPage: React.FC = () => {
  const router = useRouter();
  const { state } = useAuth();
  const employeeId = state.user?.userId ?? null;

  const [holidays, setHolidays] = useState<HolidayCalendarDTO[]>([]);
  const [leaves, setLeaves] = useState<EmployeeLeaveDayDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedLeaveCategory, setSelectedLeaveCategory] = useState<string>('All');
  const [selectedDateDetails, setSelectedDateDetails] = useState<{
    holidays: HolidayCalendarDTO[];
    leaves: EmployeeLeaveDayDTO[];
  } | null>(null);

  // Available filters
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = Array.from({ length: 13 }, (_, i) => i === 0 ? 'All' : i.toString());
  const regions = ['All', ...new Set(holidays.map((h) => h.locationRegion))];
  const leaveCategories = ['All', 'SICK', 'CASUAL', 'PLANNED', 'UNPLANNED'];

  // Convert LeaveResponseDTO to EmployeeLeaveDayDTO
  const convertToLeaveDays = (leaveRequests: LeaveResponseDTO[]): EmployeeLeaveDayDTO[] => {
    const leaveDays: EmployeeLeaveDayDTO[] = [];
    const validCategories: LeaveCategoryType[] = ['SICK', 'CASUAL', 'PLANNED', 'UNPLANNED'];

    leaveRequests.forEach((request) => {
      if (request.status !== 'APPROVED') return;
      if (!request.fromDate || !request.toDate || !request.leaveCategoryType) return;
      if (!validCategories.includes(request.leaveCategoryType as LeaveCategoryType)) return;

      try {
        const start = parseISO(request.fromDate);
        const end = parseISO(request.toDate);
        const days = eachDayOfInterval({ start, end });
        const dailyDuration = (request.leaveDuration ?? 0) / (days.length || 1); // Avoid division by zero
        days.forEach((day) => {
          leaveDays.push({
            date: format(day, 'yyyy-MM-dd'),
            leaveCategory: request.leaveCategoryType as LeaveCategoryType,
            duration: dailyDuration,
          });
        });
      } catch (err) {
        console.error('❌ Error parsing leave dates:', err);
      }
    });
    return leaveDays;
  };

  // Fetch holidays and leaves on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) {
        setError({ message: 'Employee ID not found. Please log in again.' });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch holidays
        const holidayResponse = await holidaysService.getAllCalendars();
        if (holidayResponse.flag && holidayResponse.response) {
          setHolidays(holidayResponse.response);
        } else {
          throw new Error(holidayResponse.message || 'Failed to fetch holidays');
        }

        // Fetch leaves using getLeaveSummary
        const leaveResponse = await leaveService.getLeaveSummary(employeeId, undefined, undefined, 'APPROVED');
        if (leaveResponse.flag && leaveResponse.response && leaveResponse.response.content) {
          const leaveDays = convertToLeaveDays(leaveResponse.response.content);
          setLeaves(leaveDays);
        } else {
          throw new Error(leaveResponse.message || 'Failed to fetch leave summary');
        }
      } catch (err: unknown) {
        let errorMessage = 'Failed to fetch calendar data';
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

    fetchData();
  }, [employeeId]);

  // Filter holidays and leaves
  const filteredHolidays = holidays.filter((holiday) => {
    try {
      const holidayDate = parseISO(holiday.holidayDate);
      const matchesYear = holidayDate.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 'All' || (holidayDate.getMonth() + 1).toString() === selectedMonth;
      const matchesRegion = selectedRegion === 'All' || holiday.locationRegion === selectedRegion;
      return matchesYear && matchesMonth && matchesRegion;
    } catch {
      return false;
    }
  });

  const filteredLeaves = leaves.filter((leave) => {
    try {
      const leaveDate = parseISO(leave.date);
      const matchesYear = leaveDate.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 'All' || (leaveDate.getMonth() + 1).toString() === selectedMonth;
      const matchesCategory = selectedLeaveCategory === 'All' || leave.leaveCategory === selectedLeaveCategory;
      return matchesYear && matchesMonth && matchesCategory;
    } catch {
      return false;
    }
  });

  // Calendar tile content
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    const holiday = filteredHolidays.find((h) => isSameDay(parseISO(h.holidayDate), date));
    const leave = filteredLeaves.find((l) => isSameDay(parseISO(l.date), date));
    return (
      <div className="flex flex-col items-center">
        {holiday && (
          <span className="text-xs text-blue-600 font-semibold">{holiday.holidayName}</span>
        )}
        {leave && (
          <span className="text-xs text-yellow-600 font-semibold">{formatType(leave.leaveCategory)}</span>
        )}
      </div>
    );
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    const dateHolidays = filteredHolidays.filter((h) => isSameDay(parseISO(h.holidayDate), date));
    const dateLeaves = filteredLeaves.filter((l) => isSameDay(parseISO(l.date), date));
    if (dateHolidays.length > 0 || dateLeaves.length > 0) {
      setSelectedDateDetails({ holidays: dateHolidays, leaves: dateLeaves });
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  // Format holiday/leave type
  const formatType = (type: string): string => {
    return type
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="relative w-full max-w-6xl mb-6">
        <button
          onClick={() => router.back()}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800 text-center">Employee Calendar</h1>
      </div>

      {/* Filters */}
      <div className="flex justify-center items-center mb-6 gap-4 bg-white p-4 rounded-lg shadow-sm">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month === 'All' ? 'All' : new Date(2000, Number(month) - 1, 1).toLocaleString('default', { month: 'long' })}
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
          <span className="ml-3 text-lg text-gray-600">Loading calendar...</span>
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
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Calendar View */}
      {!loading && !error && (
        <div className="flex justify-center items-center bg-white p-6 rounded-lg shadow-lg mx-auto max-w-4xl">
          <Calendar
            value={new Date()}
            tileContent={tileContent}
            onClickDay={handleDateClick}
            className="w-full border-none scale-125"
            calendarType="gregory"
          />
        </div>
      )}

      {/* Details Modal */}
      {selectedDateDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-100">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {format(
                new Date(selectedDateDetails.holidays[0]?.holidayDate || selectedDateDetails.leaves[0]?.date || new Date()),
                'MMMM d, yyyy'
              )}
            </h2>
            {selectedDateDetails.holidays.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Holidays</h3>
                {selectedDateDetails.holidays.map((holiday) => (
                  <div key={holiday.holidayCalendarId} className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Name:</strong> {holiday.holidayName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Type:</strong> {formatType(holiday.holidayType)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Region:</strong> {holiday.locationRegion}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Recurrence:</strong> {holiday.recurrenceRule}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Description:</strong> {holiday.calendarDescription || 'N/A'}
                    </p>
                  </div>
                ))}
              </>
            )}
            {selectedDateDetails.leaves.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Leaves</h3>
                {selectedDateDetails.leaves.map((leave) => (
                  <div key={leave.date + leave.leaveCategory} className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Category:</strong> {formatType(leave.leaveCategory)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Duration:</strong> {leave.duration.toFixed(2)} hours
                    </p>
                  </div>
                ))}
              </>
            )}
            <button
              onClick={() => setSelectedDateDetails(null)}
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

export default EmployeeCalendarPage;