'use client';

import { salaryGenerateService } from '@/lib/api/salarybuttonGenerateService';
import React, { useEffect, useState } from 'react';
import { salaryService } from '@/lib/api/salaryService';
import { ListofEmployeeSalaries } from '@/lib/api/ListofEmployeSalaries';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  WebResponseDTO,
  EmployeeDTO,
  SalarySummaryDTO,
} from '@/lib/api/types';

import dayjs from 'dayjs';
import {
  AlertTriangle,
  Loader2,
  User,
  Calendar,
  IndianRupee,
} from 'lucide-react';

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Swal from 'sweetalert2';

export default function AdminPage() {
  /* ───────────────────────────────────────────
   * STATE
   * ─────────────────────────────────────────── */
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDTO | null>(null);

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<{ name: string; value: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');

  const [salaryData, setSalaryData] = useState<SalarySummaryDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSalaryList, setGeneratedSalaryList] = useState<{ employeeId: string; employeeName: string; companyId?: string; workedHours: number }[]>([]);

  /* Salary Generation Month */
  const [genMonth, setGenMonth] = useState('');

  /* ───────────────────────────────────────────
   * FETCH EMPLOYEES
   * ─────────────────────────────────────────── */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res: WebResponseDTO<EmployeeDTO[]> =
          await ListofEmployeeSalaries.getAllEmployees();
        setEmployees(res.response || []);
      } catch {
        setError('Failed to load employees.');
      }
    };
    fetchEmployees();
  }, []);

  /* ───────────────────────────────────────────
   * EMPLOYEE SELECT
   * ─────────────────────────────────────────── */
  const handleSelectEmployee = async (empId: string) => {
    setSelectedEmployee(empId);
    setSalaryData(null);
    setNoData(false);
    setAvailableYears([]);
    setAvailableMonths([]);
    setSelectedYear('');
    setSelectedMonth('');
    setEmployeeDetails(null);

    if (!empId) return;

    try {
      const res: WebResponseDTO<EmployeeDTO> =
        await ListofEmployeeSalaries.getEmployeeById(empId);

      const details = res.response;
      if (!details) return;

      setEmployeeDetails(details);

      // Generate year list
      const join = dayjs(details.dateOfJoining);
      const now = dayjs();
      const years: number[] = [];

      for (let y = join.year(); y <= now.year(); y++) years.push(y);
      setAvailableYears(years);
    } catch {
      setError('Failed to load employee details.');
    }
  };

  /* ───────────────────────────────────────────
   * YEAR → MONTH LIST
   * ─────────────────────────────────────────── */
  const handleYearChange = (year: number) => {
    if (!employeeDetails) return;

    const join = dayjs(employeeDetails.dateOfJoining);
    const now = dayjs();

    let months: { name: string; value: number }[] = [];
    const startMonth = year === join.year() ? join.month() : 0;
    const endMonth = year === now.year() ? now.month() : 11;

    for (let m = startMonth; m <= endMonth; m++) {
      months.push({
        name: dayjs().month(m).format('MMMM'),
        value: m + 1,
      });
    }

    setAvailableMonths(months);
    setSelectedYear(year);
    setSelectedMonth('');
  };

  /* ───────────────────────────────────────────
   * FETCH SALARY
   * ─────────────────────────────────────────── */
  const handleFetchSalary = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear) return;

    setLoading(true);
    setNoData(false);
    setError(null);

    const monthString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    try {
      const res = await salaryService.getPayslip(selectedEmployee, monthString);
      const payload = res?.response;

      if (res.flag && payload && payload.employeeId) {
        setSalaryData(payload);
        setNoData(false);
      } else {
        setSalaryData(null);
        setNoData(true);
      }
    } catch {
      setNoData(true);
      setSalaryData(null);
    } finally {
      setLoading(false);
    }
  };

  const selectedMonthString =
    selectedYear && selectedMonth
      ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
      : '';

  /* ───────────────────────────────────────────
   * RENDER UI
   * ─────────────────────────────────────────── */

  const downloadAsPDF = (list: typeof generatedSalaryList) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text("Pending Salary Generation List", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${dayjs().format("DD MMMM YYYY, HH:mm")}`, 14, 30);
    doc.text(`Total pending employees: ${list.length}`, 14, 38);

    // Table data
    const tableColumn = ["Employee Name", "Company ID", "Worked Hours"];
    const tableRows = list.map((emp) => [
      emp.employeeName,
      emp.companyId ?? "—",
      emp.workedHours.toString(),
    ]);

    // Use the imported autoTable function
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 48,
      theme: "grid",
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 6,
        overflow: "linebreak",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 255],
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
      },
      margin: { top: 48, left: 14, right: 14 },
    });

    // Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(140);
      doc.text(
        `Page ${i} of ${pageCount} • EmpTimeHub • ${dayjs().format("DD/MM/YYYY")}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Trigger download
    doc.save(`pending-salary-generation-${dayjs().format("YYYY-MM-DD")}.pdf`);
  };
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-10">

      {/* MAIN TITLE */}
      <div className="flex justify-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Employee Salaries
        </h1>
      </div>

      {/* ───────────────────────────────────────────
          TABS WRAPPER
      ─────────────────────────────────────────── */}
      <Tabs defaultValue="generate" className="w-full">

        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="view">View Salary Slip</TabsTrigger>
          <TabsTrigger value="generate">Generate Salary</TabsTrigger>
        </TabsList>

        {/* ───────────────────────────────
            TAB 1 → SALARY GENERATION
        ─────────────────────────────── */}
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Select Employee & Period
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">

              {/* MONTH SELECT (type="month") */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Select Month</label>
                <input
                  type="month"
                  className="border rounded p-2 w-full md:w-60"
                  value={genMonth}
                  onChange={(e) => setGenMonth(e.target.value)}
                />
              </div>

              <Button
                variant="destructive"
                disabled={!genMonth}
                onClick={async () => {
                  if (!genMonth) return;

                  const [year, month] = genMonth.split("-");

                  // 1. Show loading popup first
                  Swal.fire({
                    title: "Processing...",
                    text: "Generating salaries, please wait...",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                      Swal.showLoading();
                    },
                  });

                  try {
                    const res = await salaryGenerateService.generateSalary(
                      year,
                      month.padStart(2, "0")
                    );

                    // 2. Show success popup (user must click OK to proceed)
                    const result = await Swal.fire({
                      title: "Success!",
                      text: "Salary generation completed successfully!",
                      icon: "success",
                      confirmButtonColor: "#4F46E5",
                      confirmButtonText: "OK",
                    });

                    // 3. Only AFTER user clicks "OK" → update state → show the table
                    if (result.isConfirmed) {
                      setGeneratedSalaryList(res.response || []);
                    }
                  } catch (err) {
                    console.error(err);

                    await Swal.fire({
                      title: "Error",
                      text: "Failed to generate salary. Please try again.",
                      icon: "error",
                      confirmButtonColor: "#EF4444",
                      confirmButtonText: "OK",
                    });
                  }
                }}
              >
                Generate Salary
              </Button>

              {generatedSalaryList.length > 0 && (
                <div className="mt-6">
                  {/* Heading + Button in one row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h3 className="text-lg font-semibold">
                      Salary Generation Pending For these Employees
                    </h3>

                    {/* Download Button – right-aligned on desktop */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAsPDF(generatedSalaryList)}
                      className="flex items-center gap-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      Download as PDF
                    </Button>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Employee Name</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Company ID</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Worked Hours</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200 bg-white">
                        {generatedSalaryList.map((emp) => (
                          <tr key={emp.employeeId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">{emp.employeeName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{emp.companyId ?? "—"}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{emp.workedHours}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────────────────────────────
            TAB 2 → VIEW SALARY SLIP
        ─────────────────────────────── */}
        <TabsContent value="view">
          {/* Keep your existing full UI exactly as before */}
          {/* -------------------------------------------- */}

          {/* EMPLOYEE + YEAR + MONTH + FETCH UI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Select Employee & Period
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* Employee Select */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Employee</label>

                <Select
                  value={selectedEmployee}
                  onValueChange={handleSelectEmployee}
                >
                  <SelectTrigger className="w-full md:w-80">
                    <SelectValue placeholder="— Choose an employee —" />
                  </SelectTrigger>

                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.employeeId} value={e.employeeId}>
                        {e.firstName} {e.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year + Month */}
              {selectedEmployee && employeeDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                  {/* Year */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Year</label>

                    <Select
                      value={selectedYear?.toString() ?? ""}
                      onValueChange={(v) => handleYearChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="— Select year —" />
                      </SelectTrigger>

                      <SelectContent>
                        {availableYears.map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Month */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Month</label>

                    <Select
                      disabled={!selectedYear}
                      value={selectedMonth?.toString() ?? ""}
                      onValueChange={(v) => setSelectedMonth(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="— Select month —" />
                      </SelectTrigger>

                      <SelectContent>
                        {availableMonths.map((m) => (
                          <SelectItem key={m.value} value={m.value.toString()}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fetch Button */}
                  <Button
                    onClick={handleFetchSalary}
                    disabled={!selectedEmployee || !selectedYear || !selectedMonth || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fetching…
                      </>
                    ) : (
                      "Fetch Salary"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ERROR */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* LOADING */}
          {loading && (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          )}

          {/* NO DATA */}
          {noData && (
            <Alert className="border-yellow-300 bg-yellow-50 mt-6">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <AlertTitle className="text-yellow-800">No Salary Slip Found</AlertTitle>
              <AlertDescription className="text-yellow-700">
                No payslip generated for <strong>{selectedMonthString}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* SALARY SLIP */}
          {salaryData && (
            <div className="grid gap-6 lg:grid-cols-3 mt-6">

              {/* Overview */}
              <Card className="lg:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Salary Slip – {salaryData.salaryMonth}
                  </CardTitle>
                  <Badge
                    variant={salaryData.paymentStatus === 'PAID' ? 'default' : 'destructive'}
                  >
                    {salaryData.paymentStatus}
                  </Badge>
                </CardHeader>

                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Employee</span>
                    <p>{salaryData.employeeName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Client</span>
                    <p>{salaryData.clientName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Payroll</span>
                    <p>{salaryData.payrollStatus}</p>
                  </div>
                  <div>
                    <span className="font-medium">Hours</span>
                    <p>{salaryData.totalHours}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Allowances */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5" />
                    Allowances
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {salaryData.allowances.map((a, i) => (
                        <TableRow key={i}>
                          <TableCell>{a.name.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="text-right">
                            ₹{a.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold">
                        <TableCell>Total Allowances</TableCell>
                        <TableCell className="text-right">
                          ₹{salaryData.totalAllowances.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Deductions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5" />
                    Deductions
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {salaryData.deductions.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>{d.name.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="text-right">
                            ₹{d.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold">
                        <TableCell>Total Deductions</TableCell>
                        <TableCell className="text-right">
                          ₹{salaryData.totalDeductions.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>

                <CardContent className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Basic Pay</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ₹{salaryData.basicPay.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Gross Salary</p>
                    <p className="text-2xl font-bold text-green-700">
                      ₹{salaryData.grossSalary.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Net Salary</p>
                    <p className="text-2xl font-bold text-purple-700">
                      ₹{salaryData.netSalary.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
