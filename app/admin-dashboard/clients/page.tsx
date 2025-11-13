'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Plus, Building2 } from 'lucide-react';

export default function ClientsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 md:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-10">
          <div className="relative flex items-center justify-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Clients
            </h1>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">

            {/* Add Client */}
            <Link href="/admin-dashboard/clients/add" className="group">
              <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02] cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative p-8 text-center">
                  <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <Plus className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Add Client</h3>
                  <p className="text-sm text-gray-600">
                    Create a new client profile with company details, contacts, and billing info.
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Card>
            </Link>

            {/* Client List */}
            <Link href="/admin-dashboard/clients/list" className="group">
              <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02] cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative p-8 text-center">
                  <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Client List</h3>
                  <p className="text-sm text-gray-600">
                    View, search, edit, update, or delete existing client records.
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