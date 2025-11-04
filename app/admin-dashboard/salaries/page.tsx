// app/admin-dashboard/salaries/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { salaryService } from '@/lib/api/salaryService';
import { ListofEmployeeSalaries} from '@/lib/api/ListofEmployeSalaries';
import {
  WebResponseDTO,
  EmployeeDTO,
  SalarySummaryDTO,
} from '@/lib/api/types';
import dayjs from 'dayjs';
import { AlertTriangle } from 'lucide-react';

export default function AdminPage() {
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

  // Fetch employees
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

  // Fetch employee details (for date of joining)
  const handleSelectEmployee = async (empId: string) => {
    setSelectedEmployee(empId);
    setSalaryData(null);
    setNoData(false);
    setAvailableYears([]);
    setAvailableMonths([]);
    setSelectedYear('');
    setSelectedMonth('');

    if (!empId) return;

    try {
      const res: WebResponseDTO<EmployeeDTO> = await ListofEmployeeSalaries.getEmployeeById(empId);
      const details = res.response;
      if (!details) return;

      setEmployeeDetails(details);

      const joinDate = dayjs(details.dateOfJoining);
      const currentDate = dayjs();

      const years: number[] = [];
      for (let y = joinDate.year(); y <= currentDate.year(); y++) years.push(y);
      setAvailableYears(years);
    } catch {
      setError('Failed to load employee details.');
    }
  };

  // When year changes
  const handleYearChange = (year: number) => {
    if (!employeeDetails) return;

    const joinDate = dayjs(employeeDetails.dateOfJoining);
    const currentDate = dayjs();
    let months: { name: string; value: number }[] = [];

    if (year === joinDate.year() && year === currentDate.year()) {
      months = Array.from({ length: currentDate.month() + 1 - joinDate.month() }, (_, i) => ({
        name: dayjs().month(joinDate.month() + i).format('MMMM'),
        value: joinDate.month() + i + 1,
      }));
    } else if (year === joinDate.year()) {
      months = Array.from({ length: 12 - joinDate.month() }, (_, i) => ({
        name: dayjs().month(joinDate.month() + i).format('MMMM'),
        value: joinDate.month() + i + 1,
      }));
    } else if (year === currentDate.year()) {
      months = Array.from({ length: currentDate.month() + 1 }, (_, i) => ({
        name: dayjs().month(i).format('MMMM'),
        value: i + 1,
      }));
    } else {
      months = Array.from({ length: 12 }, (_, i) => ({
        name: dayjs().month(i).format('MMMM'),
        value: i + 1,
      }));
    }

    setAvailableMonths(months);
    setSelectedYear(year);
    setSelectedMonth('');
  };

  // Fetch salary
  const handleFetchSalary = async () => {
  if (!selectedEmployee || !selectedMonth || !selectedYear) return;

  setLoading(true);
  setNoData(false);
  setError(null);

  const monthString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  try {
    const res = await salaryService.getPayslip(selectedEmployee, monthString);
    console.log('📦 Salary API raw response:', res);

    // ✅ Safely extract the actual salary data
    const salaryPayload = res?.response;

    if (res.flag && salaryPayload && salaryPayload.employeeId) {
      setSalaryData(salaryPayload);
      setNoData(false);
    } else {
      console.warn("⚠️ No salary data found in response:", res);
      setSalaryData(null);
      setNoData(true);
    }

  } catch (err) {
    console.error('❌ Salary fetch error:', err);
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard - Employee Salaries</h1>

      {/* Employee Dropdown */}
      <div>
        <label className="block font-medium mb-1">Select Employee:</label>
        <select
          value={selectedEmployee}
          onChange={(e) => handleSelectEmployee(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-72"
        >
          <option value="">-- Select Employee --</option>
          {employees.map((emp) => (
            <option key={emp.employeeId} value={emp.employeeId}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Filters + Button */}
      {employeeDetails && (
        <div className="flex items-end gap-4">
          <div>
            <label className="block font-medium mb-1">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-2 w-32"
            >
              <option value="">-- Year --</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-2 w-40"
              disabled={!selectedYear}
            >
              <option value="">-- Month --</option>
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleFetchSalary}
            disabled={!selectedEmployee || !selectedYear || !selectedMonth || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Fetching...' : 'Fetch Salary'}
          </button>
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {/* Salary Display Section */}
      {loading && (
        <p className="text-gray-500 text-center mt-6 italic">
          Loading salary details...
        </p>
      )}

      {noData && (
        <div className="flex flex-col items-center justify-center text-center border border-yellow-300 bg-yellow-50 rounded-lg p-6 mt-4">
          <AlertTriangle className="text-yellow-500 w-10 h-10 mb-3" />
          <h3 className="text-lg font-semibold text-yellow-700">No Salary Slip Found</h3>
          <p className="text-gray-600 mt-1">
            No payslip has been generated for <strong>{selectedMonthString}</strong>.
            Please check with HR or try selecting a different month.
          </p>
        </div>
      )}

      {salaryData && (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto mt-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-3 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Salary Details</h2>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-3">
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  salaryData.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {salaryData.paymentStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-gray-700">
              <p><strong>Employee:</strong> {salaryData.employeeName}</p>
              <p><strong>Client:</strong> {salaryData.clientName}</p>
              <p><strong>Payroll Status:</strong> {salaryData.payrollStatus}</p>
              <p><strong>Month:</strong> {salaryData.salaryMonth}</p>
              <p><strong>Total Hours:</strong> {salaryData.totalHours}</p>
            </div>
          </div>

          <div className="border rounded-lg p-5 bg-gray-50">
            <h4 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
              Allowances
            </h4>
            <div className="divide-y">
              {salaryData.allowances.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 text-gray-700">
                  <span className="capitalize">{item.name.replace(/_/g, ' ')}</span>
                  <span>₹{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium pt-3 text-gray-900">
                <span>Total Allowances</span>
                <span>₹{salaryData.totalAllowances.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-5 bg-gray-50">
            <h4 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
              Deductions
            </h4>
            <div className="divide-y">
              {salaryData.deductions.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 text-gray-700">
                  <span className="capitalize">{item.name.replace(/_/g, ' ')}</span>
                  <span>₹{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium pt-3 text-gray-900">
                <span>Total Deductions</span>
                <span>₹{salaryData.totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
              Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-gray-700">
              <p><strong>Basic Pay:</strong> ₹{salaryData.basicPay.toLocaleString()}</p>
              <p><strong>Gross Salary:</strong> ₹{salaryData.grossSalary.toLocaleString()}</p>
              <p><strong>Net Salary:</strong> ₹{salaryData.netSalary.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
