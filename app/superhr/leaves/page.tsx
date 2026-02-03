'use client';

import { useRouter } from 'next/navigation';
import { CalendarDays, History } from 'lucide-react';

const LeaveDashboard: React.FC = () => {
  const router = useRouter();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">

      {/* Compact & Beautiful Action Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Apply Leave */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
          onClick={() => router.push('/superhr/leaves/applyleave')}>
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
          onClick={() => router.push('/superhr/leaves/history')}
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
    </div>
  );
};

export default LeaveDashboard;