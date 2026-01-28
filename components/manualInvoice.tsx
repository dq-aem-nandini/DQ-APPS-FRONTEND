"use client";
import React, { useEffect, useMemo, useState } from "react";
import { manualInvoiceService } from "@/lib/api/manualInvoiceService";
import {
  ClientMinDTO,
  EmployeeMinDTO,
  ManualInvoiceItemRequestDTO,
  ManualInvoiceRequestDTO,
  ClientEmployeeMinResponseDTO,
} from "@/lib/api/types";
 
import Swal from "sweetalert2";
 
const YEARS = [2025, 2026, 2027, 2028, 2029];
 
const MONTHS = [
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
];
 
function getBackendError(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}
 
export default function ManualInvoice() {
  const [clients, setClients] = useState<ClientMinDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeMinDTO[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'INR' | 'USD' | null>(null);
  const [clientId, setClientId] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [month, setMonth] = useState<number | "">("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
 
  const [items, setItems] = useState<
    Record<string, { hoursWorked: number; description: string }>
  >({});
 
  const today = new Date().toISOString().split("T")[0];
 
  const minDueDate = useMemo(() => {
    if (!year || !month) return today;
    const y = Number(year);
    const m = Number(month);
    let nextM = m + 1;
    let nextY = y;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    return `${nextY}-${String(nextM).padStart(2, "0")}-01`;
  }, [year, month]);
 
  const [dueDate, setDueDate] = useState(today);
 
  useEffect(() => {
    if (dueDate < minDueDate) setDueDate(minDueDate);
  }, [minDueDate]);
 
  useEffect(() => {
    async function loadClients() {
      try {
        const res = await manualInvoiceService.getAllClientsMin();
        setClients(res.response ?? []);
      } catch (e: any) {
        Swal.fire({ icon: "error", title: "Error", text: getBackendError(e) });
      }
    }
    loadClients();
  }, []);
 
  useEffect(() => {
    if (!clientId) {
      setEmployees([]);
      setItems({});
      return;
    }
 
    async function loadEmployees() {
      try {
        const res = await manualInvoiceService.getEmployeesByClientId(clientId);
    
        const data: ClientEmployeeMinResponseDTO | null = Array.isArray(res.response) ? res.response[0] : res.response ?? null;
        if (!data) return;
    
        setCurrency(data.currency);          // ✅ currency
        setEmployees(data.employees);        // ✅ employees array
    
        const initialItems: Record<
          string,
          { hoursWorked: number; description: string }
        > = {};
    
        data.employees.forEach((e) => {
          initialItems[e.employeeId] = {
            hoursWorked: 0,
            description: "",
          };
        });
    
        setItems(initialItems);
      } catch (e: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: getBackendError(e),
        });
      }
    }
    
    loadEmployees();
  }, [clientId]);
 
  const generateInvoice = async () => {
    setApiError(null);
 
    if (!clientId || !year || !month
      //  || !invoiceNumber.trim()
      )
        {
      Swal.fire({ icon: "warning", title: "Missing Fields", text: "Please fill all required fields." });
      return;
    }
 
    const invoiceItems: ManualInvoiceItemRequestDTO[] = employees
      .filter((e) => e.rateCard != null && (items[e.employeeId]?.hoursWorked ?? 0) > 0)
      .map((e) => ({
        employeeId: e.employeeId,
        hoursWorked: items[e.employeeId].hoursWorked,
        ratePerHour: e.rateCard!,
        description: items[e.employeeId].description.trim(),
      }));
 
    if (invoiceItems.length === 0) {
      Swal.fire({ icon: "warning", title: "No Hours", text: "Please enter hours for at least one employee." });
      return;
    }
 
    const payload: ManualInvoiceRequestDTO = {
      clientId,
      year: Number(year),
      month: Number(month),
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate: today,
      dueDate,
      items: invoiceItems,
    };
 
    try {
      await manualInvoiceService.generateManualInvoice(payload);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Invoice generated successfully",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e: any) {
      const msg = getBackendError(e);
      setApiError(msg);
      Swal.fire({ icon: "error", title: "Failed", text: msg });
    }
  };
 
  const isFormValid = useMemo(() => {
    if (!clientId || !year || !month 
      // || !invoiceNumber.trim()
    ) return false;
 
    return employees.some(
      (emp) =>
        emp.rateCard != null &&
        (items[emp.employeeId]?.hoursWorked ?? 0) > 0
    );
  }, [clientId, year, month,
    //  invoiceNumber, 
     employees, items]);
 
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100/80 overflow-hidden">
 
        {/* Heading */}
        <div className="px-8 py-8 border-b border-slate-100">
          <h1 className="text-3xl md:text-3.5xl font-semibold text-indigo-700 tracking-tight">
            Generate Manual Invoice
          </h1>
        </div>
 
        <div className="p-6 md:p-9 lg:p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Client <span className="text-teal-600">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none transition cursor-pointer"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.clientId} value={c.clientId}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
 
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Invoice Month <span className="text-teal-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
                  className="border border-slate-200 rounded-lg px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none cursor-pointer"
                >
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : "")}
                  className="border border-slate-200 rounded-lg px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none cursor-pointer"
                >
                  <option value="">Month</option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
 
            {/* <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Invoice Number <span className="text-teal-600">*</span>
              </label>
              <input
                className={`w-full border ${apiError ? "border-rose-400 ring-1 ring-rose-200" : "border-slate-200"} rounded-lg px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none transition`}
                placeholder="INV-0825-001"
                value={invoiceNumber}
                onChange={(e) => { setInvoiceNumber(e.target.value); setApiError(null); }}
              />
            </div> */}
 
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Due Date <span className="text-teal-600">*</span>
              </label>
              <input
                type="date"
                min={minDueDate}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
 
          {apiError && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-800 text-sm">
              {apiError}
            </div>
          )}
 
          {employees.length > 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-medium text-slate-800">Employees</h2>
 
              <div className="overflow-x-auto border border-slate-100 rounded-lg shadow-sm">
                <table className="w-full border-collapse min-w-[960px]">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-3.5 text-left font-medium">Employee</th>
                      <th className="px-6 py-3.5 text-left font-medium">Company ID</th>
                      {/* <th className="px-6 py-3.5 text-right font-medium">Rate/hr</th> */}
                      <th className="px-6 py-3.5 text-right font-medium">
                        Rate / hr {currency && `(${currency})`}</th>
                      <th className="px-6 py-3.5 text-right font-medium">Hours</th>
                      <th className="px-6 py-3.5 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {employees.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-teal-50/20 transition-colors">
                        <td className="px-6 py-3.5">{emp.employeeName}</td>
                        <td className="px-6 py-3.5 text-slate-600">{emp.companyId || "—"}</td>
                        <td className="px-6 py-3.5 text-right font-medium">
                          {emp.rateCard != null ? (
                            `${emp.rateCard.toFixed(2)}`
                          ) : (
                            <span className="text-rose-600 text-sm">Missing</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <input
                            type="number"
                            min={0}
                            step={0.25}
                            className="w-20 border border-slate-200 rounded px-3 py-1.5 text-right focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none"
                            value={items[emp.employeeId]?.hoursWorked ?? ""}
                            onChange={(e) =>
                              setItems((prev) => ({
                                ...prev,
                                [emp.employeeId]: {
                                  ...prev[emp.employeeId],
                                  hoursWorked: Number(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </td>
                        <td className="px-6 py-3.5">
                          <input
                            className="w-full border border-slate-200 rounded px-3 py-1.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none"
                            placeholder="Project / remarks"
                            value={items[emp.employeeId]?.description ?? ""}
                            onChange={(e) =>
                              setItems((prev) => ({
                                ...prev,
                                [emp.employeeId]: {
                                  ...prev[emp.employeeId],
                                  description: e.target.value,
                                },
                              }))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
 
          <div className="flex justify-end pt-6">
            <button
              onClick={generateInvoice}
              disabled={!isFormValid}
              className={`
                px-10 py-3 rounded-xl font-medium text-base transition-all duration-200 shadow-sm
                ${isFormValid
                  ? "bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white cursor-pointer hover:scale-105 active:scale-98 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"}
              `}
            >
              Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}