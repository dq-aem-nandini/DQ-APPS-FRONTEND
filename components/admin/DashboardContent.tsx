// components/admin/DashboardContent.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
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
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DashboardContent = () => {
  const { state } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workingHours, setWorkingHours] = useState(0);
  const [overtime, setOvertime] = useState(8); // Fixed 9 hrs overtime as per user
  const [leavesRemaining, setLeavesRemaining] = useState(2); // Per month: 1 general + 1 paid + 1 sick = 3 total, 1 used
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: [
      {
        label: 'Daily Working Hours',
        data: [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.1,
      },
    ],
  });
  const [options] = useState<ChartOptions<'line'>>({
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Activity Chart',
      },
    },
  });

  useEffect(() => {
    // Update date daily
    const today = new Date();
    setCurrentDate(today);

    // Calculate working hours: assume 8 hrs/day * 22 days/month - 8 hrs (1 leave used) + 9 overtime = 177 hrs
    const standardHours = 8 * 22; // Standard working hours per month
    const leaveHours = 8; // 1 day leave used (out of 3 types)
    const calculatedWorkingHours = standardHours - leaveHours + overtime;
    setWorkingHours(calculatedWorkingHours);

    // Leaves remaining per month: 3 total (1 general + 1 paid + 1 sick) - 1 used = 2
    setLeavesRemaining(3 - 1);

    // Dynamic chart data: mock daily hours for current month (update with backend if available)
    const monthDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const labels: string[] = Array.from({ length: monthDays }, (_, i) => (i + 1).toString());
    const data: number[] = labels.map((day) => {
      // Mock: base 8 hrs + random overtime up to 9, minus occasional leave (1 day per month)
      const base = 8;
      const ot = Math.random() * overtime;
      return day === today.getDate().toString() ? base + ot : (Math.random() > 0.95 ? 0 : base + (Math.random() * 2)); // Occasional leave
    });
    setChartData({
      labels,
      datasets: [
        {
          label: 'Daily Working Hours',
          data,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          tension: 0.1,
        },
      ],
    });
  }, []); // Run once on mount; use setInterval for daily update if needed

  // Calendar component - current month with today highlighted
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const calendarDays = generateCalendar();
  const today = currentDate.getDate();

  return (
    <div className="flex-1 p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Working Hours</h3>
          <p className="text-3xl font-bold text-indigo-600">{workingHours}</p>
          <p className="text-sm text-gray-500">This month (calculated: standard - leaves + overtime)</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Overtime</h3>
          <p className="text-3xl font-bold text-green-600">{overtime}</p>
          <p className="text-sm text-gray-500">Hours</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Leaves Remaining</h3>
          <p className="text-3xl font-bold text-red-600">{leavesRemaining}</p>
          <p className="text-sm text-gray-500">Per month (3 total: 1 general + 1 paid + 1 sick, 1 used)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar ({currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</h3>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={`header-${index}`} className="font-semibold text-gray-500 py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => (
              <div 
                key={`day-${index}`} 
                className={`py-2 border border-gray-200 rounded hover:bg-gray-50 ${
                  day === today ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-600'
                }`}
              >
                {day || ''}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">Today: {currentDate.toLocaleDateString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Chart</h3>
          <Line options={options} data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;