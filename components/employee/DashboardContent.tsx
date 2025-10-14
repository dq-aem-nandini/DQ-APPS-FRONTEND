// components/employee/DashboardContent.tsx
'use client';

export default function DashboardContent() {
  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[
          { label: 'Attendance', value: '92%', icon: '📅' },
          { label: 'Active Projects', value: '3', icon: '💼' },
          { label: 'Leaves Remaining', value: '2', icon: '🌴' },
          { label: 'Hours Logged', value: '40h', icon: '⏰' },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white p-5 rounded-lg shadow border flex items-center space-x-4"
          >
            <div className="text-3xl">{card.icon}</div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-xl font-semibold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Apply Leave', icon: '🌴' },
          { label: 'Submit Timesheet', icon: '🕒' },
          { label: 'View Projects', icon: '💼' },
          { label: 'Contact HR', icon: '💬' },
        ].map((action) => (
          <div
            key={action.label}
            className="bg-white p-4 rounded-lg border shadow hover:shadow-md flex flex-col items-center justify-center cursor-pointer transition"
          >
            <span className="text-3xl mb-2">{action.icon}</span>
            <span className="text-sm font-medium text-gray-800">{action.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
