"use client";

import React, { useEffect, useMemo, useState } from "react";
import { manualInvoiceService } from "@/lib/api/manualInvoiceService";
import {
  ClientMinDTO,
  EmployeeMinDTO,
  ManualInvoiceItemRequestDTO,
  ManualInvoiceRequestDTO,
} from "@/lib/api/types";

import { toast } from "sonner";
const YEARS = [2025, 2026, 2027, 2028];
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
    error?.response?.data?.response ||
    error?.response?.data ||
    error?.message ||
    "Something went wrong"
  );
}

export default function ManualInvoice() {
  /* -------------------- State -------------------- */

  const [clients, setClients] = useState<ClientMinDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeMinDTO[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [month, setMonth] = useState<number | "">("");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<
  Record<
    string,
    { hoursWorked: number; description: string }
  >
>({});


  /* -------------------- Defaults -------------------- */

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const due = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    setInvoiceDate(today);
    setDueDate(due);
  }, []);

  /* -------------------- Load Clients -------------------- */

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await manualInvoiceService.getAllClientsMin();
        setClients(res.response ?? []);
      } catch (e: any) {
        toast.error(e.message);
      }
    }
    loadClients();
  }, []);

  /* -------------------- Load Employees -------------------- */

  useEffect(() => {
    if (!clientId) return;
  
    async function loadEmployees() {
      try {
        const res = await manualInvoiceService.getEmployeesByClientId(clientId);
        const empList = res.response ?? [];
        setEmployees(empList);
  
        // initialize hours + description
        const initialItems: Record<string, { hoursWorked: number; description: string }> = {};
        empList.forEach((e) => {
          initialItems[e.employeeId] = {
            hoursWorked: 0,
            description: "",
          };
        });
  
        setItems(initialItems);
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  
    loadEmployees();
  }, [clientId]);
  

  /* -------------------- Add / Remove Rows -------------------- */

  // const addRow = () => {
  //   setItems([
  //     ...items,
  //     {
  //       employeeId: "",
  //       hoursWorked: 0,
  //       ratePerHour: 0,
  //       description: "",
  //     },
  //   ]);
  // };

  // const removeRow = (index: number) => {
  //   setItems(items.filter((_, i) => i !== index));
  // };

  // const updateItem = (
  //   index: number,
  //   field: keyof ManualInvoiceItemRequestDTO,
  //   value: any
  // ) => {
  //   const updated = [...items];
  //   updated[index] = { ...updated[index], [field]: value };
  //   setItems(updated);
  // };

  /* -------------------- Generate Invoice -------------------- */

  const generateInvoice = async () => {
    setApiError(null);

    if (!clientId || !year || !month || !invoiceNumber) {
      toast.error("Please fill all mandatory fields");
      return;
    }
  
    const invoiceItems: ManualInvoiceItemRequestDTO[] = employees
      .filter(
        (emp) =>  
          emp.rateCard != null &&
          items[emp.employeeId]?.hoursWorked > 0
      )
      .map((emp) => ({
        employeeId: emp.employeeId,
        hoursWorked: items[emp.employeeId].hoursWorked,
        ratePerHour: emp.rateCard!,
        description: items[emp.employeeId].description,
      }));
  
    if (invoiceItems.length === 0) {
      toast.error("Enter hours for at least one employee");
      return;
    }
  
    const payload: ManualInvoiceRequestDTO = {
      clientId,
      year: Number(year),
      month: Number(month),
      invoiceNumber,
      invoiceDate,
      dueDate,
      items: invoiceItems,
    };
  
    try {
      await manualInvoiceService.generateManualInvoice(payload);
      toast.success("Manual invoice generated successfully");
    } catch (e: any) {
      const errorMsg = getBackendError(e);
      setApiError(errorMsg);
    }
  };
  

  /* -------------------- UI -------------------- */

  const isFormValid = useMemo(() => {
    if (!clientId || !year || !month || !invoiceNumber) return false;
  
    return employees.some(
      (emp) =>
        emp.rateCard != null &&
        items[emp.employeeId]?.hoursWorked > 0
    );
  }, [clientId, year, month, invoiceNumber, employees, items]);
  

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Generate Manual Invoice</h1>

      {/* Client */}
      <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
        <option value="">Select Client</option>
        {clients.map((c) => (
          <option key={c.clientId} value={c.clientId}>
            {c.companyName}
          </option>
        ))}
      </select>

      {/* Year & Month */}
      <div className="flex gap-4">
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">
          Invoice Month <span className="text-red-500">*</span>
        </label>

        <div className="flex gap-2">
          <select
            className="border px-3 py-2 rounded"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            <option value="">Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className="border px-3 py-2 rounded"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            <option value="">Month</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>


       {/* Invoice Header */}
      <div className="flex gap-6">
        {/* <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">
            Invoice Number <span className="text-red-500">*</span>
          </label>
          <input
            className="border px-3 py-2 rounded"
            placeholder="INV-001"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div> */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">
            Invoice Number <span className="text-red-500">*</span>
          </label>

          <input
            className={`border px-3 py-2 rounded ${
              apiError ? "border-red-500" : ""
            }`}
            placeholder="INV-001"
            value={invoiceNumber}
            onChange={(e) => {
              setInvoiceNumber(e.target.value);
              setApiError(null); // clear error on change
            }}
          />

          {apiError && (
            <span className="text-sm text-red-600 mt-1">{apiError}</span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">
            Invoice Date
          </label>
          <input
            type="date"
            className="border px-3 py-2 rounded bg-gray-100 cursor-not-allowed"
            value={invoiceDate}
            disabled
          />
        </div>


        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">
            Due Date
          </label>
          <input
            type="date"
            className="border px-3 py-2 rounded"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>


      {/* Employees Table */}
      {employees.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Employees</h2>

          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">Employee Name</th>
                <th className="border px-3 py-2">Company ID</th>
                <th className="border px-3 py-2 text-right">Rate / Hour</th>
                <th className="border px-3 py-2 text-right">Hours Worked</th>
                <th className="border px-3 py-2">Description</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((emp) => (
                <tr key={emp.employeeId}>
                  <td className="border px-3 py-2">{emp.employeeName}</td>
                  <td className="border px-3 py-2">{emp.companyId}</td>

                  <td className="border px-3 py-2 text-right">
                    {emp.rateCard != null ? `${emp.rateCard.toFixed(2)}` : (
                      <span className="text-red-500">Not Set</span>
                    )}
                  </td>

                  <td className="border px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      className="w-24 border px-2 py-1"
                      value={items[emp.employeeId]?.hoursWorked ?? 0}
                      onChange={(e) =>
                        setItems((prev) => ({
                          ...prev,
                          [emp.employeeId]: {
                            ...prev[emp.employeeId],
                            hoursWorked: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </td>

                  <td className="border px-3 py-2">
                    <input
                      className="w-full border px-2 py-1"
                      placeholder="Work description"
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
      )}

      <button
        onClick={generateInvoice}
        disabled={!isFormValid}
        className={`px-6 py-2 rounded-md font-medium transition duration-200
          ${
            isFormValid
              ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
      >
        Generate Manual Invoice
      </button>


    </div>
  );
}
