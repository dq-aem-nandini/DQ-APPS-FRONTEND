'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { invoiceService } from '@/lib/api/invoiceService';
import { ClientInvoiceSummaryDTO, EmployeeWorkSummaryDTO, WebResponseDTOListClientInvoiceSummaryDTO } from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Spinner from '@/components/ui/Spinner';
import { ArrowLeft, Download, FileText, DollarSign, Calendar, Clock, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const InvoiceSummaryPage = () => {
    const { id } = useParams(); // clientId
    const router = useRouter();
    const [summaries, setSummaries] = useState<ClientInvoiceSummaryDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        const fetchSummary = async () => {
            try {
                setLoading(true);
                const result: ClientInvoiceSummaryDTO[] = await invoiceService.getClientInvoiceSummary(id as string);
                if (result.length > 0) {
                    setSummaries(result);
                } else {
                    setError('Failed to load summaries');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load invoice summaries');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [id]);

    const handleDownloadPDF = async (invoiceNumber: string) => {
        try {
            const blob = await invoiceService.downloadInvoicePDF(invoiceNumber);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceNumber}.pdf`;
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
                        <Button onClick={() => router.back()}>Go Back</Button>
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
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Invoices
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Invoice Summaries</h1>
                                <p className="text-gray-600">Detailed breakdowns for client invoices</p>
                            </div>
                        </div>
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
                                <Clock className="h-4 w-4 text-muted-foreground" />
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
                                            <TableHead className="text-right">Total Amount</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summaries.map((summary) => (
                                            <React.Fragment key={summary.invoiceNumber}>
                                                <TableRow>
                                                    <TableCell className="font-medium">{summary.invoiceNumber}</TableCell>
                                                    <TableCell>{format(new Date(summary.invoiceDate), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell className="text-right font-bold">{summary.totalAmount.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(summary.invoiceNumber)}>
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell colSpan={4} className="p-0">
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

                    {/* Footer Actions */}
                    <div className="flex gap-4 justify-end mt-8">
                        <Button variant="outline" onClick={() => router.back()}>
                            Back to Invoices
                        </Button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default InvoiceSummaryPage;