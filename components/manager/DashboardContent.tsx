'use client';
 
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { leaveService } from '@/lib/api/leaveService';
import { adminService } from '@/lib/api/adminService';
import { holidayService } from '@/lib/api/holidayService'; // Correct service
import {
  PendingLeavesResponseDTO,
  WebResponseDTOPageLeaveResponseDTO,
  WebResponseDTOListEmployeeDTO,
  HolidaysDTO,
} from '@/lib/api/types';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Calendar, Users, Clock, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
 
const DashboardContent: React.FC = () => {
  const router = useRouter();
  const { state: { accessToken, user } } = useAuth();
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [approvedLeavesCount, setApprovedLeavesCount] = useState(0);
  const [upcomingHolidays, setUpcomingHolidays] = useState<HolidaysDTO[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [averageLeaves, setAverageLeaves] = useState(0);
  const [recentPendingLeaves, setRecentPendingLeaves] = useState<PendingLeavesResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken || !user || user.role.roleName !== 'MANAGER') {
        setError('Unauthorized access. Please log in as a manager.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          pendingLeavesRes,
          leaveSummaryRes,
          employeesRes,
          holidaysRes,
        ] = await Promise.all([
          leaveService.getPendingLeaves(),
          // CORRECT CALL — matches your backend method exactly
          leaveService.getLeaveSummary(
            undefined, // employeeId
            undefined, // month
            undefined, // type
            undefined, // status
            undefined, // financialType
            undefined, // futureApproved
            undefined, // date
            0,         // page
            1000,      // size
            'fromDate,desc' // sort
          ),

          adminService.getAllEmployees(),
          holidayService.getAllHolidays(),
        ]);

        // Pending Leaves
        setPendingLeavesCount(pendingLeavesRes.length);
        setRecentPendingLeaves(pendingLeavesRes.slice(0, 5));

        // Approved Leaves
        const approved = leaveSummaryRes.response?.content?.filter(l => l.status === 'APPROVED') || [];
        setApprovedLeavesCount(approved.length);

        // Team Stats
        const managerId = user.userId;
        const teamMembers = employeesRes.response?.filter(emp => emp.reportingManagerId === managerId) || [];
        setTeamCount(teamMembers.length);
        const totalLeaves = teamMembers.reduce((sum, emp) => sum + (emp.availableLeaves || 0), 0);
        setAverageLeaves(teamMembers.length > 0 ? Math.round(totalLeaves / teamMembers.length) : 0);
        // Upcoming Holidays
        if (holidaysRes.flag && Array.isArray(holidaysRes.response)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const upcoming = holidaysRes.response
            .filter(h => {
              const hDate = new Date(h.holidayDate);
              hDate.setHours(0, 0, 0, 0);
              return hDate >= today;
            })
            .sort((a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime())
            .slice(0, 5);

          setUpcomingHolidays(upcoming);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
 
    fetchData();
  }, [accessToken, user]);
  const handleReviewLeave = (leave: PendingLeavesResponseDTO) => {
    Swal.fire({
      title: 'Review Leave Request',
      html: `
        <div class="text-left space-y-3 text-sm">
          <p><strong>Employee:</strong> ${leave.employeeName || 'N/A'}</p>
          <p><strong>Type:</strong> ${leave.leaveCategoryType || 'N/A'}</p>
          <p><strong>Duration:</strong> ${leave.leaveDuration || 0} day(s)</p>
          <p><strong>From:</strong> ${leave.fromDate ? format(new Date(leave.fromDate), 'dd MMM yyyy') : 'N/A'}</p>
          <p><strong>To:</strong> ${leave.toDate ? format(new Date(leave.toDate), 'dd MMM yyyy') : 'N/A'}</p>
          <p><strong>Reason:</strong> ${leave.context || 'No reason provided'}</p>
          ${leave.attachmentUrl
          ? `<p><strong>Attachment:</strong> <a href="${leave.attachmentUrl}" target="_blank" class="text-indigo-600 hover:underline">View</a></p>`
          : '<p><strong>Attachment:</strong> None</p>'
        }
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <textarea id="swal-comment" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" rows="3" placeholder="Enter your comment..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Approve',
      denyButtonText: 'Reject',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg mx-2',
        denyButton: 'bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg mx-2',
        cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg mx-2',
      },
      preConfirm: () => {
        const comment = (document.getElementById('swal-comment') as HTMLTextAreaElement)?.value || '';
        return { action: 'APPROVED', comment };
      },
      preDeny: () => {
        const comment = (document.getElementById('swal-comment') as HTMLTextAreaElement)?.value || '';
        return { action: 'REJECTED', comment };
      },
    }).then(async (result) => {
      if (result.isConfirmed || result.isDenied) {
        const { action, comment } = result.value;
        try {
          await leaveService.updateLeaveStatus(leave.leaveId!, action, comment);
          const actionText = action === 'APPROVED' ? 'approved' : 'rejected';
          setConfirmation(`Leave request ${actionText} successfully${comment ? ` with comment` : ''}.`);

          setRecentPendingLeaves(prev => prev.filter(l => l.leaveId !== leave.leaveId));
          setPendingLeavesCount(prev => prev - 1);
          if (action === 'APPROVED') setApprovedLeavesCount(prev => prev + 1);

          setTimeout(() => setConfirmation(null), 4000);
        } catch (err: any) {
          Swal.fire('Error', err.message || `Failed to ${action.toLowerCase()} leave`, 'error');
        }
      }
    });
  };
 
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-xl font-medium text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Access Denied</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Confirmation Toast */}
        {confirmation && (
          <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
            <CheckCircle className="w-6 h-6" />
            <span className="font-medium">{confirmation}</span>
          </div>
        )}
        {/* Responsive Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Manager Dashboard
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-gray-600 font-medium">
            Welcome back! Here’s your team overview
          </p>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Leaves</p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">{pendingLeavesCount}</p>
              </div>
              <Calendar className="w-12 h-12 text-indigo-500 opacity-80" />
            </div>
            <button
              onClick={() => router.push('/manager/leaves')}
              className="mt-4 text-indigo-600 hover:underline text-sm font-medium"
            >
              Review Now
            </button>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Approved This Month</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{approvedLeavesCount}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-80" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Pending Leaves */}
          {recentPendingLeaves.length > 0 && (
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <AlertCircle className="w-7 h-7 text-yellow-600" />
                  Pending Leave Requests
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Dates</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentPendingLeaves.map((leave) => (
                      <tr key={leave.leaveId} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-5 text-sm font-medium text-gray-900">
                          {leave.employeeName || 'Unknown'}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {leave.leaveCategoryType || 'N/A'}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {leave.fromDate && leave.toDate
                            ? `${format(new Date(leave.fromDate), 'dd MMM')} → ${format(new Date(leave.toDate), 'dd MMM yyyy')}`
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-5">
                          <button
                            onClick={() => handleReviewLeave(leave)}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
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
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <Calendar className="w-7 h-7 text-purple-600" />
                  Upcoming Holidays
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {upcomingHolidays.map((holiday) => (
                  <div
                    key={holiday.holidayId}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all duration-300 border border-purple-100"
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-lg">{holiday.holidayName}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(holiday.holidayDate), 'EEEE, MMMM d, yyyy')}
                      </p>
                      {holiday.comments && (
                        <p className="text-xs text-gray-500 mt-2 italic">"{holiday.comments}"</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-4xl font-bold text-purple-600">
                        {format(new Date(holiday.holidayDate), 'dd')}
                      </div>
                      <div className="text-sm font-medium text-purple-600 uppercase tracking-wider">
                        {format(new Date(holiday.holidayDate), 'MMM')}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-center mt-6">
                  <button
                    onClick={() => router.push('/dashboard/holiday')}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm hover:underline"
                  >
                    View Full Holiday Calendar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
