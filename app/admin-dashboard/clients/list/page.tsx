'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { ClientDTO } from '@/lib/api/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';

const ClientList = () => {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const { state } = useAuth();
  const router = useRouter();

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await adminService.getAllClients();
        const clientList: ClientDTO[] = data.response || [];
        setClients(clientList);
        setFilteredClients(clientList);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = [...clients];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.companyName.toLowerCase().includes(term) ||
          client.email.toLowerCase().includes(term) ||
          client.contactNumber.includes(term)
      );
    }
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  // Delete handler
  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    setDeletingId(clientId);
    try {
      await adminService.deleteClientById(clientId); // Correct method
      setClients((prev) => prev.filter((c) => c.clientId !== clientId));
      setFilteredClients((prev) => prev.filter((c) => c.clientId !== clientId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="flex items-center justify-center h-[80vh] p-4 sm:p-6 md:p-8 text-center text-gray-600">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Loading clients...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-4 sm:p-6 md:p-8 text-center text-red-600">
          <p className="text-sm sm:text-base">{error}</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="relative flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
            <div className="absolute left-0">
              <BackButton to="/admin-dashboard/clients" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent px-16 sm:px-24 md:px-32">
              Client List
            </h1>
          </div>
          <div className="flex justify-end mb-4 sm:mb-6">
            <Link
              href="/admin-dashboard/clients/add"
              className="w-full sm:w-auto max-w-xs sm:max-w-none bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium"
            >
              Add New Client
            </Link>
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
              <div className="flex-1 max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search by name, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>


            </div>

            {filteredClients.length !== clients.length && (
              <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center sm:text-left">
                Showing <strong>{filteredClients.length}</strong> of <strong>{clients.length}</strong> clients
              </p>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Contact
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    City
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                      No clients found.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const primaryAddress = client.addresses?.[0];

                    return (
                      <tr key={client.clientId} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            {client.companyName}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                          {client.email}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                          {client.contactNumber}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                          {primaryAddress?.city || '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${client.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {client.status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium space-x-1 sm:space-x-3 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-0">
                          <Link
                            href={`/admin-dashboard/clients/${client.clientId}`}
                            className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm block sm:inline"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin-dashboard/clients/${client.clientId}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm block sm:inline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(client.clientId)}
                            disabled={deletingId === client.clientId}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                          >
                            {deletingId === client.clientId ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ClientList;