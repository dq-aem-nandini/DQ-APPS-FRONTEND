'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { invoiceService } from '@/lib/api/invoiceService';
import { ClientInvoiceSummaryDTO, EmployeeWorkSummaryDTO, InvoiceStatus } from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Spinner from '@/components/ui/Spinner';
import { ArrowLeft, Download, FileText, DollarSign, Clock, CheckCircle, XCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import React from 'react';
import Swal from 'sweetalert2';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import BackButton from '@/components/ui/BackButton';

const InvoiceSummaryPage = () => {
    const { id } = useParams(); // clientId
    const [summaries, setSummaries] = useState<ClientInvoiceSummaryDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        const fetchSummary = async () => {
            try {
                setLoading(true);
                setError('');
                const result: ClientInvoiceSummaryDTO[] = await invoiceService.getClientInvoiceSummary(id as string);

                if (result.length > 0) {
                    const sorted = [...result].sort(
                        (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
                    );
                    setSummaries(sorted);
                } else {
                    setError('No summaries found');
                }

            } catch (err: any) {
                setError(err.message || 'Failed to load invoice summaries');
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: err.message || 'Failed to load invoice summaries. Please try again.',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [id]);

    const refetchSummaries = async () => {
        try {
            const result: ClientInvoiceSummaryDTO[] = await invoiceService.getClientInvoiceSummary(id as string);
            setSummaries(result);
        } catch (err: any) {
            setError(err.message || 'Failed to refetch summaries');
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: err.message || 'Failed to refetch summaries. Please try again.',
            });
        }
    };

    /* -------------------------- PDF DOWNLOAD HANDLER -------------------------- */
    const handleDownloadPDF = async (invoiceId: string) => {
        try {
            const blob = await invoiceService.downloadInvoicePDF(invoiceId);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error: any) {
            console.error('Failed to open PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: error.message || 'Failed to download PDF. Please try again.',
            });
        }
    };

    const handleStatusUpdate = async (invoiceId: string, status: InvoiceStatus) => {
        const statusText = status.toLowerCase();
        const result = await Swal.fire({
            title: `Are you sure?`,
            text: `You want to ${statusText} this invoice? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: status === 'APPROVED' ? '#10b981' : '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: `Yes, ${statusText} it!`
        });

        if (result.isConfirmed) {
            try {
                await invoiceService.updateInvoiceStatus(invoiceId, status);
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: `Invoice has been ${statusText}.`,
                    timer: 1500,
                    showConfirmButton: false,
                });
                await refetchSummaries(); // Refetch after update to reflect changes
            } catch (err: any) {
                console.error('Status update failed:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: err.message || `Failed to ${statusText} invoice. Please try again.`,
                });
            }
        }
    };

    const getStatusColor = (status?: string) => {
        if (!status) {
            return 'bg-blue-100 text-blue-800 border border-blue-200';
        }
        const s = status.toUpperCase();
        switch (s) {
            case 'PAID':
            case 'APPROVED':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'SENT':
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'OVERDUE':
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border border-red-200';
            case 'DRAFT':
                return 'bg-gray-100 text-gray-800 border border-gray-200';
            default:
                return 'bg-blue-100 text-blue-800 border border-blue-200';
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

    if (error || summaries.length === 0) {
        return (
            <ProtectedRoute allowedRoles={['ADMIN']}>
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
                    <div className="text-center">
                        <div className="text-red-500 mb-4">
                            <FileText className="w-16 h-16 mx-auto" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Invoice Summaries</h2>
                        <p className="text-gray-600 mb-6">{error || 'No invoice summaries available for this client.'}</p>
                        <BackButton to="/admin-dashboard/invoice" />

                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const totalRevenue = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalInvoices = summaries.length;
    const totalHours = summaries.reduce((sum, s) => sum + s.employeeWorkSummaries.reduce((empSum, emp) => empSum + emp.totalHours, 0), 0);

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 flex items-center justify-between">
                        <BackButton to="/admin-dashboard/invoice" />
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Invoice Summaries
                        </h1>
                        <div className="w-20" />
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalInvoices}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalRevenue.toFixed(2)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalHours}h</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Invoices Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Invoice Summaries
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>From</TableHead>
                                            <TableHead>To</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summaries.map((summary) => (
                                            <React.Fragment key={summary.invoiceId}>
                                                <TableRow>
                                                    <TableCell className="font-medium">{summary.invoiceNumber}</TableCell>
                                                    <TableCell>{format(new Date(summary.invoiceDate), 'MMM dd, yyyy')}</TableCell>

                                                    {/* ✅ From & To Dates */}
                                                    <TableCell>{format(new Date(summary.fromDate), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell>{format(new Date(summary.toDate), 'MMM dd, yyyy')}</TableCell>

                                                    <TableCell>
                                                        <Badge className={getStatusColor(summary.invoiceStatus)}>
                                                            {summary.invoiceStatus || 'PENDING'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">{summary.totalAmount.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownloadPDF(summary.invoiceId)}
                                                                title="Download PDF"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                            {['PENDING', 'DRAFT', 'SENT'].includes(summary.invoiceStatus || 'PENDING') && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleStatusUpdate(summary.invoiceId, 'APPROVED')}
                                                                        className="bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                                                        title="Approve"
                                                                    >
                                                                        <Check className="w-3 h-3 mr-1" />
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleStatusUpdate(summary.invoiceId, 'REJECTED')}
                                                                        title="Reject"
                                                                        className="bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                                                    >
                                                                        <X className="w-3 h-3 mr-1" />
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {/* Nested Employee Rows */}
                                                <TableRow>
                                                    <TableCell colSpan={7} className="p-0">
                                                        <div className="overflow-hidden">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="w-[100px]">Employee</TableHead>
                                                                        <TableHead className="text-right">Company Id</TableHead>
                                                                        <TableHead className="text-right">Hours</TableHead>
                                                                        <TableHead className="text-right">Rate</TableHead>
                                                                        <TableHead className="text-right">Amount</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {summary.employeeWorkSummaries.map((emp, i) => (
                                                                        <TableRow key={i}>
                                                                            <TableCell>{emp.employeeName}</TableCell>
                                                                            <TableCell className="text-right">{emp.companyId}</TableCell>
                                                                            <TableCell className="text-right">{emp.totalHours}h</TableCell>
                                                                            <TableCell className="text-right">{emp.rateCard.toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right font-medium">{emp.totalAmount.toFixed(2)}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>

                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default InvoiceSummaryPage;