// lib/api/adminService.ts
import api from './axios';
import { EmployeeModel, ClientModel, WebResponseDTO, EmployeeDTO, ClientDTO } from './types';

export const adminService = {
  // Employee Operations
  async addEmployee(employeeModel: EmployeeModel): Promise<EmployeeDTO> {
    const params = new URLSearchParams();
    Object.keys(employeeModel).forEach(key => {
      params.append(key, (employeeModel as any)[key]);
    });
    const response = await api.post<WebResponseDTO<EmployeeDTO>>(`/admin/add/employee?${params.toString()}`);
    if (response.data.flag) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to add employee');
  },

  async getAllEmployees(): Promise<EmployeeDTO[]> {
    const response = await api.get<WebResponseDTO<EmployeeDTO[]>>('/admin/emp/all');
    if (response.data.flag) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to fetch employees');
  },

  async getEmployeeById(empId: string): Promise<EmployeeDTO> {
    const response = await api.get<WebResponseDTO<EmployeeDTO>>(`/admin/emp/${empId}`);
    if (response.data.flag) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to fetch employee');
  },

  async updateEmployee(empId: string, employeeModel: EmployeeModel): Promise<string> {
    const params = new URLSearchParams();
    Object.keys(employeeModel).forEach(key => {
      params.append(key, (employeeModel as any)[key]);
    });
    const response = await api.put<WebResponseDTO<string>>(`/admin/updateemp/${empId}?${params.toString()}`);
    if (response.data.flag) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to update employee');
  },

  async deleteEmployee(empId: string): Promise<string> {
    const response = await api.delete<WebResponseDTO<string>>(`/admin/${empId}`);
    if (response.data.flag) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to delete employee');
  },

  // Client Operations
  async addClient(clientModel: ClientModel): Promise<ClientDTO> {
    const params = new URLSearchParams();
    Object.keys(clientModel).forEach(key => {
      params.append(key, (clientModel as any)[key]);
    });
    const response = await api.post<WebResponseDTO<ClientDTO>>(`/admin/add/client?${params.toString()}`);
    if (response.data.flag) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to add client');
  },

  async getAllClients(): Promise<ClientDTO[]> {
    const response = await api.get<WebResponseDTO<ClientDTO[]>>('/admin/client/all');
    if (response.data.flag) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to fetch clients');
  },

  async getClientById(clientId: string): Promise<ClientDTO> {
    const response = await api.get<WebResponseDTO<ClientDTO>>(`/admin/client/${clientId}`);
    if (response.data.flag) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to fetch client');
  },

  async updateClient(clientId: string, clientModel: ClientModel): Promise<string> {
    const params = new URLSearchParams();
    Object.keys(clientModel).forEach(key => {
      params.append(key, (clientModel as any)[key]);
    });
    const response = await api.put<WebResponseDTO<string>>(`/admin/updateclient/${clientId}?${params.toString()}`);
    if (response.data.flag) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to update client');
  },

  async deleteClient(clientId: string): Promise<string> {
    const response = await api.delete<WebResponseDTO<string>>(`/admin/client/${clientId}`);
    if (response.data.flag) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to delete client');
  },

  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post<WebResponseDTO<{ url: string }>>('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.flag) {
        return response.data.response.url;
      }
      throw new Error(response.data.message || 'Failed to upload file');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  },
};