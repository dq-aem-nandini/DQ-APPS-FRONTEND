'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { leaveService } from '@/lib/api/leaveService';
import {
  LeaveCategoryType,
  FinancialType,
  LeaveRequestDTO,
  ClientMinDTO,
  EmployeeMinDTO,
  ClientEmployeeMinResponseDTO,
  LEAVE_CATEGORY_OPTIONS,
  FINANCIAL_TYPE_OPTIONS,
} from '@/lib/api/types';
import { manualInvoiceService } from '@/lib/api/manualInvoiceService';
import BackButton from '@/components/ui/BackButton';

const ApplyLeaveSuperHRPage: React.FC = () => {
  const router = useRouter();

  /* =========================
     STATE
  ========================= */
  const [clients, setClients] = useState<ClientMinDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeMinDTO[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [formData, setFormData] = useState<LeaveRequestDTO>({
    categoryType: '' as LeaveCategoryType,
    financialType: '' as FinancialType,
    partialDay: false,
    leaveDuration: 0,
    fromDate: '',
    toDate: '',
    context: '',
  });

  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [insufficientLeave, setInsufficientLeave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     DATE LIMITS
  ========================= */
  const today = new Date();
  const startOfWeek = new Date(today);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  const minAllowedDate = new Date(startOfWeek);
  minAllowedDate.setDate(minAllowedDate.getDate() - 15);
  const minDate = minAllowedDate.toISOString().split('T')[0];
  5
  /* =========================
     LOAD CLIENTS
  ========================= */
  useEffect(() => {
    async function loadClients() {
      try {
        const res = await manualInvoiceService.getAllClientsMin();
        setClients(res.response || []);
      } catch (e: any) {
        Swal.fire('Error', e.message || 'Failed to load clients', 'error');
      }
    }
    loadClients();
  }, []);

  /* =========================
     LOAD EMPLOYEES
  ========================= */
  useEffect(() => {
    if (!selectedClientId) {
      setEmployees([]);
      setSelectedEmployeeId('');
      return;
    }

    async function loadEmployees() {
      try {
        const res = await manualInvoiceService.getEmployeesByClientId(selectedClientId);

        // ✅ response is OBJECT, not ARRAY
        const data: ClientEmployeeMinResponseDTO | undefined = Array.isArray(res.response)
          ? res.response[0]
          : res.response || undefined;

        setEmployees(data?.employees || []);
      } catch (e: any) {
        Swal.fire('Error', e.message || 'Failed to load employees', 'error');
      }
    }

    loadEmployees();
  }, [selectedClientId]);

  useEffect(() => {
    if (
      hasCalculated &&
      formData.leaveDuration > 1 &&
      formData.partialDay
    ) {
      setFormData(prev => ({
        ...prev,
        partialDay: false,
      }));
    }
  }, [hasCalculated, formData.leaveDuration]);

  /* =========================
     AUTO CALCULATE DURATION
  ========================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.fromDate && formData.toDate) {
        calculateDuration();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.fromDate, formData.toDate, formData.partialDay]);

  const getLabel = (value: string, isCategory: boolean = false): string => {
    const words = value.toLowerCase().split('_');
    const capitalized = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return isCategory ? `${capitalized} Leave` : capitalized;
  };
  /* =========================
     CHECK AVAILABILITY
  ========================= */
  useEffect(() => {
    if (
      selectedEmployeeId &&
      formData.leaveDuration > 0 &&
      formData.financialType === 'PAID' &&
      !checkingAvailability
    ) {
      checkAvailability(selectedEmployeeId, formData.leaveDuration);
    }
  }, [selectedEmployeeId, formData.leaveDuration, formData.financialType]);

  const calculateDuration = async () => {
    if (calculating) return;

    try {
      setCalculating(true);
      setError(null);

      console.log("Employee ID:", selectedEmployeeId);

      const res = await leaveService.calculateWorkingDays(
        {
          fromDate: formData.fromDate || '',
          toDate: formData.toDate || '',
          partialDay: formData.partialDay,
        },
        selectedEmployeeId || undefined
      );

      setFormData(prev => ({
        ...prev,
        leaveDuration: res.leaveDuration || 0,
      }));
      setHasCalculated(true);
    } catch (e: any) {
      setError(e.message || 'Failed to calculate leave duration');
    } finally {
      setCalculating(false);
    }
  };

  const checkAvailability = async (employeeId: string, duration: number) => {
    try {
      setCheckingAvailability(true);
      const availability = await leaveService.checkLeaveAvailability(employeeId, duration);

      if (!availability.available) {
        setInsufficientLeave(true);
        setError(availability.message || 'Not enough paid leaves. Please select UNPAID.');
      } else {
        setInsufficientLeave(false);
        setError(null);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to check leave availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  /* =========================
     HANDLERS
  ========================= */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'financialType' && value === 'UNPAID') {
      setInsufficientLeave(false);
      setError(null);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      setError('Please select an employee');
      return;
    }

    if (insufficientLeave && formData.financialType === 'PAID') {
      setError('Please select UNPAID leave to continue');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await leaveService.applyLeaveBySuperHR(
        selectedEmployeeId,
        formData,
        attachment
      );

      await Swal.fire('Success', 'Leave applied successfully', 'success');
      router.push('/superhr/leaves');
    } catch (e: any) {
      Swal.fire('Error', e.message || 'Failed to apply leave', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-6">

        <div className="mb-10 flex items-center justify-between">
          <BackButton to="/superhr/leaves" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Add Leave
          </h1>
          <div className="w-20" />
        </div>

        {/* Client & Employee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">Select Client</option>
            {clients.map(c => (
              <option key={c.clientId} value={c.clientId}>
                {c.companyName}
              </option>
            ))}
          </select>

          <select
            value={selectedEmployeeId}
            onChange={e => setSelectedEmployeeId(e.target.value)}
            disabled={!selectedClientId}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">
              {!selectedClientId ? 'Select client first' : 'Select employee'}
            </option>
            {employees.map(emp => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.employeeName}
              </option>
            ))}
          </select>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            name="categoryType"
            value={formData.categoryType}
            onChange={handleInputChange}
            required
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">Select Leave Type</option>
            {LEAVE_CATEGORY_OPTIONS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {/* Partial Day */}
          {hasCalculated &&
            (formData.leaveDuration === 1 || formData.partialDay) && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="partialDay"
                  checked={formData.partialDay}
                  onChange={handleInputChange}
                  className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm font-medium">Partial Day</label>
              </div>
            )}
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <input
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              // min={minDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                name="toDate"
                value={formData.toDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!formData.fromDate}
                min={formData.fromDate}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-1">Leave Duration (Days)</label>
            <input
              type="number"
              name="leaveDuration"
              value={
                !hasCalculated
                  ? '' // do not show zero before calculation
                  : calculating
                    ? '' // show placeholder while calculating
                    : formData.leaveDuration // show final value
              }
              onChange={handleInputChange}
              min="0.5"
              step="0.5"
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder={calculating ? "Calculating..." : "Auto-calculated..."}
              required
              readOnly
            />
            {calculating && (
              <p className="text-xs text-gray-500 mt-1">Calculating duration...</p>
            )}
            {!calculating && hasCalculated && formData.leaveDuration === 0 && (
              <p className="text-xs text-amber-600 mt-1">Selected dates are weekends/holiday </p>
            )}
          </div>

          {/* Financial Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Financial Type</label>
            <select
              name="financialType"
              value={formData.financialType}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Financial Type</option>
              {FINANCIAL_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {getLabel(type, false)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="context"
              value={formData.context}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Attachment (Optional, e.g., medical certificate)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.png"
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              calculating ||
              checkingAvailability ||
              formData.leaveDuration === 0 ||
              (insufficientLeave && formData.financialType === 'PAID')
            }
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Processing...
              </>
            ) : calculating || checkingAvailability ? (
              'Calculating...'
            ) : insufficientLeave && formData.financialType === 'PAID' ? (
              'Select UNPAID to Apply'
            ) : (
              'Apply Leave'
            )}

          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveSuperHRPage;
