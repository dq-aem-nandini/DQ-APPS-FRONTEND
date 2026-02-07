'use client';

import React, { useState, useEffect} from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    ClientMinDTO,
    EmployeeMinDTO,
    ClientEmployeeMinResponseDTO,
  } from "@/lib/api/types";

import { manualInvoiceService } from '@/lib/api/manualInvoiceService';
import Swal from "sweetalert2";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { superHrHolidayService} from '@/lib/api/superHrHolidayService';
import { Loader2, Eye, EyeOff } from 'lucide-react';

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
const changepasswordpage = () => {
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [clientId, setClientId] = useState("");
    const { state } = useAuth();
    const role = state.user?.role.roleName;
    const [clients, setClients] = useState<ClientMinDTO[]>([]);
    const [employees, setEmployees] = useState<EmployeeMinDTO[]>([]);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    const toggleEmployee = (emp: EmployeeMinDTO) => {
      setSelectedEmployeeIds(prev => {
        const isSelected = prev.includes(emp.employeeId);
    
        if (isSelected) {
          // remove password when unchecked
          setEmployeePasswords(p => {
            const copy = { ...p };
            delete copy[emp.employeeId];
            return copy;
          });
          return prev.filter(id => id !== emp.employeeId);
        }
    
        return [...prev, emp.employeeId];
      });
    };
    const togglePasswordVisibility = (employeeId: string) => {
      setVisiblePasswords(prev => ({
        ...prev,
        [employeeId]: !prev[employeeId],
      }));
    };
    
     
        const [employeePasswords, setEmployeePasswords] = useState<
        Record<string, string>
      >({});
      const [loading, setLoading] = useState(false);


      const handlePasswordChange = (employeeId: string, value: string) => {
        setEmployeePasswords(prev => ({
          ...prev,
          [employeeId]: value,
        }));
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


          const handleSubmitChangePassword = async () => {
            if (selectedEmployeeIds.length === 0) {
              Swal.fire({
                icon: "warning",
                title: "No employees selected",
                text: "Please select at least one employee",
              });
              return;
            }
          
            const payload = selectedEmployeeIds.map(employeeId => ({
              employeeId,
              password: employeePasswords[employeeId],
            }));
          
            const invalid = payload.find(p => !p.password || p.password.length < 6);
            if (invalid) {
              Swal.fire({
                icon: "error",
                title: "Invalid password",
                text: "All selected employees must have a valid password",
              });
              return;
            }
          
            try {
              setLoading(true);
          
              await superHrHolidayService.updateEmployeePasswords(payload);
          
              //  SUCCESS MESSAGE — PLACE IT HERE
              Swal.fire({
                icon: "success",
                title: "Success",
                text: "Passwords updated successfully",
              });
          
              // reset state after success
              setSelectedEmployeeIds([]);
              setEmployeePasswords({});
            } catch (e: any) {
              Swal.fire({
                icon: "error",
                title: "Failed",
                text: getBackendError(e),
              });
            } finally {
              setLoading(false);
            }
          };
          
          
  return (
    
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
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-3">
                {employees.map(emp => {
                  const isChecked = selectedEmployeeIds.includes(emp.employeeId);

                  return (
                    <div
                      key={emp.employeeId}
                      className="flex items-center gap-4 p-2 rounded hover:bg-slate-50"
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEmployee(emp)}
                        className="h-4 w-4 accent-teal-600 cursor-pointer"
                      />

                      {/* Employee name */}
                      <div className="w-40 text-sm font-medium text-slate-800">
                        {emp.employeeName}
                      </div>

                      {/* Password input with eye icon */}
                        <div className="relative flex-1">
                          <Input
                            type={visiblePasswords[emp.employeeId] ? "text" : "password"}
                            placeholder="New password"
                            disabled={!isChecked}
                            value={employeePasswords[emp.employeeId] || ""}
                            onChange={e =>
                              handlePasswordChange(emp.employeeId, e.target.value)
                            }
                            className="pr-10"
                          />

                          {isChecked && (
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(emp.employeeId)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            >
                              {visiblePasswords[emp.employeeId] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>

                    </div>
                  );
                })}
              </div>
            )}
            <Button
              className="w-full mt-4"
              disabled={loading || selectedEmployeeIds.length === 0}
              onClick={handleSubmitChangePassword}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Change Password"
              )}
            </Button>

          </div>

        </div>
      </div>
      {selectedEmployeeIds.length === 0 && (
        <p className="text-sm text-red-500 mt-1">
          Please select at least one employee
        </p>
      )}
      </div>
  )
}

export default changepasswordpage