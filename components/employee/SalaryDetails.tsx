// components/employee/SalaryDetails.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { salaryService } from '@/lib/api/salaryService';
import { AlertTriangle } from 'lucide-react'; // nice warning icon

export default function SalaryDetails({ employeeId }: { employeeId: string }) {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [salaryData, setSalaryData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);

  // ✅ Load all salaries and current month data on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Set current month (YYYY-MM)
        const now = new Date();
        const monthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(monthString);

        // Fetch all salaries
        const allData = await salaryService.getAllSalaries(employeeId);
        setSalaries(Array.isArray(allData) ? allData : [allData]);

        // Fetch current month's payslip
        setLoading(true);
        const data = await salaryService.getPayslip(employeeId, monthString);
        if (!data || Object.keys(data).length === 0) {
          setSalaryData(null);
          setNoData(true);
        } else {
          setSalaryData(data);
          setNoData(false);
        }
      } catch (error) {
        console.error('Error loading salary data:', error);
        setSalaryData(null);
        setNoData(true);
      } finally {
        setLoading(false);
      }
    }

    if (employeeId) loadData();
  }, [employeeId]);

  // ✅ Manual filter (same logic reused)
  const handleFilter = async () => {
    if (!selectedMonth) return;
    setLoading(true);
    setNoData(false);
    try {
      const data = await salaryService.getPayslip(employeeId, selectedMonth);
      if (!data || Object.keys(data).length === 0) {
        setSalaryData(null);
        setNoData(true);
      } else {
        setSalaryData(data);
        setNoData(false);
      }
    } catch (error) {
      console.error(error);
      setSalaryData(null);
      setNoData(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
  <div className="flex items-center justify-between border-b pb-3 mb-6">
    <h2 className="text-2xl font-semibold text-gray-800">
      Salary Details
    </h2>
      <button
      onClick={() => salaryService.downloadPayslipPdf(employeeId, selectedMonth)}
      disabled={!selectedMonth || loading}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm transition-all"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 16V4m0 12l-3.5-3.5M12 16l3.5-3.5M6 20h12"
        />
      </svg>
      Download Payslip
    </button>


  </div>

  {/* Month Filter */}
  <div className="flex gap-4 mb-6">
    <input
      type="month"
      className="border px-3 py-2 rounded w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={selectedMonth}
      onChange={(e) => setSelectedMonth(e.target.value)}
    />
    <button
      onClick={handleFilter}
      disabled={loading}
      className={`${
        loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
      } text-white px-5 py-2 rounded transition-all`}
    >
      {loading ? 'Loading...' : 'Filter'}
    </button>
  </div>

  {/* Salary Data */}
  {salaryData && !noData && !loading && (
    <div className="space-y-6">
      {/* Top Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-semibold text-gray-800">
            Payslip for {selectedMonth}
          </h3>
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

      {/* Allowances Section */}
      <div className="border rounded-lg p-5 bg-gray-50">
        <h4 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
          Allowances
        </h4>
        <div className="divide-y">
          {salaryData.allowances.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between py-2 text-gray-700"
            >
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

      {/* Deductions Section */}
      <div className="border rounded-lg p-5 bg-gray-50">
        <h4 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
          Deductions
        </h4>
        <div className="divide-y">
          {salaryData.deductions.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between py-2 text-gray-700"
            >
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

      {/* Salary Summary */}
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

  {/* No Data */}
  {noData && !loading && (
    <div className="flex flex-col items-center justify-center text-center border border-yellow-300 bg-yellow-50 rounded-lg p-6 mt-4">
      <AlertTriangle className="text-yellow-500 w-10 h-10 mb-3" />
      <h3 className="text-lg font-semibold text-yellow-700">
        No Salary Slip Found
      </h3>
      <p className="text-gray-600 mt-1">
        No payslip has been generated for <strong>{selectedMonth}</strong>.  
        Please check with HR or try selecting a different month.
      </p>
    </div>
  )}

  {/* Loading */}
  {loading && (
    <p className="text-gray-500 text-center mt-6 italic">
      Loading salary details...
    </p>
  )}

  {/* Initial */}
  {!salaryData && !noData && !loading && (
    <p className="text-gray-500 text-center mt-6 italic">
      Select a month to view the payslip.
    </p>
  )}
</div>

  );
}
