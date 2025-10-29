'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminService } from '@/lib/api/adminService';
import {
  ClientDTO,
  ClientPoc,
  AddressModel,
  ClientTaxDetail,
  WebResponseDTOClientDTO,
} from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';
import Spinner from '@/components/ui/Spinner';
import useLoading from '@/hooks/useLoading';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  BadgeCheck,
  User,
  Briefcase,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const ViewClientPage = () => {
  const { id } = useParams();
  const [client, setClient] = useState<ClientDTO | null>(null);
  const [error, setError] = useState('');
  const { loading, withLoading } = useLoading();
  const router = useRouter();

  // ────────────────────── FETCH CLIENT ──────────────────────
  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;

      await withLoading(async () => {
        console.log('Fetching client with ID:', id);
        const wrapper: WebResponseDTOClientDTO = await adminService.getClientById(id as string);
        console.log('Fetched client wrapper:', wrapper);
        if (!wrapper.flag || !wrapper.response) {
          throw new Error(wrapper.message || 'Client not found');
        }
        console.log('Setting client:', wrapper.response);
        setClient(wrapper.response);
        setError('');
      }).catch(err => {
        console.error('Error fetching client:', err);
        setError(err.message || 'Failed to load client');
      });
    };

    fetchClient();
  }, [id, withLoading]);

  // ────────────────────── INITIAL LOADING ──────────────────────
  if (loading && !client) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  // ────────────────────── RENDER CLIENT ──────────────────────
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* <BackButton fallback="/admin-dashboard/clients/list" /> */}

          {/* Overlay Spinner */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <Spinner size="lg" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Client Content */}
          {client && (
            <>
              {/* Header Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <Building2 className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{client.companyName}</h1>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Company Details */}
                  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Company Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InfoItem icon={Phone} label="Contact Number" value={client.contactNumber} />
                      <InfoItem icon={Mail} label="Email" value={client.email} />
                      <InfoItem icon={Globe} label="GST" value={client.gst || '—'} />
                      <InfoItem icon={BadgeCheck} label="PAN" value={client.panNumber || '—'} />
                      <InfoItem icon={FileText} label="TAN" value={client.tanNumber || '—'} />
                      <InfoItem icon={DollarSign} label="Currency" value={client.currency} />
                    </div>
                  </div>

                  {/* Points of Contact */}
                  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600" />
                      Points of Contact
                    </h3>
                    {Array.isArray(client.pocs) && client.pocs.length > 0 ? (
                      <div className="space-y-4">
                        {client.pocs.map((poc, i) => (
                          <div
                            key={poc.pocId || i}
                            className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <InfoItem icon={User} label="Name" value={poc.name} />
                              <InfoItem icon={Mail} label="Email" value={poc.email} />
                              <InfoItem icon={Phone} label="Contact" value={poc.contactNumber} />
                              <InfoItem icon={Briefcase} label="Designation" value={poc.designation} />
                            </div>
                            <div className="mt-3 flex justify-end">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  poc.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {poc.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No POC added</p>
                    )}
                  </div>

                  {/* Addresses */}
                  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      Addresses
                    </h3>
                    {client.addresses && client.addresses.length > 0 ? (
                      <div className="space-y-4">
                        {client.addresses.map((addr, i) => (
                          <div
                            key={addr.addressId || i}
                            className="p-5 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <InfoItem label="Type" value={addr.addressType || '—'} />
                              <InfoItem label="House No" value={addr.houseNo || '—'} />
                              <InfoItem label="Street" value={addr.streetName || '—'} />
                              <InfoItem label="City" value={addr.city || '—'} />
                              <InfoItem label="State" value={addr.state || '—'} />
                              <InfoItem label="Country" value={addr.country || '—'} />
                              <InfoItem label="Pincode" value={addr.pincode || '—'} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No address added</p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Tax Details */}
                  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-indigo-600" />
                      Tax Details
                    </h3>
                    {client.clientTaxDetails && client.clientTaxDetails.length > 0 ? (
                      <div className="space-y-3">
                        {client.clientTaxDetails.map((tax) => (
                          <div
                            key={tax.taxId}
                            className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200"
                          >
                            <span className="font-medium text-gray-800">{tax.taxName}</span>
                            <span className="text-lg font-bold text-amber-700">{tax.taxPercentage}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No tax details</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push(`/admin-dashboard/clients/${id}/edit`)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
                      >
                        Edit Client
                      </button>
                      <button
                        onClick={() => router.push('/admin-dashboard/clients/list')}
                        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition"
                      >
                        Back to List
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

// Reusable Info Item Component
const InfoItem = ({ icon: Icon, label, value }: { icon?: any; label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </p>
    <p className="mt-1 text-base font-semibold text-gray-900">{value}</p>
  </div>
);

export default ViewClientPage;