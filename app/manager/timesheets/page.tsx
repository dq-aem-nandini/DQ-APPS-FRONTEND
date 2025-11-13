//app/manager/timesheets/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import Spinner from '@/components/ui/Spinner';
import { managerTimeSheetService } from '@/lib/api/managerTimeSheetService';
import { holidaysService } from '@/lib/api/holidayService';
import { leaveService } from '@/lib/api/leaveService'; 
import {
  TimeSheetResponseDto,
  HolidayCalendarDTO,EmployeeLeaveDayDTO
} from '@/lib/api/types';
// import { useSearchParams } from "next/navigation";

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

export default function ManagerTimesheetReview() {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [timesheets, setTimesheets] = useState<TimeSheetResponseDto[]>([]);
  const [holidays, setHolidays] = useState<HolidayCalendarDTO[]>([]);
  const [leaves, setLeaves] = useState<EmployeeLeaveDayDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(dayjs().startOf('isoWeek'));
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [managerComment, setManagerComment] = useState('');

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
      const data = Array.isArray(res.response) ? res.response : [];
      setTimesheets(data);
    } catch (err) {
      console.error("Error fetching timesheets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch leaves of the employee
useEffect(() => {
    console.log("🟢 Leaves useEffect triggered:", selectedEmployee, currentWeekStart.format("YYYY-MM-DD"));

  const fetchLeaves = async () => {
    if (!selectedEmployee?.id){
      console.log("Skipping leaves fetch — no selectedEmployee");
      return;
    }
    try {
      const currentYear = dayjs(currentWeekStart).year().toString();
      console.log(" Fetching leaves for:", {
      empId: selectedEmployee.id,
      year: currentYear,
    });
      const data = await leaveService.getApprovedLeaves(selectedEmployee.id, currentYear);
      console.log("Leaves fetched:", data);
      setLeaves(data);
    } catch (err) {
      console.error('Error fetching approved leaves:', err);
    }
  };
  fetchLeaves();
}, [selectedEmployee,currentWeekStart]);
  
  // Auto-select employee and week from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const employeeIdFromQuery = urlParams.get("employeeId");
    const weekFromQuery = urlParams.get("week");

    if (!employeeIdFromQuery) return;
    if (employees.length === 0) return;

    const emp = employees.find((e) => e.id === employeeIdFromQuery);
    if (emp) {
      setSelectedEmployee(emp);
      if (weekFromQuery) {
        const weekStart = dayjs(weekFromQuery).startOf('isoWeek');
        if (weekStart.isValid()) {
          setCurrentWeekStart(weekStart);
        }
      }
    }
  }, [employees]);
  
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
 const handleApproveReject = (action: 'APPROVE' | 'REJECT') => {
  if (!selectedEmployee) return alert('Select an employee first');
  const ids = filteredTimesheets.map((t) => t.timesheetId);
  if (ids.length === 0) return alert('No timesheets found for this week');

  setModalAction(action);
  setShowModal(true); // open modal instead of confirm
};
const confirmAction = async () => {
  if (!modalAction || !selectedEmployee) return;
  const ids = filteredTimesheets.map((t) => t.timesheetId);

  try {
    setLoading(true);

    if (modalAction === 'APPROVE') {
      await managerTimeSheetService.approveTimesheets(ids, managerComment);
    } else {
      await managerTimeSheetService.rejectTimesheets(ids, managerComment);
    }

    await fetchTimesheets(selectedEmployee.id);
  } catch (err) {
    console.error('Error updating timesheet status:', err);
  } finally {
    setLoading(false);
    setShowModal(false);
    setManagerComment('');
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

      {/* Show this message when no employee is selected */}
      {!selectedEmployee && (
        <p className="text-center text-gray-600 mt-10 text-lg font-medium">
          Please select an Employee to view Timesheet for the week
        </p>
      )}

      {/* Status + Manager Comment */}
      {filteredTimesheets.length > 0 && (
        <div className={`mb-4 p-4 rounded-lg font-medium border shadow-sm ${
          filteredTimesheets[0].status === 'DRAFT' ? 'bg-gray-50 text-gray-700 border-gray-300' :
          filteredTimesheets[0].status === 'PENDING' ? 'bg-orange-50 text-orange-800 border-orange-300' :
          filteredTimesheets[0].status === 'SUBMITTED' ? 'bg-blue-50 text-blue-800 border-blue-300' :
          filteredTimesheets[0].status === 'APPROVED' ? 'bg-green-50 text-green-800 border-green-300' :
          filteredTimesheets[0].status === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-300' :
          'bg-gray-50 text-gray-700 border-gray-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm">Timesheet Status:</span>{' '}
              <strong className="text-base">{filteredTimesheets[0].status}</strong>
              <span className="text-sm ml-2">
                {filteredTimesheets[0].status === 'DRAFT' && '– Editable (Draft)'}
                {filteredTimesheets[0].status === 'PENDING' && '– Locked (Awaiting Final Save)'}
                {filteredTimesheets[0].status === 'SUBMITTED' && '– Editable (Waiting for Submission by Employee)'}
                {filteredTimesheets[0].status === 'APPROVED' && '– Locked (Approved)'}
                {filteredTimesheets[0].status === 'REJECTED' && '– Editable (Please Revise)'}
              </span>
            </div>
            {filteredTimesheets[0].managerComment && (
              <div className="text-right">
                <span className="text-xs block text-gray-600">Manager Comment:</span>
                <span className="text-sm font-medium">{filteredTimesheets[0].managerComment}</span>
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
      ) : filteredTimesheets.length === 0 || filteredTimesheets[0]?.status === 'SUBMITTED' ? (
        <p className="text-center text-gray-500 mt-10">
          {filteredTimesheets[0]?.status === 'SUBMITTED'
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
              {Array.from(new Set(filteredTimesheets.map((t) => t.taskName))).map((task) => (
                <tr key={task} className="border-b">
                  <td className="py-2 px-4 text-left font-medium">{task}</td>

                  {weekDays.map((day) => {
                    const record = filteredTimesheets.find(
                      (ts) => ts.taskName === task && dayjs(ts.workDate).isSame(day, 'day')
                    );

                    // Find leave for this day
                    const leave = leaves.find((l) => dayjs(l.date).isSame(day, 'day'));

                    // Only show 'L' if it's a FULL-DAY approved leave
                    const isFullDayLeave =
                      leave &&
                      ['SICK', 'CASUAL', 'PLANNED', 'UNPLANNED'].includes(leave.leaveCategory) &&
                      leave.duration === 1.0;

                    const displayValue = isFullDayLeave
                      ? 'L'
                      : record
                      ? record.workedHours
                      : 0;

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
              
            </tfoot>
          </table>
          
          {/* Approve / Reject Buttons */}
          <div className="flex justify-end gap-4 p-4 border-t bg-gray-50">
            {filteredTimesheets.length > 0 && filteredTimesheets[0].status !== 'APPROVED' && (
              <button
                onClick={() => handleApproveReject('APPROVE')}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
              >
                Approve
              </button>
            )}
            {filteredTimesheets.length > 0 && ['PENDING', 'REJECTED'].includes(filteredTimesheets[0].status) && (
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

