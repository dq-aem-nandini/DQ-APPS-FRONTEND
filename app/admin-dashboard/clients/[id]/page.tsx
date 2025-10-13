// app/admin-dashboard/clients/[id]/page.tsx (view client)
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { ClientDTO } from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';

const ViewClient = () => {
  const [client, setClient] = useState<ClientDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { state } = useAuth();
  const params = useParams();
  const clientId = params.id as string;

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const data = await adminService.getClientById(clientId);
        setClient(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch client');
      } finally {
        setLoading(false);
      }
    };
    if (clientId) fetchClient();
  }, [clientId]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center">Loading...</div>
      </ProtectedRoute>
    );
  }

  if (error || !client) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center text-red-600">{error || 'Client not found'}</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{client.companyName}</h2>
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{client.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <p className="text-gray-900">{client.contactNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST</label>
                <p className="text-gray-900">{client.gst}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <p className="text-gray-900">{client.currency}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <p className="text-gray-900">{client.panNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className="text-gray-900">{client.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <p className="text-gray-900">{client.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <p className="text-gray-900">{client.state}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code</label>
                <p className="text-gray-900">{client.pinCode}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <p className="text-gray-900">{client.country}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(client.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                <p className="text-gray-900">{new Date(client.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ViewClient;