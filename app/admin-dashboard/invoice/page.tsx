"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { format, getMonth, getYear } from "date-fns";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { adminService } from "@/lib/api/adminService";
import { invoiceService } from "@/lib/api/invoiceService";
import {
  ClientDTO,
  InvoiceDTO,
  ClientInvoiceSummaryDTO,
  INVOICE_STATUS_OPTIONS,
} from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Search,
  FileText,
  DollarSign,
  Clock,
  ArrowLeft,
  Loader2,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import { SelectContent, SelectItem } from "@/components/ui/select";

interface Filters {
  clientId: string;
  search: string;
  status: string;
  // fromDate: string;
  // toDate: string;
}

/* ------------------------------------------------------------------ */
/* MAIN PAGE COMPONENT */
/* ------------------------------------------------------------------ */
export default function InvoicesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [lockingInvoices, setLockingInvoices] = useState<Set<string>>(
    new Set()
  );
  // 1. Add these states (replace old fromDate/toDate)
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [downloading, setDownloading] = useState<Set<string>>(new Set());

  // 2. Year & Month options
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - i);
  }, []);

  const availableMonths = useMemo(
    () => [
      { value: 1, label: "January" },
      { value: 2, label: "February" },
      { value: 3, label: "March" },
      { value: 4, label: "April" },
      { value: 5, label: "May" },
      { value: 6, label: "June" },
      { value: 7, label: "July" },
      { value: 8, label: "August" },
      { value: 9, label: "September" },
      { value: 10, label: "October" },
      { value: 11, label: "November" },
      { value: 12, label: "December" },
    ],
    []
  );
  const [filters, setFilters] = useState<Filters>({
    clientId: "",
    search: "",
    status: "",
    // fromDate: "",
    // toDate: "",
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
        console.error("Failed to load clients:", e);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to load clients. Please try again.",
        });
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  /* -------------------------- FETCH INVOICES -------------------------- */
  const fetchInvoices = useCallback(async () => {
    try {
      setLoadingInvoices(true);
      let data: InvoiceDTO[] = [];

      if (filters.clientId) {
        data = await invoiceService.getInvoicesByClient(filters.clientId, {
          status: filters.status || undefined,
        });
      } else {
        data = await invoiceService.getAllInvoices();
      }

      setInvoices(data || []);
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: e.message || "Failed to load invoices.",
      });
    } finally {
      setLoadingInvoices(false);
    }
  }, [filters.clientId, filters.status]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  /* -------------------------- LOCAL FILTERING -------------------------- */
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const dateField = inv.fromDate || inv.invoiceDate;
      const invDate = dateField ? new Date(dateField) : null;

      if (!invDate || isNaN(invDate.getTime())) return true;

      const yearMatch = !selectedYear || getYear(invDate) === selectedYear;
      const monthMatch =
        !selectedMonth || getMonth(invDate) + 1 === selectedMonth;

      const statusMatch = !filters.status || inv.status === filters.status;
      const searchMatch =
        !filters.search ||
        inv.invoiceNumber
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(filters.search.toLowerCase());

      return yearMatch && monthMatch && statusMatch && searchMatch;
    });
  }, [invoices, selectedYear, selectedMonth, filters.status, filters.search]);

  /* -------------------------- STATS -------------------------- */
  const totalRevenue = filteredInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );
  const overdueCount = filteredInvoices.filter(
    (i) => i.status === "OVERDUE"
  ).length;
  const paidCount = filteredInvoices.filter((i) => i.status === "PAID").length;

  /* -------------------------- STATUS COLORS -------------------------- */
  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case "PAID":
      case "APPROVED":
        return "bg-green-100 text-green-800 border border-green-200";
      case "SENT":
      // case 'PENDING':
      //   return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case "OVERDUE":
      case "REJECTED":
        return "bg-red-100 text-red-800 border border-red-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border border-blue-200";
    }
  };

  /* -------------------------- PDF DOWNLOAD HANDLER -------------------------- */
  const handleDownloadPDF = async (invoiceId: string) => {
    const key = `${invoiceId}-PDF`;
    if (downloading.has(key)) return;

    setDownloading((prev) => new Set(prev).add(key));

    try {
      const blob = await invoiceService.downloadInvoicePDF(invoiceId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error: any) {
      console.error("Failed to open PDF:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message || "Failed to download PDF. Please try again.",
      });
    } finally {
      setDownloading((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  /* -------------------------- Excel DOWNLOAD HANDLER -------------------------- */
  const handleDownloadExcel = async (invoiceId: string) => {
    const key = `${invoiceId}-EXCEL`;
    if (downloading.has(key)) return;

    setDownloading((prev) => new Set(prev).add(key));

    try {
      const blob = await invoiceService.downloadInvoiceExcel(invoiceId);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.xlsx`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Excel download failed:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error?.message || "Failed to download Excel. Please try again.",
      });
    } finally {
      setDownloading((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  /* -------------------------- DELETE HANDLER -------------------------- */
  const handleDelete = async (invoiceId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await invoiceService.deleteInvoice(invoiceId);
        Swal.fire("Deleted!", "Your invoice has been deleted.", "success");
        fetchInvoices();
      } catch (error: any) {
        console.error("Failed to delete invoice:", error);
        Swal.fire(
          "Error!",
          error.message || "Failed to delete invoice.",
          "error"
        );
      }
    }
  };

  /* -------------------------- LOCK/UNLOCK HANDLER -------------------------- */
  const handleLockToggle = async (
    invoiceId: string,
    currentLocked: boolean
  ) => {
    const action = currentLocked ? "UNLOCK" : "LOCK";
    const loadingKey = `${invoiceId}-${action}`;

    if (lockingInvoices.has(loadingKey)) return;

    setLockingInvoices((prev) => new Set(prev).add(loadingKey));

    try {
      const updatedInvoice = await invoiceService.updateInvoiceLockStatus(
        invoiceId,
        action
      );

      // Update local state
      setInvoices((prev) =>
        prev.map((inv) => (inv.invoiceId === invoiceId ? updatedInvoice : inv))
      );

      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Invoice ${
          action === "LOCK" ? "locked" : "unlocked"
        } successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error(`Failed to ${action.toLowerCase()} invoice:`, error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || `Failed to ${action.toLowerCase()} invoice.`,
      });
    } finally {
      setLockingInvoices((prev) => {
        const next = new Set(prev);
        next.delete(loadingKey);
        return next;
      });
    }
  };

  /* -------------------------- LOADING STATE -------------------------- */
  if (loadingClients) {
    return <InvoicesSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="relative flex items-center justify-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Invoices
          </h1>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
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
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                value={filters.clientId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, clientId: e.target.value }))
                }
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
                  className="pl-8 cursor-pointer"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                />
              </div>
            </div>
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="">All Status</option>
                {INVOICE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <select
                id="year"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <select
                id="month"
                className="w-full rounded-md border cursor-pointer border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(e.target.value ? Number(e.target.value) : "")
                }
                // disabled={!selectedYear}
              >
                <option value="">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No results found for your current filters.
              </p>
              <p className="text-sm text-muted-foreground">
                {filters.clientId
                  ? "No invoices for this client."
                  : "No invoices available."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Generated Date</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => {
                    const isLocked = inv.locked === true;
                    const isLocking =
                      lockingInvoices.has(`${inv.invoiceId}-LOCK`) ||
                      lockingInvoices.has(`${inv.invoiceId}-UNLOCK`);
                    const isDownloadingPDF = downloading.has(
                      `${inv.invoiceId}-PDF`
                    );
                    const isDownloadingExcel = downloading.has(
                      `${inv.invoiceId}-EXCEL`
                    );

                    return (
                      <TableRow
                        key={inv.invoiceId}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/admin-dashboard/invoice/${inv.invoiceId}`
                          )
                        }
                      >
                        <TableCell className="font-medium">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell>{inv.clientName}</TableCell>
                        <TableCell>
                          {format(new Date(inv.invoiceDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(inv.dueDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(inv.fromDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(inv.toDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {inv.totalHours || 0}h
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {inv.taxAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {inv.subtotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {inv.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(inv.status)}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-1">
                            {/* Download */}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPDF(inv.invoiceId);
                              }}
                              disabled={isDownloadingPDF}
                              className={`inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-8 w-8 p-0
                                ${
                                  isDownloadingPDF
                                    ? "opacity-50 cursor-not-allowed"
                                    : "bg-background hover:bg-accent hover:text-accent-foreground"
                                }`}
                              title="Download PDF"
                            >
                              {isDownloadingPDF ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadExcel(inv.invoiceId);
                              }}
                              disabled={isDownloadingExcel}
                              className={`inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-8 w-8 p-0
                                ${
                                  isDownloadingExcel
                                    ? "opacity-50 cursor-not-allowed"
                                    : "bg-background hover:bg-accent hover:text-accent-foreground"
                                }`}
                              title="Download Excel"
                            >
                              {isDownloadingExcel ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </button>

                            {/* Lock / Unlock */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLockToggle(inv.invoiceId, isLocked);
                              }}
                              disabled={isLocking}
                              className={`inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-8 w-8 p-0 transition-all cursor-pointer ${
                                isLocked
                                  ? "bg-orange-100 hover:bg-orange-200 text-orange-700"
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              } ${
                                isLocking ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              title={
                                isLocked ? "Unlock Invoice" : "Lock Invoice"
                              }
                            >
                              {isLocking ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isLocked ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(inv.invoiceId);
                              }}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-destructive hover:text-destructive-foreground h-8 w-8 p-0 cursor-pointer"
                              title="Delete Invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
/* SKELETON COMPONENT */
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
