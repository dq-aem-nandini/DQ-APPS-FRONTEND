'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminService } from '@/lib/api/adminService';
import {
  ClientModel,
  ClientDTO,
  AddressModel,
  ClientPocModel,
  ClientTaxDetail,
  AddressType,
  WebResponseDTOClientDTO,
  WebResponseDTOString,
  WebResponseDTOListClientDTO,
} from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';
import Spinner from '@/components/ui/Spinner';
import useLoading from '@/hooks/useLoading';
import { v4 as uuidv4 } from 'uuid';

const EditClientPage = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState<ClientModel | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [originalTaxIds, setOriginalTaxIds] = useState<Set<string>>(new Set());
  const { loading, withLoading } = useLoading();
  const router = useRouter();

  // ────────────────────── FETCH & MAP TO ClientModel ──────────────────────
  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;

      await withLoading(async () => {
        console.log('Fetching client with ID:', id);
        const wrapper: WebResponseDTOClientDTO = await adminService.getClientById(id as string);
        const dto: ClientDTO = wrapper.response;

        console.log('Fetched client DTO:', dto);

        // Pre-filter tax details to remove invalid ones early
        const validTaxDetails = dto.clientTaxDetails?.filter(tax => {
          const isValid = tax.taxId && typeof tax.taxId === 'string' && tax.taxId.length > 0;
          if (!isValid) {
            console.warn(`Skipping invalid tax detail on fetch: "${tax.taxName || 'Unnamed'}", taxId:`, tax.taxId);
          }
          return isValid;
        }) || [];

        const model: ClientModel = {
          companyName: dto.companyName ?? '',
          contactNumber: dto.contactNumber ?? '',
          email: dto.email ?? '',
          gst: dto.gst ?? '',
          currency: dto.currency ?? '',
          panNumber: dto.panNumber ?? '',
          tanNumber: dto.tanNumber ?? '',
          addresses: dto.addresses?.length
            ? dto.addresses.map(addr => ({
                ...addr,
                addressId: addr.addressId ?? uuidv4(),
                houseNo: addr.houseNo ?? '',
                streetName: addr.streetName ?? '',
                city: addr.city ?? '',
                state: addr.state ?? '',
                pincode: addr.pincode ?? '',
                country: addr.country ?? '',
              }))
            : [{
                addressId: uuidv4(),
                houseNo: '',
                streetName: '',
                city: '',
                state: '',
                pincode: '',
                country: '',
                addressType: 'OFFICE' as AddressType,
              }],
          clientPocs: Array.isArray(dto.pocs) && dto.pocs.length > 0
            ? dto.pocs.map(poc => ({
                name: poc.name ?? '',
                email: poc.email ?? '',
                contactNumber: poc.contactNumber ?? '',
                designation: poc.designation ?? '',
              }))
            : [{ name: '', email: '', contactNumber: '', designation: '' }],
            clientTaxDetails: validTaxDetails.length > 0
            ? validTaxDetails.map(tax => ({
                ...tax,
                taxName: tax.taxName ?? '',
                taxPercentage: Number(tax.taxPercentage ?? 0),
                createdAt: tax.createdAt ?? new Date().toISOString(),
                updatedAt: tax.updatedAt ?? new Date().toISOString(),
              }))
            : [{
                taxId: '',  // ← Updated: Empty for new/insert
                taxName: '',
                taxPercentage: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }],
        };

        if (validTaxDetails.length < (dto.clientTaxDetails?.length || 0)) {
          console.warn(`Filtered out ${dto.clientTaxDetails?.length - validTaxDetails.length || 0} invalid tax details on load.`);
        }

        setOriginalTaxIds(new Set(model.clientTaxDetails.map(t => t.taxId)));

        console.log('Mapped to ClientModel (tax details count):', model.clientTaxDetails.length);
        setFormData(model);
      }).catch(err => {
        console.error('Error fetching client:', err);
        setError(err.message || 'Failed to load client');
      });
    };

    fetchClient();
  }, [id, withLoading]);

  // ────────────────────── FORM HANDLER ──────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index?: number,
    section?: 'addresses' | 'clientPocs' | 'clientTaxDetails'
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    let parsed: string | number = value;

    if (name.includes('email')) parsed = value.toLowerCase().trim();
    if (['gst', 'panNumber', 'tanNumber'].includes(name)) parsed = value.toUpperCase().trim();
    if (name.includes('pincode') || name.includes('contactNumber')) parsed = value.replace(/\D/g, '');
    if (name.includes('taxPercentage')) parsed = parseFloat(value) || 0;

    const fieldName = name.split('.').pop()!;

    if (section && index !== undefined) {
      setFormData(prev => ({
        ...prev!,
        [section]: prev![section]!.map((item, i) =>
          i === index ? { ...item, [fieldName]: parsed } : item
        ),
      }));
    } else {
      setFormData(prev => ({ ...prev!, [name]: parsed }));
    }
  };

  const addItem = (section: 'addresses' | 'clientPocs' | 'clientTaxDetails') => {
    if (!formData) return;
    if (section === 'addresses') {
      setFormData(prev => ({
        ...prev!,
        addresses: [...(prev!.addresses || []), {
          addressId: uuidv4(),
          houseNo: '', streetName: '', city: '', state: '', pincode: '', country: '',
          addressType: 'OFFICE' as AddressType,
        }],
      }));
    } else if (section === 'clientPocs') {
      setFormData(prev => ({
        ...prev!,
        clientPocs: [...(prev!.clientPocs || []), {
          name: '', email: '', contactNumber: '', designation: '',
        }],
      }));
    } else {
      setFormData(prev => ({
        ...prev!,
        clientTaxDetails: [...prev!.clientTaxDetails, {
          taxId: '',  // ← Updated: Empty for new/insert
          taxName: '',
          taxPercentage: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
      }));
    }
  };

  const removeItem = (section: 'addresses' | 'clientPocs' | 'clientTaxDetails', index: number) => {
    if (!formData) return;
    if (section === 'addresses' && formData.addresses!.length === 1) {
      setError('At least one address is required');
      return;
    }
    if (section === 'clientPocs' && formData.clientPocs!.length === 1) {
      setError('At least one POC is required');
      return;
    }
    setFormData(prev => ({
      ...prev!,
      [section]: prev![section]!.filter((_, i) => i !== index),
    }));
    setTimeout(() => setError(''), 3000); // Clear error after removal
  };

  // ────────────────────── SUBMIT ──────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    console.log('handleSubmit triggered with formData:', formData);
    setError('');
    setSuccess('');

    await withLoading(async () => {
      console.log('Starting validation...');
      // === Validation ===
      const required = ['companyName', 'contactNumber', 'email', 'currency'] as const;
      const missing = required.filter(f => !formData[f]);
      if (missing.length) throw new Error(`Please fill: ${missing.join(', ')}`);

      const primary = formData.addresses![0];
      if (!primary.city || !primary.state || !primary.country || !primary.pincode) {
        throw new Error('Primary address: city, state, country, pincode required');
      }

      const nameRegex = /^[A-Za-z ]+$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[6-9]\d{9}$/;
      const pinRegex = /^\d{6}$/;
      const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      const tanRegex = /^[A-Z]{4}\d{5}[A-Z]{1}$/;

      if (!nameRegex.test(formData.companyName) || formData.companyName.length < 3)
        throw new Error('Company name: 3+ letters only');
      if (!emailRegex.test(formData.email)) throw new Error('Invalid email');
      if (!phoneRegex.test(formData.contactNumber)) throw new Error('Contact: 10 digits (6-9 start)');
      if (!['USD', 'INR', 'EUR'].includes(formData.currency)) throw new Error('Invalid currency');
      if (formData.panNumber && !panRegex.test(formData.panNumber)) throw new Error('Invalid PAN');
      if (formData.gst && !gstRegex.test(formData.gst)) throw new Error('Invalid GST');
      if (formData.tanNumber && !tanRegex.test(formData.tanNumber)) throw new Error('Invalid TAN');
      if (!pinRegex.test(primary.pincode)) throw new Error('Pincode: 6 digits');

      // POCs
      for (const poc of formData.clientPocs!) {
        if (poc.name && !nameRegex.test(poc.name)) throw new Error('POC name: letters only');
        if (poc.email && !emailRegex.test(poc.email)) throw new Error('Invalid POC email');
        if (poc.contactNumber && !phoneRegex.test(poc.contactNumber)) throw new Error('POC contact: 10 digits');
      }

      // Tax
      for (const tax of formData.clientTaxDetails) {
        if (tax.taxName && tax.taxPercentage <= 0) throw new Error('Tax % > 0');
      }

      console.log('Validation passed');

      // === Uniqueness ===
      console.log('Starting uniqueness check...');
      const allClientsWrapper: WebResponseDTOListClientDTO = await adminService.getAllClients();
      const allClients: ClientDTO[] = allClientsWrapper.response || [];
      const exists = allClients.some((c: ClientDTO) =>
        c.clientId !== id &&
        (c.email.toLowerCase() === formData.email.toLowerCase() ||
          c.companyName.toLowerCase() === formData.companyName.toLowerCase())
      );
      if (exists) throw new Error('Another client with this email/name exists');

      console.log('Uniqueness check passed');

      // === Payload Prep with Filtering ===
      console.log('Mapping to payload...');
      
      // Filter taxes: Only send existing ones (valid taxId from fetch). Skip new to avoid "not found".
      const existingTaxes = formData.clientTaxDetails.filter(tax => originalTaxIds.has(tax.taxId));

      let taxSkipMessage = '';
      if (existingTaxes.length < formData.clientTaxDetails.length) {
        const skippedCount = formData.clientTaxDetails.length - existingTaxes.length;
        taxSkipMessage = ` (skipped ${skippedCount} new tax(es) - add after save)`;
        console.warn(`Skipping ${skippedCount} new tax(es) on submit.`);
      }

// === Payload Prep ===
console.log('Mapping to payload...');

// Send all tax details: Existing with ID for update, new with empty taxId for insert
const payload: any = {
  ...formData,
  pocs: formData.clientPocs,  // Send full array
};
delete payload.clientPocs;
console.log('Payload prepared (tax count):', payload.clientTaxDetails.length);
console.log('Full payload:', payload);

      // === Update ===
      console.log('Calling updateClient API...');
      const result: WebResponseDTOString = await adminService.updateClient(id as string, payload);
      console.log('Update API response:', result);

      if (!result.flag) throw new Error(result.message || 'Update failed');

      console.log('Update successful');
      setSuccess(`Client updated successfully!${taxSkipMessage}`);
    }).catch(err => {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Failed to update client');
    });
  };

  // ────────────────────── INITIAL LOADING ──────────────────────
  if (!formData) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600 text-center">Loading client details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ────────────────────── FORM UI ──────────────────────
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute left-0">
              <BackButton fallback="/admin-dashboard/clients/list" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Edit Client
            </h1>
          </div>

          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-2xl">
                <Spinner size="lg" />
                <p className="mt-2 text-gray-600 text-center">Updating client...</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Company Details */}
              <section className="border-b border-gray-200 pb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                  Company Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700">
                      Company Name *
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName ?? ''}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="contactNumber" className="block text-sm font-semibold text-gray-700">
                      Contact Number *
                    </label>
                    <input
                      id="contactNumber"
                      name="contactNumber"
                      value={formData.contactNumber ?? ''}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      value={formData.email ?? ''}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="gst" className="block text-sm font-semibold text-gray-700">
                      GST
                    </label>
                    <input
                      id="gst"
                      name="gst"
                      value={formData.gst ?? ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="panNumber" className="block text-sm font-semibold text-gray-700">
                      PAN Number
                    </label>
                    <input
                      id="panNumber"
                      name="panNumber"
                      value={formData.panNumber ?? ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="tanNumber" className="block text-sm font-semibold text-gray-700">
                      TAN Number
                    </label>
                    <input
                      id="tanNumber"
                      name="tanNumber"
                      value={formData.tanNumber ?? ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="currency" className="block text-sm font-semibold text-gray-700">
                      Currency *
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency ?? ''}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Currency</option>
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Points of Contact */}
              <section className="border-b border-gray-200 pb-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-8 bg-green-600 rounded-full"></span>
                    Points of Contact
                  </h3>
                  <button
                    type="button"
                    onClick={() => addItem('clientPocs')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm font-semibold"
                  >
                    + Add POC
                  </button>
                </div>
                <div className="space-y-6">
                  {formData.clientPocs!.map((poc, i) => (
                    <div key={i} className="p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label htmlFor={`clientPocs.${i}.name`} className="block text-sm font-semibold text-gray-700">
                            POC Name
                          </label>
                          <input
                            id={`clientPocs.${i}.name`}
                            name={`clientPocs.${i}.name`}
                            value={poc.name ?? ''}
                            onChange={e => handleChange(e, i, 'clientPocs')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`clientPocs.${i}.email`} className="block text-sm font-semibold text-gray-700">
                            POC Email
                          </label>
                          <input
                            id={`clientPocs.${i}.email`}
                            name={`clientPocs.${i}.email`}
                            value={poc.email ?? ''}
                            onChange={e => handleChange(e, i, 'clientPocs')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`clientPocs.${i}.contactNumber`} className="block text-sm font-semibold text-gray-700">
                            POC Contact
                          </label>
                          <input
                            id={`clientPocs.${i}.contactNumber`}
                            name={`clientPocs.${i}.contactNumber`}
                            value={poc.contactNumber ?? ''}
                            onChange={e => handleChange(e, i, 'clientPocs')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`clientPocs.${i}.designation`} className="block text-sm font-semibold text-gray-700">
                            POC Designation
                          </label>
                          <input
                            id={`clientPocs.${i}.designation`}
                            name={`clientPocs.${i}.designation`}
                            value={poc.designation ?? ''}
                            onChange={e => handleChange(e, i, 'clientPocs')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                      {formData.clientPocs!.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem('clientPocs', i)}
                          className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200 transition-all text-sm font-semibold"
                        >
                          Remove POC
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Addresses */}
              <section className="border-b border-gray-200 pb-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                    Addresses
                  </h3>
                  <button
                    type="button"
                    onClick={() => addItem('addresses')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-all flex items-center gap-2 text-sm font-semibold"
                  >
                    + Add Address
                  </button>
                </div>
                <div className="space-y-6">
                  {formData.addresses!.map((addr, i) => (
                    <div key={addr.addressId} className="p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-purple-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <label htmlFor={`addresses.${i}.houseNo`} className="block text-sm font-semibold text-gray-700">
                            House No
                          </label>
                          <input
                            id={`addresses.${i}.houseNo`}
                            name={`addresses.${i}.houseNo`}
                            value={addr.houseNo ?? ''}
                            onChange={e => handleChange(e, i, 'addresses')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`addresses.${i}.streetName`} className="block text-sm font-semibold text-gray-700">
                            Street Name
                          </label>
                          <input
                            id={`addresses.${i}.streetName`}
                            name={`addresses.${i}.streetName`}
                            value={addr.streetName ?? ''}
                            onChange={e => handleChange(e, i, 'addresses')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`addresses.${i}.city`} className="block text-sm font-semibold text-gray-700">
                            City {i === 0 && '*'}
                          </label>
                          <input
                            id={`addresses.${i}.city`}
                            name={`addresses.${i}.city`}
                            value={addr.city ?? ''}
                            onChange={e => handleChange(e, i, 'addresses')}
                            required={i === 0}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`addresses.${i}.state`} className="block text-sm font-semibold text-gray-700">
                            State {i === 0 && '*'}
                          </label>
                          <input
                            id={`addresses.${i}.state`}
                            name={`addresses.${i}.state`}
                            value={addr.state ?? ''}
                            onChange={e => handleChange(e, i, 'addresses')}
                            required={i === 0}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`addresses.${i}.country`} className="block text-sm font-semibold text-gray-700">
                            Country {i === 0 && '*'}
                          </label>
                          <input
                            id={`addresses.${i}.country`}
                            name={`addresses.${i}.country`}
                            value={addr.country ?? ''}
                            onChange={e => handleChange(e, i, 'addresses')}
                            required={i === 0}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`addresses.${i}.pincode`} className="block text-sm font-semibold text-gray-700">
                            Pincode {i === 0 && '*'}
                          </label>
                          <input
                            id={`addresses.${i}.pincode`}
                            name={`addresses.${i}.pincode`}
                            value={addr.pincode ?? ''}
                            onChange={e => handleChange(e, i, 'addresses')}
                            required={i === 0}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`addresses.${i}.addressType`} className="block text-sm font-semibold text-gray-700">
                            Address Type
                          </label>
                          <select
                            id={`addresses.${i}.addressType`}
                            name={`addresses.${i}.addressType`}
                            value={addr.addressType ?? ''}
                            onChange={e => handleChange(e, i, 'addresses')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          >
                            <option value="CURRENT">Current</option>
                            <option value="PERMANENT">Permanent</option>
                            <option value="OFFICE">Office</option>
                          </select>
                        </div>
                      </div>
                      {formData.addresses!.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem('addresses', i)}
                          className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200 transition-all text-sm font-semibold"
                        >
                          Remove Address
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Tax Details */}
              <section className="pb-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-8 bg-orange-600 rounded-full"></span>
                    Tax Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => addItem('clientTaxDetails')}
                    className="bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-all flex items-center gap-2 text-sm font-semibold"
                  >
                    + Add Tax
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.clientTaxDetails.map((tax, i) => (
                    <div key={tax.taxId} className="p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-orange-50 flex gap-6 items-start">
                      <div className="flex-1 space-y-1">
                        <label htmlFor={`clientTaxDetails.${i}.taxName`} className="block text-sm font-semibold text-gray-700">
                          Tax Name
                        </label>
                        <input
                          id={`clientTaxDetails.${i}.taxName`}
                          name={`clientTaxDetails.${i}.taxName`}
                          value={tax.taxName ?? ''}
                          onChange={e => handleChange(e, i, 'clientTaxDetails')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <label htmlFor={`clientTaxDetails.${i}.taxPercentage`} className="block text-sm font-semibold text-gray-700">
                          Percentage (%)
                        </label>
                        <input
                          id={`clientTaxDetails.${i}.taxPercentage`}
                          name={`clientTaxDetails.${i}.taxPercentage`}
                          value={tax.taxPercentage}
                          onChange={e => handleChange(e, i, 'clientTaxDetails')}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                      {formData.clientTaxDetails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem('clientTaxDetails', i)}
                          className="bg-red-100 text-red-700 px-4 py-3 rounded-xl hover:bg-red-200 transition-all text-sm font-semibold mt-6"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">!</span>
                    {error}
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {success}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Updating Client...
                  </>
                ) : (
                  'Update Client'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default EditClientPage;