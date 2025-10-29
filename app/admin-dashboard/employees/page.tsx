// app/admin-dashboard/employees/page.tsx (main employee page with cards/sections)
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';

export default function EmployeesPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-8">
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute left-0">
            <BackButton fallback="/admin-dashboard" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Employees
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin-dashboard/employees/add">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow border border-gray-200">
              <div className="text-4xl mb-4">➕</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Employee</h3>
              <p className="text-sm text-gray-600">Create a new employee profile with all details.</p>
            </div>
          </Link>
          <Link href="/admin-dashboard/employees/list">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow border border-gray-200">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee List</h3>
              <p className="text-sm text-gray-600">View, edit, update, and delete employees.</p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}