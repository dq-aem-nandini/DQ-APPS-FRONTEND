'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { adminService } from '@/lib/api/adminService';
import { leaveService } from '@/lib/api/leaveService';

import { invoiceService } from '@/lib/api/invoiceService';
import {
  Users,
  Building2,
  FileText,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Menu,
} from 'lucide-react';
import { timesheetService } from '@/lib/api/timeSheetService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DashboardContent = () => {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [totalTimesheets, setTotalTimesheets] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [timesheetTrend, setTimesheetTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date();
  const monthLabel = format(today, 'MMMM yyyy');
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [
          clientsRes,
          employeesRes,
          pendingRes,
          timesheetsRes,
          invoicesRes,
        ] = await Promise.all([
          adminService.getAllClients(),
          adminService.getAllEmployees(),
          leaveService.getPendingLeaves(),
          timesheetService.getAllTimesheets({ startDate: monthStart, endDate: monthEnd, size: 1000 }),
          invoiceService.getAllInvoices(),
        ]);

        setTotalClients(clientsRes.response?.length || 0);
        setTotalEmployees(employeesRes.response?.length || 0);
        setPendingLeaves(pendingRes);
        setTotalTimesheets(timesheetsRes.response?.length || 0);
        setTotalRevenue(invoicesRes.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0));

        const days = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
        const trend = days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          return timesheetsRes.response?.filter((t: any) => t.workDate === dateStr).length || 0;
        });
        setTimesheetTrend(trend);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [monthStart, monthEnd]);

  const timesheetChartData = {
    labels: Array.from({ length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Timesheets',
        data: timesheetTrend,
        borderColor: 'rgb(99, 187, 255)',
        backgroundColor: 'rgba(99, 187, 255, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 12 } } },
      title: { display: true, text: `Timesheet Activity – ${monthLabel}`, font: { size: 14 }, color: '#374151' },
      tooltip: { backgroundColor: 'rgba(255, 255, 255, 0.95)', bodyColor: '#374151', titleColor: '#374151', borderColor: '#e5e7eb', borderWidth: 1 },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280', font: { size: 11 } } },
      x: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280', font: { size: 11 } } },
    },
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 sm:p-6 md:p-8 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-4 border-sky-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2 max-w-md mx-auto">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen space-y-6 md:space-y-8">
      {/* Header
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
         
          <div className="md:hidden">
            <Menu className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div> */}

      {/* Key Metrics - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <ResponsiveMetricCard
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />}
          title="Employees"
          value={totalEmployees}
          bg="bg-sky-50"
          border="border-sky-200"
        />
        <ResponsiveMetricCard
          icon={<Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />}
          title="Clients"
          value={totalClients}
          bg="bg-teal-50"
          border="border-teal-200"
        />
        <ResponsiveMetricCard
          icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />}
          title="Pending Leaves"
          value={pendingLeaves.length}
          bg="bg-amber-50"
          border="border-amber-200"
          badge={pendingLeaves.length > 0}
        />
        <ResponsiveMetricCard
          icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />}
          title="Timesheets"
          value={totalTimesheets}
          bg="bg-emerald-50"
          border="border-emerald-200"
        />
        <ResponsiveMetricCard
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />}
          title="Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          bg="bg-purple-50"
          border="border-purple-200"
        />
      </div>

      {/* Charts + Pending Leaves - Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Timesheet Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Timesheet Trend</h3>
          <div className="h-64 sm:h-72 md:h-80">
            <Line data={timesheetChartData} options={chartOptions} />
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Pending Leaves</h3>
            {pendingLeaves.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingLeaves.length}
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto">
            {pendingLeaves.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm italic text-center py-4">No pending requests</p>
            ) : (
              pendingLeaves.slice(0, 5).map((leave: any) => (
                <div key={leave.leaveId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-800 truncate">{leave.employeeName}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(leave.fromDate), 'MMM dd')} – {format(new Date(leave.toDate), 'MMM dd')}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Approve">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Reject">
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
            {pendingLeaves.length > 5 && (
              <p className="text-xs text-center text-gray-500 mt-2">
                +{pendingLeaves.length - 5} more
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Stack on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <ResponsiveActionCard
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
          title="Employees"
          description="Manage team"
          href="/admin-dashboard/employees"
          bg="bg-sky-50"
          hover="hover:bg-sky-100"
          border="border-sky-200"
        />
        <ResponsiveActionCard
          icon={<Building2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          title="Clients"
          description="View clients"
          href="/admin-dashboard/clients"
          bg="bg-teal-50"
          hover="hover:bg-teal-100"
          border="border-teal-200"
        />
        <ResponsiveActionCard
          icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />}
          title="Invoices"
          description="Track revenue"
          href="/admin-dashboard/invoice"
          bg="bg-emerald-50"
          hover="hover:bg-emerald-100"
          border="border-emerald-200"
        />
      </div>
    </div>
  );
};

// Responsive Metric Card
const ResponsiveMetricCard = ({ icon, title, value, bg, border, badge }: any) => (
  <div className={`bg-white p-4 sm:p-6 rounded-2xl shadow-sm border ${border} hover:shadow-md transition-all`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`p-2.5 sm:p-3 rounded-xl ${bg}`}>
        {icon}
      </div>
    </div>
    {badge && (
      <span className="inline-block mt-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
        Needs Review
      </span>
    )}
  </div>
);

// Responsive Action Card
const ResponsiveActionCard = ({ icon, title, description, href, bg, hover, border }: any) => (
  <a
    href={href}
    className={`block p-4 sm:p-6 rounded-2xl border ${border} ${bg} ${hover} transition-all hover:shadow-md hover:-translate-y-1`}
  >
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="p-2.5 sm:p-3 rounded-xl bg-white shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-sm sm:text-base text-gray-800">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  </a>
);

export default DashboardContent;