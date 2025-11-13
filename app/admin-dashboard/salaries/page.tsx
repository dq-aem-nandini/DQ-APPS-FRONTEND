'use client';

import React, { useEffect, useState } from 'react';
import { salaryService } from '@/lib/api/salaryService';
import { ListofEmployeeSalaries } from '@/lib/api/ListofEmployeSalaries';
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

export default function AdminPage() {
  /* ────── STATE ────── */
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

  /* ────── FETCH EMPLOYEES ────── */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res: WebResponseDTO<EmployeeDTO[]> = await ListofEmployeeSalaries.getAllEmployees();
        setEmployees(res.response || []);
      } catch {
        setError('Failed to load employees.');
      }
    };
    fetchEmployees();
  }, []);

  /* ────── EMPLOYEE SELECT ────── */
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
      const res: WebResponseDTO<EmployeeDTO> = await ListofEmployeeSalaries.getEmployeeById(empId);
      const details = res.response;
      if (!details) return;

      setEmployeeDetails(details);

      const join = dayjs(details.dateOfJoining);
      const now = dayjs();
      const years: number[] = [];
      for (let y = join.year(); y <= now.year(); y++) years.push(y);
      setAvailableYears(years);
    } catch {
      setError('Failed to load employee details.');
    }
  };

  /* ────── YEAR → MONTHS ────── */
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

  /* ────── FETCH SALARY ────── */
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
    } catch (err) {
      console.error(err);
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

  /* ────── RENDER ────── */
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">

      <div className="relative flex items-center justify-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Employee Salaries
        </h1>
      </div>

      {/* ── FILTERS CARD ── */}
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
            <Select value={selectedEmployee} onValueChange={handleSelectEmployee}>
              <SelectTrigger className="w-full md:w-80">
                <SelectValue placeholder="— Choose an employee —" />
              </SelectTrigger>
              <SelectContent>
                {employees.length === 0 ? (
                  <SelectItem value="loading" disabled>
                    Loading employees…
                  </SelectItem>
                ) : (
                  employees.map((e) => (
                    <SelectItem key={e.employeeId} value={e.employeeId}>
                      {e.firstName} {e.lastName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Year & Month */}
          {selectedEmployee && employeeDetails && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Year */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Year</label>
                <Select
                  value={selectedYear?.toString() ?? ''}
                  onValueChange={(v: string) => handleYearChange(Number(v))}
                >
                  <SelectTrigger className="w-full">
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
                  value={selectedMonth?.toString() ?? ''}
                  onValueChange={(v: string) => setSelectedMonth(Number(v))}
                >
                  <SelectTrigger className="w-full">
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
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching…
                  </>
                ) : (
                  'Fetch Salary'
                )}
              </Button>
            </div>
          )}

          {/* Loading employee details */}
          {selectedEmployee && !employeeDetails && (
            <p className="text-sm text-muted-foreground italic">
              Loading employee details…
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Error ── */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Loading Skeleton ── */}
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

      {/* ── No Data ── */}
      {noData && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800">No Salary Slip Found</AlertTitle>
          <AlertDescription className="text-yellow-700">
            No payslip generated for <strong>{selectedMonthString}</strong>. Try another month or contact HR.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Salary Payslip ── */}
      {salaryData && (
        <div className="grid gap-6 lg:grid-cols-3">
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
                      <TableCell className="capitalize">
                        {a.name.replace(/_/g, ' ')}
                      </TableCell>
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
                      <TableCell className="capitalize">
                        {d.name.replace(/_/g, ' ')}
                      </TableCell>
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
    </div>
  );
}