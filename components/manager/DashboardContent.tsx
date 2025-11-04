'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { leaveService } from '@/lib/api/leaveService';
import { adminService } from '@/lib/api/adminService';
import { holidaysService } from '@/lib/api/holidayService';
import {
  PendingLeavesResponseDTO,
  WebResponseDTOPageLeaveResponseDTO,
  WebResponseDTOListEmployeeDTO,
  LeaveStatus,
  EmployeeDTO,
  HolidayCalendarDTO,
} from '@/lib/api/types';
import { ArrowLeft, CheckCircle, XCircle, Calendar, Users } from 'lucide-react';
import Swal from 'sweetalert2';

const DashboardContent: React.FC = () => {
  const router = useRouter();
  const { state: { accessToken, user } } = useAuth();
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [approvedLeavesCount, setApprovedLeavesCount] = useState(0);
  const [upcomingHolidays, setUpcomingHolidays] = useState<HolidayCalendarDTO[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [averageLeaves, setAverageLeaves] = useState(0);
  const [recentPendingLeaves, setRecentPendingLeaves] = useState<PendingLeavesResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async (maxRetries: number = 3) => {
      setLoading(true);
      setError(null);
      let retryCount = 0;

      while (retryCount <= maxRetries) {
        try {
          if (!accessToken || !user || user.role !== 'MANAGER') {
            throw new Error('Unauthorized access. Please log in as a manager.');
          }

          // Fetch pending leaves
          const pendingLeaves = await leaveService.getPendingLeaves();
          console.log('🧩 Pending Leaves Response:', pendingLeaves);
          setPendingLeavesCount(pendingLeaves.length);
          setRecentPendingLeaves(pendingLeaves.slice(0, 3));

          // Fetch leave summary for approved leaves
          const leaveSummary: WebResponseDTOPageLeaveResponseDTO = await leaveService.getLeaveSummary(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            0,
            1000,
            'fromDate,desc'
          );
          console.log('🧩 Leave Summary Response:', leaveSummary);
          if (!leaveSummary.flag || !leaveSummary.response) {
            throw new Error(leaveSummary.message || 'Failed to fetch leave summary');
          }
          const approvedLeaves = leaveSummary.response.content.filter((leave) => leave.status === 'APPROVED');
          setApprovedLeavesCount(approvedLeaves.length);

          // Fetch team members
          const managerId = user.userId || 'manager-id-placeholder';
          const employeeResponse: WebResponseDTOListEmployeeDTO = await adminService.getAllEmployees();
          console.log('🧩 Employee Response:', employeeResponse);
          if (!employeeResponse.flag || !employeeResponse.response) {
            throw new Error(employeeResponse.message || 'Failed to fetch employees');
          }
          const validEmployees = employeeResponse.response.filter(
            (emp: EmployeeDTO) => emp.reportingManagerId === managerId
          );
          setTeamCount(validEmployees.length);
          const totalLeaves = validEmployees.reduce((sum, emp) => sum + (emp.availableLeaves || 0), 0);
          setAverageLeaves(validEmployees.length ? totalLeaves / validEmployees.length : 0);

          // Fetch upcoming holidays
          const holidaysResponse = await holidaysService.getAllCalendars();
          console.log('🧩 Holidays Response:', holidaysResponse);
          if (!holidaysResponse.flag || !holidaysResponse.response) {
            throw new Error(holidaysResponse.message || 'Failed to fetch holidays');
          }
          setUpcomingHolidays(holidaysResponse.response);

          break; // Exit retry loop on success
        } catch (err: any) {
          retryCount++;
          console.error(`❌ Error fetching data (Attempt ${retryCount}/${maxRetries}):`, err);
          if (retryCount > maxRetries) {
            setError(
              err.message.includes('assignedManager')
                ? 'Unable to load dashboard data. Some employees may not have assigned managers. Please check employee settings or contact support.'
                : err.message || 'Failed to load dashboard data. Please try again or contact support.'
            );
            break;
          }
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
        } finally {
          if (retryCount >= maxRetries) {
            setLoading(false);
          }
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [accessToken, user, router]);

  const handleReviewLeave = (leave: PendingLeavesResponseDTO) => {
    Swal.fire({
      title: 'Review Leave Request',
      html: `
        <div class="text-left text-sm text-gray-600 space-y-3">
          <p><strong>Employee:</strong> ${leave.employeeName ?? 'Unknown'}</p>
          <p><strong>Type:</strong> ${leave.leaveCategoryType ?? 'N/A'}</p>
          <p><strong>Duration:</strong> ${leave.leaveDuration ?? 0} days</p>
          <p><strong>From Date:</strong> ${leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>To Date:</strong> ${leave.toDate ? new Date(leave.toDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Reason:</strong> ${leave.context ?? 'No reason provided'}</p>
          <p><strong>Status:</strong> ${leave.status ?? 'PENDING'}</p>
          ${
            leave.attachmentUrl
              ? `<p><strong>Attachment:</strong> <a href="${leave.attachmentUrl}" target="_blank" class="text-indigo-600 hover:underline">View Attachment</a></p>`
              : '<p><strong>Attachment:</strong> None</p>'
          }
          <div>
            <label for="reason" class="block text-sm font-medium text-gray-700">Comment (optional)</label>
            <textarea id="reason" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" rows="4" placeholder="Enter reason for approval or rejection"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      showConfirmButton: true,
      cancelButtonText: 'Cancel',
      denyButtonText: 'Reject',
      confirmButtonText: 'Approve',
      customClass: {
        popup: 'rounded-lg',
        confirmButton: 'bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700',
        denyButton: 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700',
        cancelButton: 'bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300',
      },
      preConfirm: () => {
        const reason = (document.getElementById('reason') as HTMLTextAreaElement)?.value || '';
        return { action: 'approve', reason };
      },
      preDeny: () => {
        const reason = (document.getElementById('reason') as HTMLTextAreaElement)?.value || '';
        return { action: 'reject', reason };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { reason } = result.value;
        try {
          await leaveService.updateLeaveStatus(leave.leaveId!, 'APPROVED', reason);
          setConfirmation(`Leave ${leave.leaveId} approved successfully${reason ? ` with reason: "${reason}"` : ''}.`);
          setRecentPendingLeaves((prev) =>
            prev.map((l) => (l.leaveId === leave.leaveId ? { ...l, status: 'APPROVED' } : l))
          );
          setPendingLeavesCount((prev) => prev - 1);
          setApprovedLeavesCount((prev) => prev + 1);
        } catch (err: any) {
          setError(err.message || 'Failed to approve leave');
        }
      } else if (result.isDenied) {
        const { reason } = result.value;
        try {
          await leaveService.updateLeaveStatus(leave.leaveId!, 'REJECTED', reason);
          setConfirmation(`Leave ${leave.leaveId} rejected successfully${reason ? ` with reason: "${reason}"` : ''}.`);
          setRecentPendingLeaves((prev) =>
            prev.map((l) => (l.leaveId === leave.leaveId ? { ...l, status: 'REJECTED' } : l))
          );
          setPendingLeavesCount((prev) => prev - 1);
        } catch (err: any) {
          setError(err.message || 'Failed to reject leave');
        }
      }
      setTimeout(() => setConfirmation(null), 3000);
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
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
        <p className="text-gray-600 mt-4">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg m-6">
        {error.includes('403')
          ? 'You do not have permission to view this dashboard. Please contact your administrator.'
          : error}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 flex-1">
      {/* Confirmation Message */}
      {confirmation && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg flex justify-between items-center">
          <span>{confirmation}</span>
          <button
            onClick={() => setConfirmation(null)}
            className="text-green-700 hover:text-green-900"
          >
            <XCircle size={20} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 flex items-center space-x-4">
          <Calendar className="h-10 w-10 text-indigo-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pending Leaves</h3>
            <p className="text-2xl font-bold text-gray-700">{pendingLeavesCount}</p>
            <button
              onClick={() => router.push('/manager/leaves')}
              className="mt-2 text-sm text-indigo-600 hover:underline"
            >
              View All
            </button>
          </div>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 flex items-center space-x-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Approved Leaves</h3>
            <p className="text-2xl font-bold text-gray-700">{approvedLeavesCount}</p>
            <button
              onClick={() => router.push('/manager/leaves')}
              className="mt-2 text-sm text-indigo-600 hover:underline"
            >
              View All
            </button>
          </div>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 flex items-center space-x-4">
          <Users className="h-10 w-10 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            <p className="text-2xl font-bold text-gray-700">{teamCount}</p>
            <p className="text-sm text-gray-600">Avg. Leaves: {averageLeaves.toFixed(1)}</p>
            <button
              onClick={() => router.push('/manager/employees')}
              className="mt-2 text-sm text-indigo-600 hover:underline"
            >
              View Team
            </button>
          </div>
        </div>
      </div>

      {/* Recent Pending Leaves */}
      {recentPendingLeaves.length > 0 && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Pending Leaves</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">From Date</th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">To Date</th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">Attachment</th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentPendingLeaves.map((leave) => (
                  <tr key={leave.leaveId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-base font-medium text-gray-900">
                      {leave.employeeName ?? 'Unknown'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.leaveCategoryType ?? 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.leaveDuration ?? 0} days
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.toDate ? new Date(leave.toDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.attachmentUrl ? (
                        <a
                          href={leave.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        'None'
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base">
                      <button
                        onClick={() => handleReviewLeave(leave)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming Holidays */}
      {upcomingHolidays.length > 0 && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Holidays</h3>
          <ul className="space-y-2">
            {upcomingHolidays
              .filter((holiday) => holiday.holidayActive && new Date(holiday.holidayDate) >= new Date())
              .sort((a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime())
              .slice(0, 5)
              .map((holiday) => (
                <li key={holiday.holidayCalendarId} className="flex justify-between text-base text-gray-600">
                  <span>{holiday.holidayDate ? new Date(holiday.holidayDate).toLocaleDateString() : 'N/A'}</span>
                  <span>{holiday.holidayName || 'Unnamed Holiday'}</span>
                </li>
              ))}
          </ul>
          <button
            onClick={() => router.push('/manager/holiday')}
            className="mt-4 text-sm text-indigo-600 hover:underline"
          >
            View All Holidays
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardContent;