'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { timesheetService } from '@/lib/api/timeSheetService';
import { TimeSheetResponseDto} from '@/lib/api/types';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface TimesheetTableRow extends TimeSheetResponseDto {
  selected?: boolean;
}

const ManagerTimesheetsDashboard: React.FC = () => {
  const router = useRouter();
  const { state } = useAuth();
  const managerId = state.user?.userId ?? null;

  const [timesheets, setTimesheets] = useState<TimesheetTableRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimesheets, setSelectedTimesheets] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);

  const fetchTimesheets = useCallback(async () => {
    if (!managerId) return;
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        size: pageSize,
      };
      const response = await timesheetService.getAllTimesheets(params);
      if (response.flag && response.response) {
        const filtered = response.response.filter((item: TimeSheetResponseDto) => 
          ['PENDING', 'APPROVED', 'REJECTED'].includes(item.status)
        );
        const mapped = filtered.map((item: TimeSheetResponseDto) => ({
          ...item,
          selected: false,
        }));
        setTimesheets(mapped);
        setTotalElements(filtered.length || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch timesheets');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  }, [managerId, currentPage, pageSize]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const handleApprove = async () => {
    if (selectedTimesheets.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select timesheets to approve.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    try {
      setLoading(true);
      const response = await timesheetService.approveTimesheetsByManager(selectedTimesheets);
      if (response.flag) {
        Swal.fire({
          icon: 'success',
          title: 'Approved!',
          text: 'Timesheets approved successfully!',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          background: '#10b981',
          color: 'white',
        });
        setSelectedTimesheets([]);
        fetchTimesheets();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to approve timesheets.',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error approving timesheets.',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (selectedTimesheets.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select timesheets to reject.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    try {
      setLoading(true);
      const response = await timesheetService.rejectTimesheetsByManager(selectedTimesheets);
      if (response.flag) {
        Swal.fire({
          icon: 'success',
          title: 'Rejected!',
          text: 'Timesheets rejected successfully!',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          background: '#ef4444',
          color: 'white',
        });
        setSelectedTimesheets([]);
        fetchTimesheets();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to reject timesheets.',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error rejecting timesheets.',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (timesheetId: string) => {
    setSelectedTimesheets(prev =>
      prev.includes(timesheetId)
        ? prev.filter(id => id !== timesheetId)
        : [...prev, timesheetId]
    );
    setTimesheets(prev =>
      prev.map(ts => ts.timesheetId === timesheetId ? { ...ts, selected: !ts.selected } : ts)
    );
  };

  const totalPages = Math.ceil(totalElements / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Timesheets Dashboard</h1>
            <p className="text-gray-600 mt-1">Review and manage employee timesheets</p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        {/* Actions */}
        {selectedTimesheets.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
            <div className="text-sm text-blue-800">
              {selectedTimesheets.length} timesheet(s) selected
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Approve Selected
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <XCircle size={18} />
                Reject Selected
              </button>
            </div>
          </div>
        )}

        {/* Loading/Error */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading timesheets...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={fetchTimesheets}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Timesheets Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={selectedTimesheets.length === timesheets.length && timesheets.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTimesheets(timesheets.map(ts => ts.timesheetId));
                          } else {
                            setSelectedTimesheets([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timesheets.map((timesheet) => (
                    <tr key={timesheet.timesheetId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={timesheet.selected || false}
                          onChange={() => toggleSelection(timesheet.timesheetId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {timesheet.employeeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dayjs(timesheet.workDate).format('MMM DD, YYYY')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                        {timesheet.taskName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {timesheet.workedHours.toFixed(1)} hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {timesheet.projectName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            timesheet.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : timesheet.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : timesheet.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {timesheet.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {timesheet.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => [toggleSelection(timesheet.timesheetId), handleApprove()]}
                              className="text-green-600 hover:text-green-900 text-xs"
                            >
                              Approve
                            </button>
                            <span className="text-gray-300">/</span>
                            <button
                              onClick={() => [toggleSelection(timesheet.timesheetId), handleReject()]}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{currentPage * pageSize + 1}</span> to{' '}
                      <span className="font-medium">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of{' '}
                      <span className="font-medium">{totalElements}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page - 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage + 1 === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        {/* Add right arrow icon */}
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {timesheets.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No timesheets found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerTimesheetsDashboard;