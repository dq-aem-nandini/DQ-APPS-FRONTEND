'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { invoiceService } from '@/lib/api/invoiceService';
import { InvoiceDTO, WebResponseDTOInvoiceDTO } from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Spinner from '@/components/ui/Spinner';
import { ArrowLeft, Download, FileText, DollarSign, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const ViewInvoicePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const result: WebResponseDTOInvoiceDTO = await invoiceService.getInvoiceById(id as string);
        if (result.flag && result.response) {
          setInvoice(result.response);
        } else {
          setError(result.message || 'Invoice not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      const blob = await invoiceService.downloadInvoicePDF(id as string);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.invoiceNumber || 'unknown'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download failed:', err);
      // Show toast or alert
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !invoice) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The invoice youre looking for doesnt exist.'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Invoices
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
                <p className="text-gray-600">Generated on {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}</p>
              </div>
            </div>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>

          {/* Invoice Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-semibold">{invoice.clientName}</h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">From: {format(new Date(invoice.fromDate), 'MMM dd, yyyy')}</p>
                  <p className="text-sm text-gray-600">To: {format(new Date(invoice.toDate), 'MMM dd, yyyy')}</p>
                  <p className="text-sm text-gray-600">Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Totals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Subtotal: {invoice.subtotal.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Tax: {invoice.taxAmount.toFixed(2)}</p>
                  <p className="text-lg font-bold text-gray-900">Total: {invoice.totalAmount.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
              Status: {invoice.status}
            </Badge>
          </div>

          {/* Invoice Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Invoice Number</td>
                      <td className="p-3">{invoice.invoiceNumber}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Total Hours</td>
                      <td className="p-3">{invoice.totalHours}h</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Invoice Date</td>
                      <td className="p-3">{format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Status</td>
                      <td className="p-3">{invoice.status}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Due Date</td>
                      <td className="p-3">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex gap-4 justify-end mt-8">
            <Button variant="outline" onClick={() => router.back()}>
              Back to Invoices
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ViewInvoicePage;