
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
      {/* Action Cards Section */}
      <section className="action-cards flex justify-center mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          <div className="card bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-2xl transition">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Apply Leaves</h3>
            <button
              onClick={handleApplyLeave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Apply Now
            </button>
          </div>

          <div className="card bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-2xl transition">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">View All Leaves</h3>
            <button
              onClick={() => router.push('/dashboard/leaves/history')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              View History
            </button>
          </div>
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
