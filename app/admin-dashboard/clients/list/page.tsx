// app/admin-dashboard/clients/list/page.tsx (client list with CRUD)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { ClientDTO } from '@/lib/api/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

const ClientList = () => {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await adminService.getAllClients();
        setClients(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    setDeletingId(clientId);
    try {
      await adminService.deleteClient(clientId);
      setClients(clients.filter((client) => client.clientId !== clientId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center">Loading clients...</div>
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
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Client List</h2>
          <Link
            href="/admin-dashboard/clients/add"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add New Client
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.clientId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.companyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.contactNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link href={`/admin-dashboard/clients/${client.clientId}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                    <Link href={`/admin-dashboard/clients/${client.clientId}/edit`} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                    <button 
                      onClick={() => handleDelete(client.clientId)}
                      disabled={deletingId === client.clientId}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deletingId === client.clientId ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ClientList;