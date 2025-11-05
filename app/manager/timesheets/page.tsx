//app/manager/timesheets/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import Spinner from '@/components/ui/Spinner';
import { managerTimeSheetService } from '@/lib/api/managerTimeSheetService';
import { holidaysService } from '@/lib/api/holidayService';
import {
  TimeSheetResponseDto,
  HolidayCalendarDTO,
} from '@/lib/api/types';
// import { useSearchParams } from "next/navigation";

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

export default function ManagerTimesheetReview() {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [timesheets, setTimesheets] = useState<TimeSheetResponseDto[]>([]);
  const [holidays, setHolidays] = useState<HolidayCalendarDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(dayjs().startOf('isoWeek'));
// const searchParams = useSearchParams();
// const employeeIdFromQuery = searchParams.get("employeeId");

  // 🧩 fetch employee list
  useEffect(() => {
    const fetchEmployees = async () => {
      const res = await managerTimeSheetService.getEmployeesUnderManager();
      const list = res.response?.map((e: any) => ({
        id: e.employeeId,
        name: `${e.firstName} ${e.lastName}`,
      })) || [];
      setEmployees(list);
    };
    fetchEmployees();
  }, []);

  // 🧩 fetch holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      const res = await holidaysService.getAllCalendars();
      setHolidays(res.response || []);
    };
    fetchHolidays();
  }, []);

  const currentWeekEnd = useMemo(() => currentWeekStart.endOf('isoWeek'), [currentWeekStart]);

  // 🧩 fetch ALL timesheets (Approved / Rejected / Pending)
  const fetchTimesheets = useCallback(async (employeeId: string) => {
    try {
      setLoading(true);
      const res = await managerTimeSheetService.getEmployeeTimesheets(employeeId, 0, 50);
      // Include ALL statuses, no filtering here
      const data = res.response?.content || res.response || [];
      setTimesheets(data);
    } catch (err) {
      console.error("Error fetching timesheets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

//     // 🧩 Automatically select employee from query param
// useEffect(() => {
//   if (!employeeIdFromQuery) return;
//   if (employees.length === 0) return; // wait until employees are loaded

//   const emp = employees.find((e) => e.id === employeeIdFromQuery);
//   if (emp) {
//     setSelectedEmployee(emp);
//     fetchTimesheets(emp.id);
//   } else {
//     console.warn("Employee not found for ID:", employeeIdFromQuery);
//   }
// }, [employeeIdFromQuery, employees.length]); // ✅ note: depends on employees.length only


  useEffect(() => {
    if (selectedEmployee?.id) {
      fetchTimesheets(selectedEmployee.id);
    }
  }, [selectedEmployee, fetchTimesheets]);

  // 🧩 Filter only the current week (but keep all statuses)
  const filteredTimesheets = useMemo(
    () =>
      timesheets.filter((ts) =>
        dayjs(ts.workDate).isBetween(currentWeekStart, currentWeekEnd, 'day', '[]')
      ),
    [timesheets, currentWeekStart, currentWeekEnd]
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => currentWeekStart.add(i, 'day'));

  // Approve / Reject handler
  const handleApproveReject = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedEmployee) return alert('Select an employee first');
    const ids = filteredTimesheets.map((t) => t.timesheetId);
    if (ids.length === 0) return alert('No timesheets found for this week');

      // Confirmation message
    const confirmMsg =
      action === 'APPROVE'
        ? 'Are you sure you want to APPROVE the selected timesheets?'
        : 'Are you sure you want to REJECT the selected timesheets?';

    if (!window.confirm(confirmMsg)) {
      return; // stop execution if user cancels
    }

    try {
      setLoading(true);
      if (action === 'APPROVE') {
        await managerTimeSheetService.approveTimesheets(ids);
      } else {
        await managerTimeSheetService.rejectTimesheets(ids);
      }
      await fetchTimesheets(selectedEmployee.id);
    } catch (err) {
      console.error('Error updating timesheet status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Manager Timesheet Review</h2>

      {/* Employee Dropdown */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Select Employee:</label>
        <select
        disabled={employees.length === 0}
          className="border border-gray-300 rounded-lg px-3 py-2 w-72"
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

      {/* Week Navigation */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setCurrentWeekStart((p) => p.subtract(1, 'week'))}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ◀
        </button>
        <span className="font-medium">
          {currentWeekStart.format('MMM DD')} - {currentWeekEnd.format('MMM DD, YYYY')}
        </span>
        <button
          onClick={() => setCurrentWeekStart((p) => p.add(1, 'week'))}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ▶
        </button>
      </div>

      {/* Timesheet Grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : filteredTimesheets.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">No data found for this week.</p>
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
              {Array.from(new Set(filteredTimesheets.map((t) => t.taskName))).map((task) => (
                <tr key={task} className="border-b">
                  <td className="py-2 px-4 text-left">{task}</td>
                  {weekDays.map((day) => {
                    const record = filteredTimesheets.find(
                      (ts) => ts.taskName === task && dayjs(ts.workDate).isSame(day, 'day')
                    );
                    return (
                      <td key={day.toString()} className="py-2 px-4">
                        {record ? record.workedHours : 0}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

            {/* Total Hours */}
            <tfoot className="bg-gray-50">
              <tr>
                <td className="py-2 px-4 font-semibold text-left">Total Hours</td>
                {weekDays.map((day) => {
                  const total = filteredTimesheets
                    .filter((ts) => dayjs(ts.workDate).isSame(day, 'day'))
                    .reduce((sum, ts) => sum + (ts.workedHours || 0), 0);
                  return (
                    <td key={day.toString()} className="py-2 px-4 font-semibold">
                      {total.toFixed(1)}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="py-2 px-4 font-semibold text-left">Status</td>
                {weekDays.map((day) => {
                  const ts = timesheets.find((t) => dayjs(t.workDate).isSame(day, "day"));
                  const status = ts?.status || "PENDING";

                  return (
                    <td key={day.format("YYYY-MM-DD")} className="py-2 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-lg text-white text-xs ${
                          status === "APPROVED"
                            ? "bg-green-600"
                            : status === "SUBMITTED"
                            ? "bg-blue-600"
                            : status === "PENDING"
                            ? "bg-yellow-500"
                            // : "bg-gray-400"
                            :status === "REJECTED" ? 
                          "bg-red-600" : "bg-gray-400"

                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>

          {/* Approve / Reject Buttons */}
          <div className="flex justify-end gap-4 p-4 border-t bg-gray-50">
            <button
              onClick={() => handleApproveReject('APPROVE')}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => handleApproveReject('REJECT')}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

