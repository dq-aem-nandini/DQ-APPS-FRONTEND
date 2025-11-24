'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Loader2, Trash2, Plus } from 'lucide-react';
import { ClientModel } from '@/lib/api/types';

// Zod Schema — matches ClientModel exactly
const clientSchema = z.object({
  clientId: z.string(),
  companyName: z.string().min(3).max(50).regex(/^[A-Za-z ]+$/),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email(),
  gst: z.string().regex(/^[0-9]{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]$/),
  panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/),
  tanNumber: z.string().regex(/^[A-Z]{4}\d{5}[A-Z]$/),
  currency: z.enum(['INR', 'USD', 'EUR']),

  addresses: z.array(z.object({
    addressId: z.string(),
    houseNo: z.string().optional(),
    streetName: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().length(6).regex(/^\d+$/),
    country: z.string().min(1),
    addressType: z.enum(['CURRENT', 'PERMANENT', 'OFFICE']).default('OFFICE'),
  })).min(1),

  clientPocs: z.array(z.object({
    pocId: z.string(),
    name: z.string().min(1),
    email: z.string().email(),
    contactNumber: z.string().regex(/^[6-9]\d{9}$/),
    designation: z.string().optional(),
  })).min(1),

  clientTaxDetails: z.array(z.object({
    taxId: z.string(),
    taxName: z.string().optional(),
    taxPercentage: z.number().min(0).optional(),
  })),
});

type FormValues = z.infer<typeof clientSchema>;

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    mode: 'onBlur',
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({ control: form.control, name: 'addresses' });
  const { fields: pocFields, append: appendPoc, remove: removePoc } = useFieldArray({ control: form.control, name: 'clientPocs' });
  const { fields: taxFields, append: appendTax, remove: removeTax } = useFieldArray({ control: form.control, name: 'clientTaxDetails' });

  // Fetch client — now 100% type-safe
  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;
      try {
        const res = await adminService.getClientById(id);
        const dto = res.response;

        form.reset({
          clientId: dto.clientId!,
          companyName: dto.companyName || '',
          contactNumber: dto.contactNumber || '',
          email: dto.email || '',
          gst: dto.gst || '',
          panNumber: dto.panNumber || '',
          tanNumber: dto.tanNumber || '',
          currency: (dto.currency as 'INR' | 'USD' | 'EUR') || 'INR',

          addresses: Array.isArray(dto.addresses) && dto.addresses.length > 0
            ? dto.addresses.map((a: any) => ({
                addressId: a.addressId || uuidv4(),
                houseNo: a.houseNo || '',
                streetName: a.streetName || '',
                city: a.city || '',
                state: a.state || '',
                pincode: a.pincode || '',
                country: a.country || '',
                addressType: (a.addressType as 'CURRENT' | 'PERMANENT' | 'OFFICE') || 'OFFICE',
              }))
            : [{
                addressId: uuidv4(),
                houseNo: '', streetName: '', city: '', state: '', pincode: '', country: 'India', addressType: 'OFFICE'
              }],

          clientPocs: Array.isArray(dto.pocs) && dto.pocs.length > 0
            ? dto.pocs.map((p: any) => ({
                pocId: p.pocId || uuidv4(),
                name: p.name || '',
                email: p.email || '',
                contactNumber: p.contactNumber || '',
                designation: p.designation || '',
              }))
            : [{
                pocId: uuidv4(),
                name: '', email: '', contactNumber: '', designation: ''
              }],

          clientTaxDetails: Array.isArray(dto.clientTaxDetails) && dto.clientTaxDetails.length > 0
            ? dto.clientTaxDetails.map((t: any) => ({
                taxId: t.taxId || uuidv4(),
                taxName: t.taxName || '',
                taxPercentage: t.taxPercentage ?? 0,
              }))
            : [{
                taxId: uuidv4(),
                taxName: '',
                taxPercentage: 0,
              }],
        });
      } catch (err) {
        form.setError('root', { message: 'Failed to load client' });
      }
    };
    fetchClient();
  }, [id, form]);

  // Edit-mode validation — type-safe field map
  useEffect(() => {
    const subscription = form.watch(async (value, { name }) => {
      if (!name || !id) return;

      const fieldMap: Partial<Record<keyof FormValues, UniqueField>> = {
        companyName: 'COMPANY_NAME',
        contactNumber: 'CONTACT_NUMBER',
        email: 'EMAIL',
        gst: 'GST',
        panNumber: 'PAN_NUMBER',
        tanNumber: 'TAN_NUMBER',
      };

      const fieldKey = name.split('.')[0] as keyof FormValues;
      const uniqueField = fieldMap[fieldKey];
      const fieldValue = value[fieldKey] as string | undefined;

      if (uniqueField && fieldValue && fieldValue.length >= 3) {
        const { exists } = await validationService.validateField({
          field: uniqueField,
          value: fieldValue,
          mode: 'edit',
          currentRecordId: id,
        });
        if (exists) form.setError(name as any, { message: 'Already exists' });
        else form.clearErrors(name as any);
      }

      // POC validation
      const pocMatch = name.match(/clientPocs\.(\d+)\.(email|contactNumber)/);
      if (pocMatch) {
        const idx = parseInt(pocMatch[1]);
        const type = pocMatch[2] as 'email' | 'contactNumber';
        const pocValue = value.clientPocs?.[idx]?.[type];
        const currentPocId = value.clientPocs?.[idx]?.pocId;

        if (pocValue && pocValue.length > 3) {
          const field: UniqueField = type === 'email' ? 'EMAIL' : 'CONTACT_NUMBER';
          const { exists } = await validationService.validateField({
            field,
            value: pocValue,
            mode: 'edit',
            currentRecordId: currentPocId || undefined,
          });
          if (exists) form.setError(name as any, { message: 'Already exists' });
          else form.clearErrors(name as any);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch, id]);

  // Final type-safe payload
  const onSubmit = async (data: FormValues) => {
    try {
      const payload: ClientModel = {
        // clientId: data.clientId,
        companyName: data.companyName,
        contactNumber: data.contactNumber,
        email: data.email,
        gst: data.gst,
        panNumber: data.panNumber,
        tanNumber: data.tanNumber,
        currency: data.currency,

        addresses: data.addresses.map(a => ({
          addressId: a.addressId,
          houseNo: a.houseNo,
          streetName: a.streetName,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          country: a.country,
          addressType: a.addressType,
        })),

        clientPocs: data.clientPocs.map(p => ({
          pocId: p.pocId,
          name: p.name,
          email: p.email,
          contactNumber: p.contactNumber,
          designation: p.designation || '', // REQUIRED
        })),

        clientTaxDetails: data.clientTaxDetails.map(t => ({
          taxId: t.taxId,
          taxName: t.taxName || '',
          taxPercentage: t.taxPercentage ?? 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      };

      await adminService.updateClient(id, payload);
      router.push('/admin-dashboard/clients/list');
    } catch (err: any) {
      form.setError('root', { message: err.message || 'Failed to update client' });
    }
  };

  if (!form.getValues('clientId')) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <BackButton to="/admin-dashboard/clients/list" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Edit Client
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
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
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
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                          <FormItem><FormLabel>Pincode {index === 0 && <span className="text-red-500">*</span>}</FormLabel><FormControl><Input maxLength={6} {...field} /></FormControl><FormMessage /></FormItem>
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
                  <Button type="button" size="sm" onClick={() => appendPoc({ pocId: uuidv4(), name: '', email: '', contactNumber: '', designation: '' })}>
                    <Plus className="h-4 w-4 mr-2" /> Add POC
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pocFields.map((field, index) => (
                    <div key={field.id} className="p-6 border rounded-lg bg-gray-50 space-y-4">
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
                  {form.formState.isSubmitting ? 'Updating...' : 'Update Client'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </ProtectedRoute>
  );
}