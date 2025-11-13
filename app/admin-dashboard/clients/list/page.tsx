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
        <div className="p-8 text-center text-gray-600">Loading clients...</div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center text-red-600">{error}</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-8 bg-gray-50 min-h-screen">
      <div className="relative flex items-center justify-center mb-8">
          <div className="absolute left-0">
            <BackButton to  ="/admin-dashboard/clients" />
          </div>
          <h1 className="text-3xl font-bold  text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Client List
          </h1>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end items-center mb-6">
            <Link
              href="/admin-dashboard/clients/add"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Add New Client
            </Link>
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by name, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

             
            </div>

            {filteredClients.length !== clients.length && (
              <p className="text-sm text-gray-500 mt-3">
                Showing <strong>{filteredClients.length}</strong> of <strong>{clients.length}</strong> clients
              </p>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No clients found.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const primaryAddress = client.addresses?.[0];

                    return (
                      <tr key={client.clientId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {client.companyName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {client.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {client.contactNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {primaryAddress?.city || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              client.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {client.status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                          <Link
                            href={`/admin-dashboard/clients/${client.clientId}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin-dashboard/clients/${client.clientId}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(client.clientId)}
                            disabled={deletingId === client.clientId}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
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