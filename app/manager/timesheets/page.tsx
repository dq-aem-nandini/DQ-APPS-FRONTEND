// app/manager/timesheets/page.tsx
'use client';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import Spinner from '@/components/ui/Spinner';
import { managerTimeSheetService } from '@/lib/api/managerTimeSheetService';
import { holidaysService } from '@/lib/api/holidayService';
import { leaveService } from '@/lib/api/leaveService';
import {
  TimeSheetResponseDto,
  HolidayCalendarDTO,
  EmployeeLeaveDayDTO,
} from '@/lib/api/types';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import type { Dayjs } from 'dayjs';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

export default function ManagerTimesheetReview() {
  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  const [employees, setEmployees] = useState<
    { id: string; name: string; dateOfJoining: string }[]
  >([]);
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
    dateOfJoining: string;
    clientName?: string;
    reportingManagerName?: string;
    designation?: string;
  } | null>(null);
  const [timesheets, setTimesheets] = useState<TimeSheetResponseDto[]>([]);
  const [holidays, setHolidays] = useState<HolidayCalendarDTO[]>([]);
  const [leaves, setLeaves] = useState<EmployeeLeaveDayDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [managerComment, setManagerComment] = useState('');
  const [firstAllowedMonday, setFirstAllowedMonday] = useState<dayjs.Dayjs | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Week handling – initialise on client
  const [currentWeekStart, setCurrentWeekStart] = useState<dayjs.Dayjs | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  // Safe fallback (never undefined)
  const weekStart = currentWeekStart ?? dayjs().startOf('isoWeek');

  // ------------------------------------------------------------------
  // Init current week on mount (client‑side today)
  // ------------------------------------------------------------------
  useEffect(() => {
    const today = dayjs();
    const week = today.startOf('isoWeek');
    setCurrentWeekStart(week);
    setSelectedDate(week.format('YYYY-MM-DD'));
  }, []);

  // ------------------------------------------------------------------
  // Employee list
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchEmployees = async () => {
      const res = await managerTimeSheetService.getEmployeesUnderManager();
      const list = res.response?.map((e: any) => ({
        id: e.employeeId,
        name: `${e.firstName} ${e.lastName}`,
        dateOfJoining: e.dateOfJoining,
        clientName: e.clientName,
        reportingManagerName: e.reportingManagerName,
        designation: e.designation,
      })) || [];
      setEmployees(list);
    };
    fetchEmployees();
  }, []);

  // ------------------------------------------------------------------
  // DOJ → first allowed Monday
  // ------------------------------------------------------------------
  useEffect(() => {
    if (selectedEmployee) {
      const doj = dayjs(selectedEmployee.dateOfJoining);
      if (doj.isValid()) {
        setFirstAllowedMonday(doj.startOf('isoWeek'));
      } else {
        setFirstAllowedMonday(null);
      }
    } else {
      setFirstAllowedMonday(null);
    }
  }, [selectedEmployee]);

  // ------------------------------------------------------------------
  // Holidays
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchHolidays = async () => {
      const res = await holidaysService.getAllCalendars();
      setHolidays(res.response || []);
    };
    fetchHolidays();
  }, []);

  // ------------------------------------------------------------------
  // Calendar helpers
  // ------------------------------------------------------------------
  const disabledDays = useMemo(() => {
    if (!firstAllowedMonday || !selectedEmployee?.dateOfJoining) return [];
    const doj = dayjs(selectedEmployee.dateOfJoining);
    return { before: doj.toDate() };
  }, [firstAllowedMonday, selectedEmployee]);

  const displayLabel = useMemo(() => {
    const date = selectedDate && dayjs(selectedDate).isValid()
      ? dayjs(selectedDate)
      : dayjs();
    return date.format('DD MMM YYYY');
  }, [selectedDate]);

  const startMonth = useMemo(() => {
    if (!selectedEmployee?.dateOfJoining) return new Date();
    return dayjs(selectedEmployee.dateOfJoining).startOf('month').toDate();
  }, [selectedEmployee]);

  // Total hours for the whole week
    const totalWeekHours = useMemo(() => {
      return timesheets.reduce((sum, ts) => sum + (ts.workedHours || 0), 0);
    }, [timesheets]);


  // ------------------------------------------------------------------
  // Week navigation
  // ------------------------------------------------------------------
  const currentWeekEnd = useMemo(() => weekStart.endOf('isoWeek'), [weekStart]);

  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));

  // ------------------------------------------------------------------
  // Timesheets
  // ------------------------------------------------------------------
  const fetchTimesheets = useCallback(async () => {
    if (!selectedEmployee?.id) return;

    try {
      setLoading(true);
      const start = weekStart.format('YYYY-MM-DD');
      const end = currentWeekEnd.format('YYYY-MM-DD');

      const res = await managerTimeSheetService.getEmployeeTimesheets(
        selectedEmployee.id,
        start,
        end
      );

      const data = Array.isArray(res.response) ? res.response : [];
      setTimesheets(data);
    } catch (err) {
      console.error('Error fetching timesheets:', err);
      setTimesheets([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, weekStart, currentWeekEnd]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  // ------------------------------------------------------------------
  // Leaves
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchLeaves = async () => {
      if (!selectedEmployee?.id) return;
      try {
        const currentYear = weekStart.year().toString();
        const data = await leaveService.getApprovedLeaves(selectedEmployee.id, currentYear);
        setLeaves(data);
      } catch (err) {
        console.error('Error fetching approved leaves:', err);
      }
    };
    fetchLeaves();
  }, [selectedEmployee, weekStart]);

  // ------------------------------------------------------------------
  // URL params (employee + week)
  // ------------------------------------------------------------------
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const employeeIdFromQuery = urlParams.get('employeeId');
    const weekFromQuery = urlParams.get('week');

    if (!employeeIdFromQuery || employees.length === 0) return;

    const emp = employees.find((e) => e.id === employeeIdFromQuery);
    if (emp) {
      setSelectedEmployee(emp);
      if (weekFromQuery) {
        const week = dayjs(weekFromQuery).startOf('isoWeek');
        if (week.isValid()) {
          setCurrentWeekStart(week);
          setSelectedDate(week.format('YYYY-MM-DD'));
        }
      }
    }
  }, [employees]);

  // ------------------------------------------------------------------
  // Approve / Reject
  // ------------------------------------------------------------------
  const handleApproveReject = (action: 'APPROVE' | 'REJECT') => {
    if (!selectedEmployee) return alert('Select an employee first');
    const ids = timesheets.map((t) => t.timesheetId);
    if (ids.length === 0) return alert('No timesheets found for this week');

    setModalAction(action);
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!modalAction || !selectedEmployee) return;
    const ids = timesheets.map((t) => t.timesheetId);

    try {
      setLoading(true);
      if (modalAction === 'APPROVE') {
        await managerTimeSheetService.approveTimesheets(ids, managerComment);
      } else {
        await managerTimeSheetService.rejectTimesheets(ids, managerComment);
      }
      await fetchTimesheets();
    } catch (err) {
      console.error('Error updating timesheet status:', err);
    } finally {
      setLoading(false);
      setShowModal(false);
      setManagerComment('');
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Manager Timesheet Review</h2>

      {/* Employee Dropdown */}
      {/* ────────────────────── EMPLOYEE SELECT + INFO (SIDE-BY-SIDE) ────────────────────── */}
      {/* ────────────────────── MANAGER HEADER: Dropdown + Info (Side-by-Side) ────────────────────── */}
<div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
  {/* Dropdown + Info Row */}
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
    
    {/* LEFT – Employee Dropdown */}
    <div className="flex-1">
      <label className="block mb-2 font-medium">Select Employee:</label>
      <select
        disabled={employees.length === 0}
        className="w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2"
        value={selectedEmployee?.id || ''}
        onChange={(e) => {
          const emp = employees.find((emp) => emp.id === e.target.value) || null;
          setSelectedEmployee(emp);
        }}
      >
        <option value="">-- Select Employee --</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>
    </div>

    {/* RIGHT – Employee Info Card */}
    {selectedEmployee && (
      <div className="w-full md:w-auto p-4 bg-gradient-to-b from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm text-sm">
        <div className="space-y-2">
          <div className="flex  items-center">
            <span className="font-medium text-gray-600">Client:</span>
            <span className="font-semibold text-gray-800 ml-3">
              {selectedEmployee.clientName || '—'}
            </span>
          </div>
          <div className="flex  items-center border-t border-blue-100 pt-2">
            <span className="font-medium text-gray-600">Manager:</span>
            <span className="font-semibold text-gray-800 ml-3">
              {selectedEmployee.reportingManagerName || '—'}
            </span>
          </div>
          <div className="flex  items-center border-t border-blue-100 pt-2">
            <span className="font-medium text-gray-600">Role:</span>
            <span className="font-semibold text-gray-800 ml-3">
              {selectedEmployee.designation
                ? selectedEmployee.designation
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                : '—'}
            </span>
          </div>
        </div>
      </div>
    )}
  </div>
</div>

      {/* Week Navigation */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Select Week</h2>
        </div>

        <div className="flex items-center  gap-4">
          {/* Left side – picker + week label */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              {/* Trigger */}
              <div className="flex items-center space-x-2">
                <Calendar size={20} className="text-gray-500" />
                <div
                  onClick={() => setIsCalendarOpen(true)}
                  className="px-3 py-2 border border-gray-300 rounded-md cursor-pointer bg-white min-w-[160px] text-left select-none"
                >
                  {displayLabel}
                </div>
              </div>

              {/* DayPicker */}
              {isCalendarOpen && (
                <div className="absolute top-full mt-1 z-50 bg-white shadow-lg rounded-lg border">
                  <DayPicker
                    mode="single"
                    selected={selectedDate ? dayjs(selectedDate).toDate() : undefined}
                    onSelect={(date) => {
                      if (!date) return;
                      const picked = dayjs(date);
                      const newWeek = picked.startOf('isoWeek');
                      setCurrentWeekStart(newWeek);
                      setSelectedDate(newWeek.format('YYYY-MM-DD'));
                      setIsCalendarOpen(false);
                    }}
                    disabled={disabledDays}
                    defaultMonth={weekStart.toDate()}
                    modifiers={{
                      doj: selectedEmployee?.dateOfJoining
                        ? dayjs(selectedEmployee.dateOfJoining).toDate()
                        : undefined,
                    }}
                    modifiersStyles={{
                      doj: { backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold' },
                    }}
                    className="p-3"
                    captionLayout="dropdown"
                    startMonth={startMonth}
                  
                    onMonthChange={(month) => {
                      const newWeek = dayjs(month).startOf('isoWeek');
                      setCurrentWeekStart(newWeek);
                      setSelectedDate(newWeek.format('YYYY-MM-DD'));
                    }}
                  />
                  <div className="p-2 text-center border-t">
                    <button
                      onClick={() => setIsCalendarOpen(false)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600">
              Week: {weekStart.format('MMM D')} -{' '}
              {weekStart.clone().add(6, 'day').format('MMM D, YYYY')}
            </div>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center space-x-2">
            <ChevronLeft
              className={`cursor-pointer text-gray-600 hover:text-gray-800 ${
                firstAllowedMonday && weekStart.isSameOrBefore(firstAllowedMonday, 'day')
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              size={24}
              onClick={() => {
                if (firstAllowedMonday && weekStart.isSameOrBefore(firstAllowedMonday, 'day')) return;
                setCurrentWeekStart((prev) => (prev ?? dayjs().startOf('isoWeek')).subtract(1, 'week'));
              }}
            />

            <ChevronRight
              className="cursor-pointer text-gray-600 hover:text-gray-800"
              size={24}
              onClick={() => {
                setCurrentWeekStart((prev) => {
                  const newWeek = (prev ?? dayjs().startOf('isoWeek')).add(1, 'week');
                  setSelectedDate(newWeek.format('YYYY-MM-DD'));
                  return newWeek;
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* No employee message */}
      {!selectedEmployee && (
        <p className="text-center text-gray-600 mt-10 text-lg font-medium">
          Please select an Employee to view Timesheet for the week
        </p>
      )}

      {/* Status + Comment */}
      {timesheets.length > 0 && (
        <div
          className={`mb-4 p-4 rounded-lg font-medium border shadow-sm ${
            timesheets[0].status === 'DRAFT'
              ? 'bg-gray-50 text-gray-700 border-gray-300'
              : timesheets[0].status === 'PENDING'
              ? 'bg-orange-50 text-orange-800 border-orange-300'
              : timesheets[0].status === 'SUBMITTED'
              ? 'bg-blue-50 text-blue-800 border-blue-300'
              : timesheets[0].status === 'APPROVED'
              ? 'bg-green-50 text-green-800 border-green-300'
              : timesheets[0].status === 'REJECTED'
              ? 'bg-red-50 text-red-800 border-red-300'
              : 'bg-gray-50 text-gray-700 border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm">Timesheet Status:</span>{' '}
              <strong className="text-base">{timesheets[0].status}</strong>
              <span className="text-sm ml-2">
                {timesheets[0].status === 'DRAFT' }
                {timesheets[0].status === 'PENDING' }
                {timesheets[0].status === 'SUBMITTED' }
                {timesheets[0].status === 'APPROVED' }
                {timesheets[0].status === 'REJECTED' }
              </span>
            </div>
            {timesheets[0].managerComment && (
              <div className="text-right">
                <span className="text-xs block text-gray-600">Manager Comment:</span>
                <span className="text-sm font-medium">{timesheets[0].managerComment}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timesheet Grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : timesheets.length === 0 || timesheets[0]?.status === 'SUBMITTED' ? (
        <p className="text-center text-gray-500 mt-10">
          {timesheets[0]?.status === 'SUBMITTED'
            ? 'Timesheet is submitted and awaiting approval.'
            : 'No data found for this week.'}
        </p>
      ) : (
        <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
          <table className="min-w-full text-sm text-center border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Task</th>
                {weekDays.map((day) => (
                  <th key={day.toString()} className="py-3 px-4">
                    {day.format('DD ddd').toUpperCase()}
                    <div className="text-[10px] text-gray-500">
                      {holidays.find((h) => dayjs(h.holidayDate).isSame(day, 'day'))?.holidayName || ''}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(timesheets.map((t) => t.taskName))).map((task) => (
                <tr key={task} className="border-b">
                  <td className="py-2 px-4 text-left font-medium">{task}</td>
                  {weekDays.map((day) => {
                    const record = timesheets.find(
                      (ts) => ts.taskName === task && dayjs(ts.workDate).isSame(day, 'day')
                    );
                    const leave = leaves.find((l) => dayjs(l.date).isSame(day, 'day'));
                    const isFullDayLeave =
                      leave &&
                      ['SICK', 'CASUAL', 'PLANNED', 'UNPLANNED'].includes(leave.leaveCategory) &&
                      leave.duration === 1.0;
                    const displayValue = isFullDayLeave ? 'L' : record ? record.workedHours : 0;

                    return (
                      <td
                        key={day.toString()}
                        className={`py-2 px-4 text-center font-semibold ${
                          isFullDayLeave ? 'text-red-600' : 'text-gray-800'
                        }`}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="py-2 px-4 font-semibold text-left">Total Hours</td>
                {weekDays.map((day) => {
                  const total = timesheets
                    .filter((ts) => dayjs(ts.workDate).isSame(day, 'day'))
                    .reduce((sum, ts) => sum + (ts.workedHours || 0), 0);
                  return (
                    <td key={day.toString()} className="py-2 px-4 font-semibold">
                      {total.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>

                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-b-xl flex items-center justify-start space-x-3 border-t">
                <span className="text-sm font-semibold text-gray-700">
                  Total Hours for the Week:
                </span>
                <span className="text-lg font-bold text-indigo-700">
                  {totalWeekHours.toFixed(1)} h
                </span>
              </div>

          {/* Approve / Reject */}
          <div className="flex justify-end gap-4 p-4 border-t bg-gray-50">
            {timesheets.length > 0 && timesheets[0].status !== 'APPROVED' && (
              <button
                onClick={() => handleApproveReject('APPROVE')}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
              >
                Approve
              </button>
            )}
            {timesheets.length > 0 && ['PENDING', 'REJECTED'].includes(timesheets[0].status) && (
              <button
                onClick={() => handleApproveReject('REJECT')}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              {modalAction === 'APPROVE' ? 'Approve Timesheets' : 'Reject Timesheets'}
            </h3>
            <p className="text-gray-600 mb-3">
              Are you sure you want to {modalAction?.toLowerCase()} the selected timesheets?
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              rows={3}
              placeholder="Enter manager comment..."
              value={managerComment}
              onChange={(e) => setManagerComment(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white ${
                  modalAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? 'Processing...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}