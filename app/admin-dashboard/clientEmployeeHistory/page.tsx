'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { adminService } from '@/lib/api/adminService';

import {
  EmployeeClientHistoryDTO,
  ClientEmployeeHistoryDTO,
  EmployeeDTO,
  ClientDTO
} from '@/lib/api/types';

const Page = () => {
  /** Employee Tab State */
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeClientHistoryDTO[]>([]);

  /** Client Tab State */
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientHistory, setClientHistory] = useState<ClientEmployeeHistoryDTO[]>([]);
  const formatDate = (date?: string | null) => {
    return date ? new Date(date).toLocaleDateString() : '-';
  };
  const PAGE_SIZE = 10;
  const [employeePage, setEmployeePage] = useState(1);
  const [clientPage, setClientPage] = useState(1);
  
  const paginatedEmployeeHistory = React.useMemo(() => {
    const start = (employeePage - 1) * PAGE_SIZE;
    return employeeHistory.slice(start, start + PAGE_SIZE);
  }, [employeeHistory, employeePage]);

  const paginatedClientHistory = React.useMemo(() => {
    const start = (clientPage - 1) * PAGE_SIZE;
    return clientHistory.slice(start, start + PAGE_SIZE);
  }, [clientHistory, clientPage]);
  
  /* ---------------- Employee Tab ---------------- */

    useEffect(() => {
        adminService.getAllEmployees().then(res => {
        if (res.response) {
            setEmployees(res.response);
        }
        });
    }, []);
    
    useEffect(() => {
        if (!selectedEmployeeId) return; // important guard
    
        adminService
        .getEmployeeClientHistory(selectedEmployeeId)
        .then(res => {
            if (res.response) {
            setEmployeeHistory(res.response);
            }
        });
        setEmployeePage(1);
    }, [selectedEmployeeId]); //  only runs when employee changes
  
    /* ---------------- Client Tab ---------------- */

    useEffect(() => {
        adminService.getAllClients().then(res => {
        if (res.response) {
            setClients(res.response);
        }
        });
    }, []);
    
    useEffect(() => {
        if (!selectedClientId) return; //  important guard
    
        adminService
        .getClientEmployeeHistory(selectedClientId)
        .then(res => {
            if (res.response) {
            setClientHistory(res.response);
            }
        });
        setClientPage(1);
    }, [selectedClientId]); //  only runs when client changes
    

  return (
    <Tabs defaultValue="employee" className="w-full">

      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="employee">Employee</TabsTrigger>
        <TabsTrigger value="client">Client</TabsTrigger>
      </TabsList>

      {/* ================= Employee Tab ================= */}
      <TabsContent value="employee" className="mt-4 space-y-4">

        <Select onValueChange={setSelectedEmployeeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select Employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp.employeeId} value={emp.employeeId}>
                {emp.firstName} {emp.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedEmployeeId && employeeHistory.length === 0 && (
            <div className="border rounded-md p-4 text-center text-sm text-gray-500">
                No client found
            </div>
            )}

            {employeeHistory.length > 0 && (
            <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-base">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold">Client Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Onboard Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Billing Start Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Offboard Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Billing End Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Active</th>
                    </tr>
                    </thead>

                    <tbody>
                    {paginatedEmployeeHistory.map((item, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">{item.clientName}</td>
                        <td className="px-4 py-3">{formatDate(item.onboardDate)}</td>
                        <td className="px-4 py-3">{formatDate(item.billingStartDate)}</td>
                        <td className="px-4 py-3">{formatDate(item.offboardDate)}</td>
                        <td className="px-4 py-3">{formatDate(item.billingEndDate)}</td>
                        <td className="px-4 py-3">
                            <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                item.active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                            >
                            {item.active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div className="flex justify-between items-center p-3 border-t text-sm">
                    <span>
                        Page {employeePage} of {Math.ceil(employeeHistory.length / PAGE_SIZE)}
                    </span>

                    <div className="space-x-2">
                        <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={employeePage === 1}
                        onClick={() => setEmployeePage(p => p - 1)}
                        >
                        Previous
                        </button>

                        <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={employeePage >= Math.ceil(employeeHistory.length / PAGE_SIZE)}
                        onClick={() => setEmployeePage(p => p + 1)}
                        >
                        Next
                        </button>
                    </div>
                </div>
            </div>
            )}

      </TabsContent>

      {/* ================= Client Tab ================= */}
      <TabsContent value="client" className="mt-4 space-y-4">

        <Select onValueChange={setSelectedClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Select Client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map(client => (
              <SelectItem key={client.clientId} value={client.clientId}>
                {client.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedClientId && clientHistory.length === 0 && (
            <div className="border rounded-md p-4 text-center text-sm text-gray-500">
                No employee found
            </div>
            )}

            {paginatedClientHistory.length > 0 && (
            <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-base">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold">Employee Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Onboard Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Billing Start Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Offboard Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Billing End Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Active</th>
                    </tr>
                    </thead>


                    <tbody>
                    {paginatedClientHistory.map((item, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                            {item.firstName} {item.lastName}
                        </td>
                        <td className="px-4 py-3">{formatDate(item.onboardDate)}</td>
                        <td className="px-4 py-3">{formatDate(item.billingStartDate)}</td>
                        <td className="px-4 py-3">{formatDate(item.offboardDate)}</td>
                        <td className="px-4 py-3">{formatDate(item.billingEndDate)}</td>
                        <td className="px-4 py-3">
                            <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                item.active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                            >
                            {item.active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div className="flex justify-between items-center p-3 border-t text-sm">
                    <span>
                        Page {clientPage} of {Math.ceil(clientHistory.length / PAGE_SIZE)}
                    </span>

                    <div className="space-x-2">
                        <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={clientPage === 1}
                        onClick={() => setClientPage(p => p - 1)}
                        >
                        Previous
                        </button>

                        <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={clientPage >= Math.ceil(clientHistory.length / PAGE_SIZE)}
                        onClick={() => setClientPage(p => p + 1)}
                        >
                        Next
                        </button>
                    </div>
                </div>

            </div>
            )}

      </TabsContent>
    </Tabs>
  );
};

export default Page;
