'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import ProtectedRoute from '@/components/ProtectedRoute';

// Types
export interface AddressModel {
  addressId?: string;
  houseNo: string;
  streetName: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  addressType: string;
}

export interface ClientModel {
  clientId?: string;
  companyName: string;
  contactNumber: string;
  email: string;
  gst: string;
  currency: string;
  panNumber: string;
  addressModel: AddressModel;
}

export interface ClientDTO {
  clientId: string;
  companyName: string;
  contactNumber: string;
  email: string;
  gst: string;
  currency: string;
  panNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  addressModel: AddressModel;
}

const EditClientPage = () => {
  const [formData, setFormData] = useState<ClientModel>({
    companyName: '',
    contactNumber: '',
    email: '',
    gst: '',
    currency: '',
    panNumber: '',
    addressModel: {
      houseNo: '',
      streetName: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
      addressType: '',
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { state } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  // Fetch client data
  useEffect(() => {
    const fetchClient = async () => {
      try {
        const client: ClientDTO = await adminService.getClientById(clientId);
        setFormData({
          clientId: client.clientId,
          companyName: client.companyName || '',
          contactNumber: client.contactNumber || '',
          email: client.email || '',
          gst: client.gst || '',
          currency: client.currency || '',
          panNumber: client.panNumber || '',
          addressModel: {
            addressId: client.addressModel?.addressId || '',
            houseNo: client.addressModel?.houseNo || '',
            streetName: client.addressModel?.streetName || '',
            city: client.addressModel?.city || '',
            state: client.addressModel?.state || '',
            country: client.addressModel?.country || '',
            pincode: client.addressModel?.pincode || '',
            addressType: client.addressModel?.addressType || '',
          },
        });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch client');
      }
    };

    if (clientId) fetchClient();
  }, [clientId]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('addressModel.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        addressModel: {
          ...prev.addressModel,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Submit updated client
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await adminService.updateClient(clientId, formData);
      setSuccess('Client updated successfully!');
      setTimeout(() => {
        router.push('/admin-dashboard/clients/list');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Client</h2>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow p-6 space-y-6"
          >
            {/* Company Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="contactNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contact Number *
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  required
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="gst"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  GST
                </label>
                <input
                  type="text"
                  id="gst"
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Currency</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="panNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  PAN Number
                </label>
                <input
                  type="text"
                  id="panNumber"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="addressModel.houseNo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  House No
                </label>
                <input
                  type="text"
                  id="addressModel.houseNo"
                  name="addressModel.houseNo"
                  value={formData.addressModel.houseNo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="addressModel.streetName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Street Name
                </label>
                <input
                  type="text"
                  id="addressModel.streetName"
                  name="addressModel.streetName"
                  value={formData.addressModel.streetName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="addressModel.city"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  City *
                </label>
                <input
                  type="text"
                  id="addressModel.city"
                  name="addressModel.city"
                  required
                  value={formData.addressModel.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="addressModel.state"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  State *
                </label>
                <input
                  type="text"
                  id="addressModel.state"
                  name="addressModel.state"
                  required
                  value={formData.addressModel.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="addressModel.pincode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Pin Code *
                </label>
                <input
                  type="text"
                  id="addressModel.pincode"
                  name="addressModel.pincode"
                  required
                  value={formData.addressModel.pincode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="addressModel.country"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Country *
                </label>
                <input
                  type="text"
                  id="addressModel.country"
                  name="addressModel.country"
                  required
                  value={formData.addressModel.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="text-red-600 text-sm p-2 bg-red-50 rounded">{error}</div>
            )}
            {success && (
              <div className="text-green-600 text-sm p-2 bg-green-50 rounded">{success}</div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Client'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default EditClientPage;
