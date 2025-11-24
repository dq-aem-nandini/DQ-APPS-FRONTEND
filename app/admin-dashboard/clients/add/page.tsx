'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/lib/api/adminService';
import { validationService, UniqueField } from '@/lib/api/validationService';
import { v4 as uuidv4 } from 'uuid';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { ClientModel } from '@/lib/api/types';

const phoneRegex = /^[6-9]\d{9}$/;
const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]$/;
const tanRegex = /^[A-Z]{4}\d{5}[A-Z]$/;

const clientSchema = z.object({
  companyName: z.string().min(3).max(50).regex(/^[A-Za-z ]+$/, 'Only letters & spaces'),
  contactNumber: z.string().regex(phoneRegex, '10 digits, starts with 6-9'),
  email: z.string().email('Invalid email'),
  gst: z.string().regex(gstRegex, 'Invalid GSTIN'),
  panNumber: z.string().regex(panRegex, 'Invalid PAN'),
  tanNumber: z.string().regex(tanRegex, 'Invalid TAN'),
  currency: z.enum(['INR', 'USD', 'EUR']),

  addresses: z.array(z.object({
    addressId: z.string(),
    houseNo: z.string().optional(),
    streetName: z.string().optional(),
    city: z.string().min(1, 'Required'),
    state: z.string().min(1, 'Required'),
    pincode: z.string().length(6, '6 digits').regex(/^\d+$/),
    country: z.string().min(1, 'Required'),
    addressType: z.enum(['CURRENT', 'PERMANENT', 'OFFICE']).default('OFFICE'),
  })).min(1),

  clientPocs: z.array(z.object({
    tempId: z.string(),
    name: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
    contactNumber: z.string().regex(phoneRegex, 'Invalid phone'),
    designation: z.string().optional(),
  })).min(1),

  clientTaxDetails: z.array(z.object({
    taxId: z.string(),
    taxName: z.string().optional(),
    taxPercentage: z.number().min(0).optional(),
  })),
});

type FormValues = z.infer<typeof clientSchema>;

export default function AddClientPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    mode: 'onBlur',
    defaultValues: {
      companyName: '',
      contactNumber: '',
      email: '',
      gst: '',
      panNumber: '',
      tanNumber: '',
      currency: 'INR',
      addresses: [{
        addressId: uuidv4(),
        houseNo: '', streetName: '', city: '', state: '', pincode: '', country: 'India', addressType: 'OFFICE'
      }],
      clientPocs: [{
        tempId: uuidv4(),
        name: '', email: '', contactNumber: '', designation: ''
      }],
      clientTaxDetails: [{ taxId: uuidv4(), taxName: '', taxPercentage: 0 }],
    },
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({ control: form.control, name: 'addresses' });
  const { fields: pocFields, append: appendPoc, remove: removePoc } = useFieldArray({ control: form.control, name: 'clientPocs' });
  const { fields: taxFields, append: appendTax, remove: removeTax } = useFieldArray({ control: form.control, name: 'clientTaxDetails' });

  // Fixed: Type-safe async validation
  useEffect(() => {
    const subscription = form.watch(async (value, { name }) => {
      if (!name) return;

      const fieldMap: Partial<Record<keyof FormValues, UniqueField>> = {
        companyName: 'COMPANY_NAME',
        contactNumber: 'CONTACT_NUMBER',
        email: 'EMAIL',
        gst: 'GST',
        panNumber: 'PAN_NUMBER',
        tanNumber: 'TAN_NUMBER',
      };

      const fieldKey = name.split('.')[0] as keyof typeof fieldMap;
      const uniqueField = fieldMap[fieldKey];
      const fieldValue = value[fieldKey] as string | undefined;

      if (uniqueField && fieldValue && fieldValue.length >= 3) {
        const { exists } = await validationService.validateField({
          field: uniqueField,
          value: fieldValue,
          mode: 'create',
        });

        if (exists) {
          form.setError(name as any, { message: 'Already exists' });
        } else {
          form.clearErrors(name as any);
        }
      }

      // POC Email & Phone
      const pocMatch = name.match(/clientPocs\.(\d+)\.(email|contactNumber)/);
      if (pocMatch) {
        const idx = parseInt(pocMatch[1]);
        const type = pocMatch[2] as 'email' | 'contactNumber';
        const pocValue = value.clientPocs?.[idx]?.[type];

        if (pocValue && pocValue.length > 3) {
          const field: UniqueField = type === 'email' ? 'EMAIL' : 'CONTACT_NUMBER';
          const { exists } = await validationService.validateField({ field, value: pocValue, mode: 'create' });
          if (exists) form.setError(name as any, { message: 'Already exists' });
          else form.clearErrors(name as any);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Fixed: 100% type-safe payload
  const onSubmit = async (data: FormValues) => {
    try {
      const payload: ClientModel = {
        companyName: data.companyName,
        contactNumber: data.contactNumber,
        email: data.email,
        gst: data.gst,
        panNumber: data.panNumber,
        tanNumber: data.tanNumber,
        currency: data.currency,

        addresses: data.addresses.map(a => ({
          addressId: a.addressId,
          houseNo: a.houseNo ?? undefined,
          streetName: a.streetName ?? undefined,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          country: a.country,
          addressType: a.addressType,
        })),

        clientPocs: data.clientPocs.map(p => ({
          pocId: uuidv4(),
          name: p.name,
          email: p.email,
          contactNumber: p.contactNumber,
          designation: p.designation || '',
        })),

        clientTaxDetails: data.clientTaxDetails.map(t => ({
          taxId: t.taxId,
          taxName: t.taxName || '',           // required → fallback
          taxPercentage: t.taxPercentage ?? 0, // required → fallback
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      };

      await adminService.addClient(payload);
      router.push('/admin-dashboard/clients/list');
    } catch (err: any) {
      form.setError('root', { message: err.message || 'Failed to add client' });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <BackButton to="/admin-dashboard/clients/list" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Add New Client
            </h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* Company Details */}
              <Card>
                <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="Acme Pvt Ltd" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contactNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input type="email" placeholder="info@acme.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gst" render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="27ABCDE1234F1Z5" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="panNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="ABCDE1234F" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tanNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>TAN <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="MUMA12345B" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Addresses */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Addresses</CardTitle>
                  <Button type="button" size="sm" onClick={() => appendAddress({
                    addressId: uuidv4(), houseNo: '', streetName: '', city: '', state: '', pincode: '', country: 'India', addressType: 'OFFICE'
                  })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Address
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {addressFields.map((field, index) => (
                    <div key={field.id} className="p-6 border rounded-lg bg-gray-50 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField control={form.control} name={`addresses.${index}.houseNo`} render={({ field }) => (
                          <FormItem><FormLabel>House No</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`addresses.${index}.streetName`} render={({ field }) => (
                          <FormItem><FormLabel>Street</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`addresses.${index}.city`} render={({ field }) => (
                          <FormItem><FormLabel>City {index === 0 && <span className="text-red-500">*</span>}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`addresses.${index}.state`} render={({ field }) => (
                          <FormItem><FormLabel>State {index === 0 && <span className="text-red-500">*</span>}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`addresses.${index}.pincode`} render={({ field }) => (
                          <FormItem><FormLabel>Pincode {index === 0 && <span className="text-red-500">*</span>}</FormLabel><FormControl><Input {...field} maxLength={6} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`addresses.${index}.country`} render={({ field }) => (
                          <FormItem><FormLabel>Country {index === 0 && <span className="text-red-500">*</span>}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`addresses.${index}.addressType`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="CURRENT">Current</SelectItem>
                                <SelectItem value="PERMANENT">Permanent</SelectItem>
                                <SelectItem value="OFFICE">Office</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      {addressFields.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeAddress(index)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Client POCs */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Point of Contacts</CardTitle>
                  <Button type="button" size="sm" onClick={() => appendPoc({ tempId: uuidv4(), name: '', email: '', contactNumber: '', designation: '' })}>
                    <Plus className="h-4 w-4 mr-2" /> Add POC
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pocFields.map((field, index) => (
                    <div key={field.tempId} className="p-6 border rounded-lg bg-gray-50 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name={`clientPocs.${index}.name`} render={({ field }) => (
                          <FormItem><FormLabel>Name {index === 0 && <span className="text-red-500">*</span>}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`clientPocs.${index}.email`} render={({ field }) => (
                          <FormItem><FormLabel>Email {index === 0 && <span className="text-red-500">*</span>}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`clientPocs.${index}.contactNumber`} render={({ field }) => (
                          <FormItem><FormLabel>Contact Number {index === 0 && <span className="text-red-500">*</span>}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`clientPocs.${index}.designation`} render={({ field }) => (
                          <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      {pocFields.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => removePoc(index)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Remove POC
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Tax Details */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Tax Details</CardTitle>
                  <Button type="button" size="sm" onClick={() => appendTax({ taxId: uuidv4(), taxName: '', taxPercentage: 0 })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Tax
                  </Button>
                </CardHeader>
                <CardContent>
                  {taxFields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end mb-4">
                      <FormField control={form.control} name={`clientTaxDetails.${index}.taxName`} render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Tax Name</FormLabel>
                          <FormControl><Input placeholder="GST, TDS, etc." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`clientTaxDetails.${index}.taxPercentage`} render={({ field }) => (
                        <FormItem className="w-32">
                          <FormLabel>%</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {taxFields.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeTax(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {form.formState.errors.root && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                  {form.formState.errors.root.message}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push('/admin-dashboard/clients/list')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Adding Client...' : 'Add Client'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </ProtectedRoute>
  );
}