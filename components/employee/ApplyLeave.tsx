// app/dashboard/leaves/applyleave/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { leaveService } from '@/lib/api/leaveService';
import { employeeService } from '@/lib/api/employeeService';
import {
  LeaveCategoryType,
  FinancialType,
  LeaveRequestDTO,
  EmployeeDTO
} from '@/lib/api/types';
import BackButton from '../ui/BackButton';
import Swal from 'sweetalert2';

const ApplyLeavePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leaveId = searchParams.get('leaveId');

  // All hooks at top level (unconditional) to avoid order issues
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [formData, setFormData] = useState<LeaveRequestDTO>({
    leaveId: leaveId || undefined,
    categoryType: 'CASUAL' as LeaveCategoryType,
    financialType: 'PAID' as FinancialType,
    partialDay: false,
    leaveDuration: 0,
    fromDate: '',
    toDate: '',
    context: '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [insufficientLeave, setInsufficientLeave] = useState(false);

  const categoryTypes: LeaveCategoryType[] = ['SICK', 'CASUAL', 'PLANNED', 'UNPLANNED'];
  const financialTypes: FinancialType[] = ['PAID', 'UNPAID'];

  // Fetch current employee's details on mount (no params needed for authenticated user)
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoadingEmployee(true);
        // Call service method to get EmployeeDTO for current user
        const empResponse = await employeeService.getEmployeeById();
        setEmployee(empResponse);
        setEmployeeId(empResponse.employeeId); // Set UUID for use in APIs (assume EmployeeDTO has employeeId: string)
      } catch (err) {
        // Fallback or error handling
        router.push('/dashboard/error?message=Failed to load employee details');
      } finally {
        setLoadingEmployee(false);
      }
    };
    fetchEmployeeDetails();
  }, []);

  // Fetch leave data for update (now uses fetched employeeId)
  useEffect(() => {
    const fetchLeaveData = async () => {
      if (leaveId && employeeId) {
        try {
          setLoading(true);
          setError(null);
          const leave = await leaveService.getLeaveById(leaveId);
          setFormData({
            leaveId: leave.leaveId,
            categoryType: leave.leaveCategoryType as LeaveCategoryType,
            financialType: leave.financialType as FinancialType,
            partialDay: false,
            fromDate: leave.fromDate,
            toDate: leave.toDate,
            context: leave.context || '',
            leaveDuration: leave.leaveDuration || 0,
          });
        } catch (err) {
          console.error('❌ Error fetching leave data:', err);
          setError('Failed to load leave data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchLeaveData();
  }, [leaveId, employeeId]);

  // Debounced duration calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.fromDate && formData.toDate && !loading) {
        calculateDuration();
      }
    }, 800);

    return () => {
      clearTimeout(timer);
    };
  }, [formData.fromDate, formData.toDate, formData.partialDay, loading]);

  // Re-check when user manually selects PAID
  useEffect(() => {
    if (
      formData.financialType === 'PAID' &&
      formData.leaveDuration !== undefined &&
      formData.leaveDuration > 0 &&
      employeeId &&
      !calculating &&
      !checkingAvailability
    ) {
      checkAvailability(employeeId, formData.leaveDuration);
    }
  }, [formData.financialType, formData.leaveDuration, employeeId]);

  const calculateDuration = async () => {
    if (!formData.fromDate || !formData.toDate || calculating) {
      return;
    }

    try {
      setCalculating(true);
      setError(null);

      const range = { fromDate: formData.fromDate, toDate: formData.toDate, partialDay: formData.partialDay };
      const response = await leaveService.calculateWorkingDays(range);
      const calculatedDuration = response.leaveDuration || 0;

      setFormData((prev) => ({ ...prev, leaveDuration: calculatedDuration }));

      if (employeeId && calculatedDuration > 0) {
        const availability = await leaveService.checkLeaveAvailability(employeeId, calculatedDuration);

        if (!availability.available) {
          setInsufficientLeave(true);
          if (formData.financialType === 'PAID') {
            setError(availability.message || 'Not enough paid leaves. Please select UNPAID.');
          }
        } else {
          setInsufficientLeave(false);
          if (formData.financialType === 'PAID') {
            setError(null);
          }
        }
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to calculate duration. Please check your dates and try again.');
    } finally {
      setCalculating(false);
    }
  };

  const checkAvailability = async (empId: string, leaveDuration: number) => {
    if (!empId || leaveDuration <= 0) {
      return;
    }

    try {
      setCheckingAvailability(true);
      const availability = await leaveService.checkLeaveAvailability(empId, leaveDuration);

      if (!availability.available) {
        setInsufficientLeave(true);
        if (formData.financialType === 'PAID') {
          setError(availability.message || 'Not enough paid leaves.');
        }
      } else {
        setInsufficientLeave(false);
        if (formData.financialType === 'PAID') {
          setError(null);
        }
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to check leave balance. Please try again.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const getLabel = (value: string, isCategory: boolean = false): string => {
    const words = value.toLowerCase().split('_');
    const capitalized = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return isCategory ? `${capitalized} Leave` : capitalized;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;


    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'financialType' && value === 'UNPAID') {
      setInsufficientLeave(false);
      setError(null);
    }

    if (name === 'leaveDuration') setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.fromDate && formData.toDate && new Date(formData.fromDate) > new Date(formData.toDate)) {
      setError('From date must be before To date');
      return;
    }

    if (!formData.leaveDuration || formData.leaveDuration <= 0) {
      setError('Leave duration must be greater than 0');
      return;
    }

    if (insufficientLeave && formData.financialType === 'PAID') {
      setError('Please select UNPAID leave to proceed.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (formData.leaveId) {
        await leaveService.updateLeave(formData, attachment);
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Leave updated successfully!',
          confirmButtonText: 'OK',
          allowOutsideClick: false,
        });
      } else {
        await leaveService.applyLeave(formData, attachment);
        await Swal.fire({
          icon: 'success',
          title: 'Applied!',
          text: 'Leave applied successfully!',
          confirmButtonText: 'OK',
          allowOutsideClick: false,
        });
      }

      // Only redirect after user clicks OK
      router.push('/dashboard/leaves');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process leave request';
      await Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: msg,
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  }, [employeeId]);

  // Wait for employeeId (UUID) before rendering form
  if (loadingEmployee || !employeeId) {
    return (
      <div className="p-6 text-center">
        <p>Loading employee details...</p>
      </div>
    );
  }
  return (
    <div className="apply-leave-page p-6 max-w-2xl mx-auto">
      <div className="mb-10 flex items-center justify-between">
        <BackButton to="/dashboard/leaves" />
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {formData.leaveId ? 'Update Leave Request' : 'Apply for New Leave'}
        </h1>
        <div className="w-20" />
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        {/* Leave Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Leave Type</label>
          <select
            name="categoryType"
            value={formData.categoryType}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Leave Type</option>
            {categoryTypes.map((type) => (
              <option key={type} value={type}>
                {getLabel(type, true)}
              </option>
            ))}
          </select>
        </div>

        {/* Partial Day */}
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
            value={formData.leaveDuration || ''}
            onChange={handleInputChange}
            min="0.5"
            step="0.5"
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
            placeholder="Auto-calculated..."
            required
            readOnly
          />
          {(calculating || checkingAvailability) && (
            <p className="text-xs text-gray-500 mt-1">Calculating...</p>
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
            {financialTypes.map((type) => (
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="text-sm">{error}</p>
            {insufficientLeave && formData.financialType === 'PAID' && (
              <p className="text-xs mt-1">
                Please switch to <strong>UNPAID</strong> to continue.
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            loading ||
            calculating ||
            checkingAvailability ||
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
          ) : formData.leaveId ? (
            'Update Leave'
          ) : (
            'Apply Leave'
          )}
        </button>
      </form>
    </div>
  );
};

export default ApplyLeavePage;