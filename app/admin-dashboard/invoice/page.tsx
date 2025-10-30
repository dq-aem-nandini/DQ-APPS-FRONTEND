'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { adminService } from '@/lib/api/adminService';
import { invoiceService } from '@/lib/api/invoiceService';
import { ClientDTO, InvoiceDTO } from '@/lib/api/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Search, FileText, DollarSign, Clock, ArrowLeft, Loader2 } from 'lucide-react';

interface Filters {
  clientId: string;
  search: string;
  status: string;
  fromDate: string;
  toDate: string;
}

/* ------------------------------------------------------------------ */
/*                         MAIN PAGE COMPONENT                        */
/* ------------------------------------------------------------------ */
export default function InvoicesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    clientId: '',
    search: '',
    status: '',
    fromDate: '',
    toDate: '',
  });

  /* -------------------------- FETCH CLIENTS -------------------------- */
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        const resp = await adminService.getAllClients();
        if (resp.flag && resp.response) {
          setClients(resp.response);
        }
      } catch (e: any) {
        console.error('Failed to load clients:', e);
        setError('Failed to load clients');
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  /* -------------------------- FETCH INVOICES -------------------------- */
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoadingInvoices(true);
        setError(null);

        let data: InvoiceDTO[] = [];

        if (filters.clientId) {
          // Specific client
          data = await invoiceService.getInvoicesByClient(
            filters.clientId,
            filters.fromDate || undefined,
            filters.toDate || undefined,
            filters.status || undefined
          );
        } else {
          // ALL invoices
          data = await invoiceService.getAllInvoices(); // Uses /invoice/view/all
        }

        setInvoices(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load invoices');
        console.error(e);
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [filters.clientId, filters.fromDate, filters.toDate, filters.status]);

  /* -------------------------- LOCAL SEARCH FILTER -------------------------- */
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        !filters.search ||
        inv.invoiceNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(filters.search.toLowerCase());
      return matchesSearch;
    });
  }, [invoices, filters.search]);

  /* -------------------------- STATS -------------------------- */
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const pendingCount = filteredInvoices.filter((i) => i.status === 'PENDING').length;
  const paidCount = filteredInvoices.filter((i) => i.status === 'PAID').length;

  /* -------------------------- STATUS COLORS -------------------------- */
  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case 'PAID':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'PENDING':
      case 'SENT':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'PARTIAL':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'VOID':
      case 'REFUNDED':
        return 'bg-slate-100 text-slate-800 border border-slate-200';
      default:
        return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
  };

  /* -------------------------- LOADING STATE -------------------------- */
  if (loadingClients) {
    return <InvoicesSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">View and manage client invoices</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <Badge className="h-4 w-4 p-0 bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <select
                id="client"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.clientId}
                onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value }))}
                disabled={loadingClients}
              >
                <option value="">All Invoices</option>
                {clients.map((c) => (
                  <option key={c.clientId} value={c.clientId}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Invoice # or Client"
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="VOID">Void</option>
              </select>
            </div>

            {/* From Date */}
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
              />
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <div className="relative">
                <Input
                  id="to"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                />
                {loadingInvoices && (
                  <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                {filteredInvoices.length} invoice(s) found
              </CardDescription>
            </div>
            {loadingInvoices && <Loader2 className="h-5 w-5 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent>
          {loadingInvoices ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {filters.clientId ? 'No invoices for this client' : 'No invoices available'}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.invoiceId}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.clientName}</TableCell>
                      <TableCell>{format(new Date(inv.invoiceDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(inv.dueDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">{inv.totalHours}h</TableCell>
                      <TableCell className="text-right font-medium">
                        ${inv.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(inv.status)}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => window.open(`/api/invoice/pdf/${inv.invoiceId}`, '_blank')}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*                         SKELETON COMPONENT                         */
/* ------------------------------------------------------------------ */
function InvoicesSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}