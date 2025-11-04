
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { leaveService } from '@/lib/api/leaveService';
import { LeaveResponseDTO } from '@/lib/api/types';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';

const LeaveDashboard: React.FC = () => {
  const { state: { user } } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<{
    balances: { availableLeaves: number };
    pendingRequests: LeaveResponseDTO[];
    approvedRequests: LeaveResponseDTO[];
    rejectedRequests: LeaveResponseDTO[];
    withdrawnRequests: LeaveResponseDTO[];
    totalLeavesTaken: number;
    remainingLeaves: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!user || user.role !== 'EMPLOYEE') {
      router.push('/unauthorized');
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await leaveService.getLeaveDashboard(user);
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        console.error('❌ Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, router]);

  if (loading) return <div className="loading flex justify-center items-center h-64">Loading dashboard...</div>;
  if (error) return <div className="error text-red-500 p-4">Error: {error}</div>;
  if (!dashboardData) return <div className="text-gray-500 p-4">No data available.</div>;

  const { balances, pendingRequests, approvedRequests, rejectedRequests, totalLeavesTaken, remainingLeaves, withdrawnRequests } = dashboardData;

  const thisYearApproved = approvedRequests.filter((req: LeaveResponseDTO) => 
    req.fromDate && new Date(req.fromDate).getFullYear() === currentYear
  ).length;
  const thisYearRejected = rejectedRequests.filter((req: LeaveResponseDTO) => 
    req.fromDate && new Date(req.fromDate).getFullYear() === currentYear
  ).length;

  const totalLeavesApplied = pendingRequests.length + approvedRequests.length + rejectedRequests.length;

  const handleApplyLeave = () => router.push('/dashboard/leaves/applyleave');

  return (
    <div className="leave-dashboard p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Leave Dashboard</h1>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition duration-300"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
      </div>

      {/* Action Cards Section */}
      <section className="action-cards grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-2">Apply Leaves</h3>
          <button onClick={handleApplyLeave} className="btn-primary bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
            Apply Now
          </button>
        </div>
        <div className="card bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-2">View All Leaves</h3>
          <button onClick={() => router.push('/dashboard/leaves/history')} className="btn-secondary bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
            View History
          </button>
        </div>
        <div className="card bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-2">Leave Calendar</h3>
          <button onClick={() => router.push('/dashboard/leaves/calendar')} className="btn-secondary bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
            View Calendar
          </button>
        </div>
      </section>

      {/* KPI Cards Section */}
      <section className="kpi-cards grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="card kpi-card bg-blue-50 p-4 rounded-lg text-center border">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Available Leaves</h3>
          <p className="value text-2xl font-bold text-blue-600">{balances.availableLeaves}</p>
        </div>
        <div className="card kpi-card bg-yellow-50 p-4 rounded-lg text-center border">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Requests</h3>
          <p className="value text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
        </div>
        <div className="card kpi-card bg-green-50 p-4 rounded-lg text-center border">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Approved This Year</h3>
          <p className="value text-2xl font-bold text-green-600">{thisYearApproved}</p>
        </div>
        <div className="card kpi-card bg-red-50 p-4 rounded-lg text-center border">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Rejected This Year</h3>
          <p className="value text-2xl font-bold text-red-600">{thisYearRejected}</p>
        </div>
        <div className="card kpi-card bg-indigo-50 p-4 rounded-lg text-center border">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Withdrawn Requests</h3>
          <p className="value text-2xl font-bold text-indigo-600">{withdrawnRequests.length}</p>
        </div>
        <div className="card kpi-card bg-purple-50 p-4 rounded-lg text-center border">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Leaves Applied</h3>
          <p className="value text-2xl font-bold text-purple-600">{totalLeavesApplied}</p>
        </div>
      </section>
    </div>
  );
};

export default LeaveDashboard;
