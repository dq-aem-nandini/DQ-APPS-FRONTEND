'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { leaveService } from '@/lib/api/leaveService';
import { LeaveStatusCountResponseDTO } from '@/lib/api/types';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, History, CheckCircle, Clock, LogIn } from 'lucide-react';

const LeaveDashboard: React.FC = () => {
  const { state: { user } } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<LeaveStatusCountResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await leaveService.getLeaveStatusCount();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-lg font-medium text-gray-600">Loading your leave dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 font-semibold text-lg mb-4">{error || 'No data available'}</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 textured text-white rounded-xl hover:bg-indigo-700 transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">

      {/* Compact & Beautiful Action Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Apply Leave */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/dashboard/leaves/applyleave')}>
          <div className="p-10 text-white text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarDays className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Apply for Leave</h3>
            <p className="text-indigo-100 text-sm opacity-90">Request casual, sick, or earned leave</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30 group-hover:h-full transition-all duration-500"></div>
        </div>

        {/* Leave History */}
        <div
          className="group relative overflow-hidden bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/dashboard/leaves/history')}
        >
          <div className="p-10 text-white text-center relative z-10">
            <div className="w-16 h-16 mx-auto mb-6 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <History className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Leave History</h3>
            <p className="text-cyan-100 text-sm opacity-90">View all your leave requests</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30 group-hover:h-full transition-all duration-500"></div>

        </div>
      </section>

      {/* KPI Cards - Compact & Beautiful */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">

        {/* Available Leaves */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center hover:shadow-2xl transition-shadow">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white">
            <CalendarDays className="w-8 h-8" />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-2">Available Leaves</p>
          <p className="text-5xl font-extrabold text-indigo-700">{data.availableLeaves}</p>
          <p className="text-xs text-gray-500 mt-2">Days Remaining</p>
        </div>

        {/* Approved */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center hover:shadow-2xl transition-shadow">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white">
            <CheckCircle className="w-8 h-8" />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-2">Approved</p>
          <p className="text-5xl font-extrabold text-emerald-700">{data.approved}</p>
          <p className="text-xs text-gray-500 mt-2">Confirmed Leaves</p>
        </div>

        {/* Availed */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center hover:shadow-2xl transition-shadow">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white">
            <LogIn className="w-8 h-8" />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-2">Availed</p>
          <p className="text-5xl font-extrabold text-purple-700">{data.availed}</p>
          <p className="text-xs text-gray-500 mt-2">Leaves Taken</p>
        </div>
      </section>
    </div>
  );
};

export default LeaveDashboard;