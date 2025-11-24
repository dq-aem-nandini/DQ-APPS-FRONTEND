// app/admin-dashboard/employees/page.tsx
'use client';

import Link from 'next/link';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function EmployeesPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-6 sm:mb-8 md:mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Employees
          </h1>
        </div>

        {/* Cards Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-full">
            {/* Add Employee */}
            <Link href="/admin-dashboard/employees/add" className="group w-full">
              <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02] cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-4 sm:p-6 md:p-8 text-center h-full flex flex-col justify-center">
                  <div className="mx-auto mb-3 sm:mb-4 md:mb-5 w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <UserPlus className="w-5 sm:w-6 md:w-8 h-5 sm:h-6 md:h-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Add Employee</h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">
                    Create a new employee profile with personal, salary, and role details.
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Card>
            </Link>

            {/* Employee List */}
            <Link href="/admin-dashboard/employees/list" className="group w-full">
              <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02] cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-4 sm:p-6 md:p-8 text-center h-full flex flex-col justify-center">
                  <div className="mx-auto mb-3 sm:mb-4 md:mb-5 w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                    <Users className="w-5 sm:w-6 md:w-8 h-5 sm:h-6 md:h-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Employee List</h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">
                    View, search, edit, update, or delete existing employee records.
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}