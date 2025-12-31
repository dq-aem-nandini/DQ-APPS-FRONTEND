'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format } from 'date-fns';
import { adminService } from '@/lib/api/adminService';
import { leaveService } from '@/lib/api/leaveService';
// import { invoiceService } from '@/lib/api/invoiceService';
import {
  Users,
  Building2,
  Clock,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DashboardContent = () => {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  // const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [clientsRes, employeesRes, pendingRes] = await Promise.all([
          adminService.getAllClients(),
          adminService.getAllEmployees(),
          leaveService.getPendingLeaves(),
          // invoiceService.getAllInvoices(), 
        ]);

        setTotalClients(clientsRes.response?.length || 0);
        setTotalEmployees(employeesRes.response?.length || 0);
        setPendingLeaves(pendingRes);
        // setTotalRevenue(
        //   invoicesRes.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0)
        // );
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center bg-gray-50 min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-4 border-sky-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 max-w-md mx-auto">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen space-y-6 md:space-y-8">
      {/* Key Metrics - 1 per row on mobile & tablet, 3 per row only on desktop (lg+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
        <ResponsiveMetricCard
          icon={<Users className="w-5 h-5 md:w-6 md:h-6 text-sky-600" />}
          title="Employees"
          value={totalEmployees}
          bg="bg-sky-50"
          border="border-sky-200"
        />
        <ResponsiveMetricCard
          icon={<Building2 className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />}
          title="Clients"
          value={totalClients}
          bg="bg-teal-50"
          border="border-teal-200"
        />
        <ResponsiveMetricCard
          icon={<Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />}
          title="Pending Leaves"
          value={pendingLeaves.length}
          bg="bg-amber-50"
          border="border-amber-200"
          badge={pendingLeaves.length > 0}
        />
      </div>

      {/* Quick Actions - 1 per row on mobile & tablet, 3 per row only on desktop (lg+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <ResponsiveActionCard
          icon={<Users className="w-5 h-5 md:w-6 md:h-6" />}
          title="Manage Employees"
          description="View and edit team members"
          href="/admin-dashboard/employees"
          bg="bg-sky-50"
          hover="hover:bg-sky-100"
          border="border-sky-200"
        />
        <ResponsiveActionCard
          icon={<Building2 className="w-5 h-5 md:w-6 md:h-6" />}
          title="Clients"
          description="View and manage clients"
          href="/admin-dashboard/clients"
          bg="bg-teal-50"
          hover="hover:bg-teal-100"
          border="border-teal-200"
        />
        <ResponsiveActionCard
          icon={<DollarSign className="w-5 h-5 md:w-6 md:h-6" />}
          title="Invoices"
          description="Track billing and revenue"
          href="/admin-dashboard/invoice"
          bg="bg-purple-50"
          hover="hover:bg-purple-100"
          border="border-purple-200"
        />
      </div>

      {/* Pending Leaves Section - unchanged */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-3 bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800">
              Pending Leave Requests
            </h3>
            {pendingLeaves.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-sm font-medium px-3 py-1 rounded-full">
                {pendingLeaves.length} pending
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 italic">No pending leave requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.slice(0, 10).map((leave: any) => (
                  <div
                    key={leave.leaveId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {leave.employeeName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(leave.fromDate), 'MMM dd, yyyy')} –{' '}
                        {format(new Date(leave.toDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
                {pendingLeaves.length > 10 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    +{pendingLeaves.length - 10} more requests
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResponsiveMetricCard = ({ icon, title, value, bg, border, badge }: any) => (
  <div
    className={`bg-white p-5 sm:p-6 md:p-6 rounded-2xl shadow-sm ${border} hover:shadow-md transition-all`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm sm:text-base font-medium text-gray-600">{title}</p>
        <p className="text-3xl sm:text-4xl md:text-3xl font-bold text-gray-800 mt-2">{value}</p>
      </div>
      <div className={`p-4 sm:p-5 md:p-4 rounded-xl ${bg}`}>{icon}</div>
    </div>
    {badge && (
      <span className="inline-block mt-3 bg-amber-100 text-amber-700 text-xs sm:text-sm font-medium px-3 py-1 rounded-full">
        Requires attention
      </span>
    )}
  </div>
);

const ResponsiveActionCard = ({ icon, title, description, href, bg, hover, border }: any) => (
  <a
    href={href}
    className={`block p-5 md:p-6 rounded-2xl ${border} ${bg} ${hover} transition-all hover:shadow-md hover:-translate-y-1 overflow-hidden`}
  >
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-xl bg-white shadow-sm flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1"> {/* This prevents overflow */}
        <h3 className="font-semibold text-gray-800 line-clamp-2 break-words">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-3 break-words">
          {description}
        </p>
      </div>
    </div>
  </a>
);
   
export default DashboardContent;