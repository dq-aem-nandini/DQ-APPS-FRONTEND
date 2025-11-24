'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminService } from '@/lib/api/adminService';
import { invoiceService } from '@/lib/api/invoiceService';
import {
  ClientDTO,
  InvoiceDTO,
  WebResponseDTOClientDTO,
  EmployeeDTO,
  WebResponseDTOListEmployeeDTO,
} from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  Calendar,
  Download,
  Users,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';

const ViewClientPage = () => {
  const { id } = useParams();
  const [client, setClient] = useState<ClientDTO | null>(null);
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { loading, withLoading } = useLoading();
  const router = useRouter();

  // Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [generating, setGenerating] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Set default month/year
  useEffect(() => {
    if (showGenerateModal) {
      setMonth(String(currentMonth).padStart(2, '0'));
      setYear(String(currentYear));
    }
  }, [showGenerateModal]);

  // Helper: Check if value exists
  const hasValue = (val: any): boolean => val != null && val !== '' && val !== 'null' && val !== 'undefined';

  // ────────────────────── FETCH CLIENT & EMPLOYEES ──────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      await withLoading(async () => {
        // Fetch Client
        const clientWrapper: WebResponseDTOClientDTO = await adminService.getClientById(id as string);
        if (!clientWrapper.flag || !clientWrapper.response) {
          throw new Error(clientWrapper.message || 'Client not found');
        }
        setClient(clientWrapper.response);

        // Fetch Employees
        const empWrapper: WebResponseDTOListEmployeeDTO = await adminService.getEmployeesByClientId(id as string);
        if (empWrapper.flag && empWrapper.response) {
          setEmployees(empWrapper.response);
        }
      }).catch(err => {
        setError(err.message || 'Failed to load data');
      });
    };

    fetchData();
  }, [id, withLoading]);

  // ────────────────────── GENERATE INVOICE ──────────────────────
  const handleGenerateInvoice = async () => {
    if (!month || !year) {
      Swal.fire({ icon: 'warning', title: 'Invalid Date', text: 'Please select month and year.' });
      return;
    }

    setGenerating(true);
    try {
      const invoice: InvoiceDTO = await invoiceService.generateInvoice(id as string, parseInt(month), parseInt(year));

      setToast({
        type: 'success',
        message: `Invoice ${invoice.invoiceNumber} generated successfully!`,
      });

      setShowGenerateModal(false);
      setTimeout(() => {
        window.open(`/admin-dashboard/invoice/${invoice.clientId}`, '_blank');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.status === 409
        ? 'Invoice already exists for this month.'
        : err.message || 'Failed to generate invoice';
      Swal.fire({ icon: 'error', title: 'Error', text: errorMessage });
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !client) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <Spinner size="lg" />
            </div>
          )}

          {toast && (
            <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in-right ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="font-medium">{toast.message}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {client && (
            <>
              {/* Header */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6 md:p-6 mb-6 sm:mb-8 border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg sm:rounded-xl flex-shrink-0">
                      <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 line-clamp-1">{client.companyName}</h1>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 px-4 sm:px-5 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition shadow-md text-sm sm:text-base"
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    Generate Invoice
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Company Details */}
                  {(hasValue(client.contactNumber) ||
                    hasValue(client.email) ||
                    hasValue(client.gst) ||
                    hasValue(client.panNumber) ||
                    hasValue(client.tanNumber) ||
                    hasValue(client.currency)) && (
                      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          Company Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {hasValue(client.contactNumber) && <InfoItem icon={Phone} label="Contact Number" value={client.contactNumber!} />}
                          {hasValue(client.email) && <InfoItem icon={Mail} label="Email" value={client.email!} />}
                          {hasValue(client.gst) && <InfoItem icon={Globe} label="GST" value={client.gst!} />}
                          {hasValue(client.panNumber) && <InfoItem icon={BadgeCheck} label="PAN" value={client.panNumber!} />}
                          {hasValue(client.tanNumber) && <InfoItem icon={FileText} label="TAN" value={client.tanNumber!} />}
                          {hasValue(client.currency) && <InfoItem icon={DollarSign} label="Currency" value={client.currency!} />}
                        </div>
                      </div>
                    )}

                  {/* Points of Contact */}
                  {Array.isArray(client.pocs) && client.pocs.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                      <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-600" />
                        Points of Contact
                      </h3>
                      <div className="space-y-4">
                        {client.pocs.map((poc, i) => (
                          <div key={poc.pocId || i} className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {hasValue(poc.name) && <InfoItem icon={User} label="Name" value={poc.name!} />}
                              {hasValue(poc.email) && <InfoItem icon={Mail} label="Email" value={poc.email!} />}
                              {hasValue(poc.contactNumber) && <InfoItem icon={Phone} label="Contact" value={poc.contactNumber!} />}
                              {hasValue(poc.designation) && <InfoItem icon={Briefcase} label="Designation" value={poc.designation!} />}
                            </div>
                            {hasValue(poc.status) && (
                              <div className="mt-3 flex justify-end">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${poc.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {poc.status}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Addresses */}
                  {client.addresses && client.addresses.some(a =>
                    hasValue(a.addressType) || hasValue(a.houseNo) || hasValue(a.streetName) ||
                    hasValue(a.city) || hasValue(a.state) || hasValue(a.country) || hasValue(a.pincode)
                  ) && (
                      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-indigo-600" />
                          Addresses
                        </h3>
                        <div className="space-y-4">
                          {client.addresses
                            .filter(a => hasValue(a.addressType) || hasValue(a.houseNo) || hasValue(a.streetName) ||
                              hasValue(a.city) || hasValue(a.state) || hasValue(a.country) || hasValue(a.pincode))
                            .map((addr, i) => (
                              <div key={addr.addressId || i} className="p-5 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {hasValue(addr.addressType) && <InfoItem label="Type" value={addr.addressType!} />}
                                  {hasValue(addr.houseNo) && <InfoItem label="House No" value={addr.houseNo!} />}
                                  {hasValue(addr.streetName) && <InfoItem label="Street" value={addr.streetName!} />}
                                  {hasValue(addr.city) && <InfoItem label="City" value={addr.city!} />}
                                  {hasValue(addr.state) && <InfoItem label="State" value={addr.state!} />}
                                  {hasValue(addr.country) && <InfoItem label="Country" value={addr.country!} />}
                                  {hasValue(addr.pincode) && <InfoItem label="Pincode" value={addr.pincode!} />}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  {/* Client Employees */}
                  {employees.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                      <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Employees ({employees.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left p-3 text-sm font-semibold text-gray-700">Employee</th>
                              <th className="text-left p-3 text-sm font-semibold text-gray-700 hidden md:table-cell">Designation</th>
                              <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                              <th className="text-left p-3 text-sm font-semibold text-gray-700 hidden lg:table-cell">Phone</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employees.map((emp, index) => (
                              <tr
                                key={emp.employeeId}
                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                                  }`}
                                onClick={() => router.push(`/admin-dashboard/employees/${emp.employeeId}`)}
                              >
                                <td className="p-3">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {emp.firstName} {emp.lastName}
                                      </p>
                                      <p className="text-sm text-gray-500">{emp.companyEmail}</p>
                                    </div>
                                  </div>

                                </td>
                                <td className="p-3 hidden md:table-cell">
                                  <span className="text-sm text-gray-700">{emp.designation || '—'}</span>
                                </td>
                                <td className="p-3">
                                  <span className="text-sm text-gray-700 truncate max-w-xs">{emp.companyEmail}</span>
                                </td>
                                <td className="p-3 hidden lg:table-cell">
                                  <span className="text-sm text-gray-700">{emp.contactNumber || '—'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {employees.length === 0 && (
                        <div className="text-center py-12">
                          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No employees found.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Tax Details */}
                  {client.clientTaxDetails && client.clientTaxDetails.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                      <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-indigo-600" />
                        Tax Details
                      </h3>
                      <div className="space-y-3">
                        {client.clientTaxDetails.map((tax) => (
                          <div key={tax.taxId} className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                            <span className="font-medium text-gray-800">{tax.taxName}</span>
                            <span className="text-lg font-bold text-amber-700">{tax.taxPercentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

        {/* Generate Invoice Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                  Generate Invoice
                </h3>
                <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Month</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min="2000"
                    max="2100"
                    placeholder="2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleGenerateInvoice}
                  disabled={generating || !month || !year}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Spinner size="sm" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

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