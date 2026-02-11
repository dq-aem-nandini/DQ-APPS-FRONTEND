'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    ClientMinDTO,
    EmployeeMinDTO,
    ClientEmployeeMinResponseDTO,
    HolidaysDTO,
    HolidaysModel,
    SuperHrHolidayRequestDTO,
    HolidayDTO,
  } from "@/lib/api/types";

import { manualInvoiceService } from '@/lib/api/manualInvoiceService';
import Swal from "sweetalert2";
import { Button } from '@/components/ui/button';
import { Plus, Loader2,} from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { holidayService } from '@/lib/api/holidayService';
import {superHrHolidayService} from '@/lib/api/superHrHolidayService';
import { toast } from 'sonner';

function getBackendError(error: any): string {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.response ||
      error?.response?.data ||
      error?.message ||
      "Something went wrong"
    );
  }

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

export default function addHoliday() {
    const [clientId, setClientId] = useState("");
    const { state } = useAuth();
    const role = state.user?.role.roleName;
    const [clients, setClients] = useState<ClientMinDTO[]>([]);
    const [employees, setEmployees] = useState<EmployeeMinDTO[]>([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [editingHoliday, setEditingHoliday] = useState<HolidaysDTO | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [holidays, setHolidays] = useState<HolidayDTO[]>([]);
    const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedHolidayName, setSelectedHolidayName] = useState<string>("");
    const [isCustomHoliday, setIsCustomHoliday] = useState(false);
    const [formData, setFormData] = useState<HolidaysModel>({
        holidayName: '',
        holidayDate: '',
        comments: '',
      });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const toggleEmployee = (emp: EmployeeMinDTO) => {
      setSelectedEmployeeIds(prev =>
        prev.includes(emp.employeeId)
          ? prev.filter(id => id !== emp.employeeId)
          : [...prev, emp.employeeId]
      );
    };
    const payload: SuperHrHolidayRequestDTO = {
      holidayName: formData.holidayName.trim(),
      holidayDate: formData.holidayDate,
      employeeIds: selectedEmployeeIds,
    };
    const isAddDisabled =  selectedEmployeeIds.length === 0;
    const getSelectedHolidayObjects = () =>
      holidays.filter(h => selectedHolidays.includes(h.holidayId));
    
      // Open dialog for add/edit
  const openDialog = async (holiday?: HolidaysDTO) => {
    if (holiday) {
      try {
        const res = await holidayService.getHolidayById(holiday.holidayId);
        if (res.flag && res.response) {
          setEditingHoliday(res.response);
          setFormData({
            holidayName: res.response.holidayName,
            holidayDate: res.response.holidayDate,
            comments: res.response.comments || '',
          });
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load holiday');
        return;
      }
    } else {
      setEditingHoliday(null);
      setFormData({ holidayName: '', holidayDate: '', comments: '' });
    }
    setIsDialogOpen(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!formData.holidayName.trim() || !formData.holidayDate) {
      await Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Holiday name and date are required',
      });
      return;
    }
  
    if (selectedEmployeeIds.length === 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select at least one employee',
      });
      return;
    }
  
    try {
      setSubmitting(true);
  
     
  
      const res = await superHrHolidayService.addEmployeeHoliday(payload);
  
      if (res?.flag) {
        // ✅ 1. CLOSE ADD HOLIDAY DIALOG FIRST
        setIsDialogOpen(false);
  
        // small delay so dialog unmounts cleanly
        await new Promise(resolve => setTimeout(resolve, 150));
  
        // ✅ 2. SHOW SUCCESS ALERT
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Holiday added successfully',
          confirmButtonColor: '#7c3aed',
        });
  
        // ✅ 3. RESET STATE
        setFormData({
          holidayName: '',
          holidayDate: '',
          comments: '',
        });
        setSelectedEmployeeIds([]);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res?.message || 'Failed to add holiday',
        });
      }
    } catch (err: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: getBackendError(err),
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  
      useEffect(() => {
        if (role !== 'SUPER_HR') return; 
      
        async function loadClients() {
          try {
            const res = await manualInvoiceService.getAllClientsMin();
            setClients(res.response ?? []);
          } catch (e: any) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: getBackendError(e),
            });
          }
        }
      
        loadClients();
      }, [role]);
    
      useEffect(() => {
        if (role !== 'SUPER_HR' || !clientId) {
          setEmployees([]);
          return;
        }
      
        async function loadEmployees() {
          try {
            const res = await manualInvoiceService.getEmployeesByClientId(clientId);
            const data: ClientEmployeeMinResponseDTO | null = Array.isArray(res.response) ? res.response[0] : res.response ?? null;
            setEmployees(data?.employees ?? []);
          } catch (e: any) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: getBackendError(e),
            });
          }
        }
      
        loadEmployees();
      }, [role, clientId]);

      const fetchHolidays = async () => {
        try {
          setLoading(true);
          const res = await superHrHolidayService.getAllHolidays();
          setHolidays(res.response || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchHolidays();
      }, [clientId]);
    
      const toggleHoliday = (holidayId: string) => {
        setSelectedHolidays(prev =>
          prev.includes(holidayId)
            ? prev.filter(id => id !== holidayId)
            : [...prev, holidayId]
        );
      };
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border space-y-6">
      <div className="grid grid-cols-1  gap-6">
        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Client <span className="text-teal-600">*</span>
          </label>

          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              // setSelectedEmployee(null); // reset employee on client change 
              setSelectedEmployeeIds([]);
            }}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5
                      focus:border-teal-400 focus:ring-2 focus:ring-teal-100
                      focus:outline-none transition cursor-pointer"
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.clientId} value={c.clientId}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
        {/* Employee Selection */}
        <div>
            {/* Employee Selection — Checkbox List */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Employees <span className="text-teal-600">*</span>
            </label>

            {!clientId && (
              <div className="text-sm text-slate-500">Select client first</div>
            )}

            {clientId && employees.length === 0 && (
              <div className="text-sm text-slate-500">No employees found</div>
            )}

            {clientId && employees.length > 0 && (
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2">
                {employees.map(emp => (
                  <label
                    key={emp.employeeId}
                    className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(emp.employeeId)}
                      onChange={() => toggleEmployee(emp)}
                      className="h-4 w-4 accent-teal-600 cursor-pointer"
                    />

                    <div className="text-sm">
                      <div className="font-medium text-slate-800">
                        {emp.employeeName}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      {selectedEmployeeIds.length === 0 && (
        <p className="text-sm text-red-500 mt-1">
          Please select at least one employee
        </p>
      )}

      </div>
       {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Holiday Calendar
            </h1>
            <p className="text-gray-600 mt-2">
              Manage all company holidays
            </p>
          </div>

          <Button
                  onClick={async () => {
                    // CASE 1: Holidays selected → assign holidays
                    if (selectedHolidays.length > 0) {
                      if (selectedEmployeeIds.length === 0) {
                        Swal.fire({
                          icon: 'error',
                          title: 'Validation Error',
                          text: 'Please select at least one employee',
                        });
                        return;
                      }

                      try {
                        setSubmitting(true);

                        const selectedHolidayObjects = getSelectedHolidayObjects();

                        // 🔁 Assign each selected holiday
                        for (const holiday of selectedHolidayObjects) {
                          const payload: SuperHrHolidayRequestDTO = {
                            holidayName: holiday.holidayName,
                            holidayDate: holiday.holidayDate,
                            employeeIds: selectedEmployeeIds,
                          };

                          await superHrHolidayService.addEmployeeHoliday(payload);
                        }

                        await Swal.fire({
                          icon: 'success',
                          title: 'Success',
                          text: 'Holiday assigned successfully',
                          confirmButtonColor: '#7c3aed',
                        });

                        // reset selection
                        setSelectedHolidays([]);
                      } catch (err: any) {
                        Swal.fire({
                          icon: 'error',
                          title: 'Error',
                          text: getBackendError(err),
                        });
                      } finally {
                        setSubmitting(false);
                      }

                      return;
                    }

                    // CASE 2: No holiday selected → normal add flow
                    openDialog();
                  }}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg cursor-pointer"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {selectedHolidays.length > 0 ? 'Assign Holiday' : 'Add Holiday'}
                </Button>
        </div>
      </div>

      {/* Holiday List */} 
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {loading && (
          <p className="text-gray-500">Loading holidays...</p>
        )}

        {!loading && holidays.length === 0 && (
          <p className="text-gray-500">No holidays found</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {holidays.map(holiday => (
            <label
              key={holiday.holidayId}
              className="flex items-center justify-between p-4 rounded-xl border hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedHolidays.includes(holiday.holidayId)}
                  onChange={() => toggleHoliday(holiday.holidayId)}
                  className="w-5 h-5 accent-purple-600"
                />

                <div>
                  <p className="font-semibold text-gray-800">
                    {holiday.holidayName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {holiday.holidayDate}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div>
                <Label>Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.holidayDate}
                  onChange={e => setFormData(prev => ({ ...prev, holidayDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Holiday Name <span className="text-red-500">*</span></Label>

                {/* Dropdown */}
                <select
                  value={selectedHolidayName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedHolidayName(value);

                    if (value === "OTHER") {
                      setIsCustomHoliday(true);
                      setFormData(prev => ({ ...prev, holidayName: "" }));
                    } else {
                      setIsCustomHoliday(false);
                      setFormData(prev => ({ ...prev, holidayName: value }));
                    }
                  }}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5
                            focus:border-purple-400 focus:ring-2 focus:ring-purple-100
                            focus:outline-none transition"
                  required
                >
                  <option value="">Select Holiday</option>

                  {holidays.map(h => (
                    <option key={h.holidayId} value={h.holidayName}>
                      {h.holidayName}
                    </option>
                  ))}

                  <option value="OTHER">Other</option>
                </select>

                {/* Show input if OTHER selected */}
                {isCustomHoliday && (
                  <Input
                    className="mt-3"
                    placeholder="Enter custom holiday name"
                    value={formData.holidayName}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, holidayName: e.target.value }))
                    }
                    required
                  />
                )}
              </div>

              <div>
                <Label>Comments (Optional)</Label>
                <Textarea
                  value={formData.comments}
                  onChange={e => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Any notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                {/* <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button> */}
                

                <Button
                  type="submit"
                  disabled={isAddDisabled || submitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingHoliday ? 'Update' : 'Add'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
     </div> 
)
}