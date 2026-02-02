'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';

import { organizationService } from '@/lib/api/organizationService';
import type { OrganizationResponseDTO } from '@/lib/api/types';
import Swal from 'sweetalert2';

// Helper: show hyphen for empty values */
const show = (val: string | null | undefined) => val || '—';

export default function OrganizationListPage() {
  const [organizations, setOrganizations] = useState<OrganizationResponseDTO[]>([]);
  const [filtered, setFiltered] = useState<OrganizationResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  // Fetch organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setLoading(true);
        const data = await organizationService.getAll(); // Returns OrganizationResponseDTO[]
        setOrganizations(data);
        setFiltered(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load organizations');
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(organizations);
      return;
    }

    const term = searchTerm.toLowerCase();
    const result = organizations.filter(org =>
      org.organizationName.toLowerCase().includes(term) ||
      org.organizationLegalName.toLowerCase().includes(term) ||
      org.email.toLowerCase().includes(term) ||
      org.contactNumber.includes(term) ||
      (org.gstNumber || '').toLowerCase().includes(term) ||
      org.panNumber.toLowerCase().includes(term)
    );
    setFiltered(result);
  }, [searchTerm, organizations]);

  // Delete handler
  // const handleDelete = async (id: string) => {
  //   if (!confirm('Are you sure you want to delete this organization permanently?')) return;

  //   setDeletingId(id);
  //   try {
  //     const res = await organizationService.delete(id);
  //     if (res.flag) {
  //       setOrganizations(prev => prev.filter(o => o.organizationId !== id));
  //       setFiltered(prev => prev.filter(o => o.organizationId !== id));
  //     } else {
  //       alert(res.message || 'Failed to delete');
  //     }
  //   } catch (err: any) {
  //     alert(err.message || 'Delete failed');
  //   } finally {
  //     setDeletingId(null);
  //   }
  // };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    // Show loading
    Swal.fire({
      title: 'Deleting...',
      text: 'Please wait while we delete the organization.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await organizationService.delete(id);

      if (res.flag) {
        setOrganizations(prev => prev.filter(o => o.organizationId !== id));
        setFiltered(prev => prev.filter(o => o.organizationId !== id));

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Organization removed successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(res.message || 'Delete failed');
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
        <div className="flex items-center justify-center h-[80vh] p-4 sm:p-6 md:p-8 text-center text-gray-600">
          <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
        <div className="p-8 text-center">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
      <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="relative flex items-center justify-center mb-6 md:mb-8">
            <div className="absolute left-0">
              <BackButton to="/admin-dashboard/organization" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Organization List
            </h1>
          </div>

          {/* Add Button */}
          <div className="flex justify-end mb-6">
            <Link href="/admin-dashboard/organization/add">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-5 w-5 mr-2" />
                Add New Organization
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, GST, PAN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-12"
                />
              </div>
            </div>

            {filtered.length !== organizations.length && (
              <p className="text-sm text-gray-500 mt-4 text-center md:text-left">
                Showing <strong>{filtered.length}</strong> of <strong>{organizations.length}</strong> organizations
              </p>
            )}
          </div>

          {/* Responsive Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto overflow-y-auto max-h-[70vh]">
            {/* <div className="overflow-x-auto"> */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-center  text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-4 py-3  text-center  text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-3  text-center  text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Contact
                  </th>
                  <th className="px-4 py-3  text-center  text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Location
                  </th>

                  <th className="px-4 py-3  text-center  text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No organizations found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((org) => {
                    const primaryAddr = org.addresses?.[0];

                    return (
                      <tr key={org.organizationId} className="hover:bg-gray-50 transition">
                        {/* Organization Name + Logo */}
                        <td className="px-4 py-4 whitespace-nowrap text-center ">
                          <div className="flex items-center justify-center gap-3">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {show(org.organizationName)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell text-center ">
                          <div className="flex items-center justify-center gap-2">
                            {show(org.email)}
                          </div>
                        </td>

                        {/* Contact Number */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell text-center ">
                          <div className="flex items-center justify-center gap-2">
                            {show(org.contactNumber)}
                          </div>
                        </td>

                        {/* City */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell text-center ">
                          <div className="flex items-center gap-2 justify-center ">
                            {primaryAddr ? `${show(primaryAddr.city)}, ${show(primaryAddr.state)}` : '—'}
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center ">
                          <div className="flex items-center justify-center gap-3">
                            <Link
                              href={`/admin-dashboard/organization/${org.organizationId}`}
                              className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin-dashboard/organization/${org.organizationId}/edit`}
                              className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(org.organizationId)}
                              disabled={deletingId === org.organizationId}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 text-xs sm:text-sm"
                            >
                              {deletingId === org.organizationId ? (
                                <>Deleting...</>
                              ) : (
                                'Delete'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {/* </div> */}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden mt-6 space-y-4">
            {filtered.map((org) => {
              const primaryAddr = org.addresses?.[0];
              return (
                <div key={org.organizationId} className="bg-white rounded-lg shadow p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold">{show(org.organizationName)}</h3>
                      </div>
                    </div>
                    <Badge variant={org.status === 'ACTIVE' ? 'default' : 'destructive'}>
                      {show(org.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">{show(org.email)}</div>
                    <div className="flex items-center gap-2"> {show(org.contactNumber)}</div>
                    {primaryAddr && (
                      <div className="flex items-center gap-2"> {primaryAddr.city}, {primaryAddr.state}</div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-5 pt-4 border-t">
                    <Link href={`/admin-dashboard/organization/${org.organizationId}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">View</Button>
                    </Link>
                    <Link
                      href={`/admin-dashboard/organization/${org.organizationId}/edit`}
                      className="flex-1"
                    >

                      <Button size="sm" className="w-full">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(org.organizationId)}
                      disabled={deletingId === org.organizationId}
                    >
                      {deletingId === org.organizationId ? '...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}