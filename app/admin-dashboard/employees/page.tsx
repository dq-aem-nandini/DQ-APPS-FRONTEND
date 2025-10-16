// app/admin-dashboard/employees/page.tsx (main employee page with cards/sections)
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function EmployeesPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Employees</h2>
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
          {/* <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="text-4xl mb-4">🗑️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Employee</h3>
            <p className="text-sm text-gray-600">Delete employees from the list page.</p>
          </div> */}
        </div>
      </div>
    </ProtectedRoute>
  );
}