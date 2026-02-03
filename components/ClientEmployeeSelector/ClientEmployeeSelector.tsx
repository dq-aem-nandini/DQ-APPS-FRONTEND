'use client';

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { manualInvoiceService } from '@/lib/api/manualInvoiceService';
import {
  ClientMinDTO,
  EmployeeMinDTO,
  ClientEmployeeMinResponseDTO,  
} from '@/lib/api/types';
import { useAuth } from '@/context/AuthContext';

interface Props {
  clientId: string;
  employeeId: string | null;
  onClientChange: (clientId: string) => void;
  onEmployeeChange: (
    employeeId: string | null,
    employee: EmployeeMinDTO | null,
    joiningDate: dayjs.Dayjs | null
  ) => void;
}

function getBackendError(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.response ||
    error?.response?.data ||
    error?.message ||
    'Something went wrong'
  );
}

const ClientEmployeeSelector: React.FC<Props> = ({
  clientId,
  employeeId,
  onClientChange,
  onEmployeeChange,
}) => {
  const { state } = useAuth();
  const role = state.user?.role.roleName;

  const [clients, setClients] = useState<ClientMinDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeMinDTO[]>([]);

  // Load clients
  useEffect(() => {
    if (role !== 'SUPER_HR') return;

    manualInvoiceService
      .getAllClientsMin()
      .then(res => setClients(res.response ?? []))
      .catch(e =>
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: getBackendError(e),
        })
      );
  }, [role]);

  // Load employees when client changes
  useEffect(() => {
    if (role !== 'SUPER_HR' || !clientId) {
      setEmployees([]);
      return;
    }

    manualInvoiceService
      .getEmployeesByClientId(clientId)
      .then(res => {
        const data: ClientEmployeeMinResponseDTO | null =
          Array.isArray(res.response) ? res.response[0] : res.response ?? null;
        setEmployees(data?.employees ?? []);
      })
      .catch(e =>
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: getBackendError(e),
        })
      );
  }, [role, clientId]);

  if (role !== 'SUPER_HR') return null;

  return (
    <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Client <span className="text-teal-600">*</span>
          </label>

          <select
            value={clientId}
            onChange={e => {
              onClientChange(e.target.value);
              onEmployeeChange(null, null, null);
            }}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5"
          >
            <option value="">Select client</option>
            {clients.map(c => (
              <option key={c.clientId} value={c.clientId}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>

        {/* Employee */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Employee <span className="text-teal-600">*</span>
          </label>

          <select
            disabled={!clientId}
            value={employeeId || ''}
            onChange={e => {
              const empId = e.target.value || null;
              const emp = employees.find(x => x.employeeId === empId) || null;

              onEmployeeChange(
                empId,
                emp,
                emp?.dateOfJoining ? dayjs(emp.dateOfJoining) : null
              );
            }}
            className="w-full border rounded-lg px-4 py-2.5"
          >
            <option value="">
              {!clientId ? 'Select client first' : 'Select employee'}
            </option>

            {employees.map(emp => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.employeeName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ClientEmployeeSelector;
