import api from './axios';
import {
  EmployeeModel,
  ClientModel,
  WebResponseDTOEmployeeDTO,
  WebResponseDTOListEmployeeDTO,
  WebResponseDTOClientDTO,
  WebResponseDTOListClientDTO,
  WebResponseDTOString,
  WebResponseDTOClient,
  WebResponseDTOListString,
  WebResponseDTOEmployee,
  WebResponseDTOTimeSheetResponseDto,
  WebResponseDTOListTimeSheetResponseDto,
  EmployeeDTO,
  WebResponseDTO,
  Designation,
  ClientDTO,
} from './types';
import { AxiosResponse } from 'axios';

class AdminService {
  // ✅ Add client
  async addClient(client: ClientModel): Promise<WebResponseDTOClient> {
    try {
      const response: AxiosResponse<WebResponseDTOClient> = await api.post(
        '/admin/add/client',
        client
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add client: ${error}`);
    }
  }

  // ✅ Add employee
  async addEmployee(employee: EmployeeModel): Promise<WebResponseDTOEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOEmployeeDTO> = await api.post(
        '/admin/add/employee',
        employee
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add employee: ${error}`);
    }
  }

  // ✅ Update client
  async updateClient(clientId: string, clientModel: ClientModel): Promise<WebResponseDTOString> {
    console.log(`📝 [updateClient] Updating client with ID: ${clientId}`);
    console.log('📤 [updateClient] Payload:', clientModel);

    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.put(
        `/admin/updateclient/${clientId}`,
        clientModel
      );
      console.log('✅ [updateClient] API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [updateClient] Failed to update client:', error?.message || error);
      throw new Error(`Failed to update client: ${error}`);
    }
  }

  // ✅ Update employee
  // async updateEmployee(empId: string, employee: EmployeeModel): Promise<WebResponseDTOString> {
  //   try {
  //     const payload = {
  //       ...employee,
  //       employeeEquipmentDTO: Array.isArray(employee.employeeEquipmentDTO)
  //         ? employee.employeeEquipmentDTO[0]
  //         : employee.employeeEquipmentDTO || null,
  //       employeeAdditionalDetailsDTO: Array.isArray(employee.employeeAdditionalDetailsDTO)
  //         ? employee.employeeAdditionalDetailsDTO[0]
  //         : employee.employeeAdditionalDetailsDTO || null,
  //     };

  //     const response: AxiosResponse<WebResponseDTOString> = await api.put(
  //       `/admin/updateemp/${empId}`,
  //       payload
  //     );
  //     return response.data;
  //   } catch (error) {
  //     throw new Error(`Failed to update employee: ${error}`);
  //   }
  // }
  // ✅ Update employee
async updateEmployee(empId: string, employee: EmployeeModel): Promise<WebResponseDTOString> {
  try {
    const payload = {
      ...employee,
    };

    const response: AxiosResponse<WebResponseDTOString> = await api.put(
      `/admin/updateemp/${empId}`,
      payload
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update employee: ${error}`);
  }
}

  // ✅ Delete client by ID
  async deleteClientById(clientId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(`/admin/client/${clientId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete client: ${error}`);
    }
  }

  // ✅ Delete employee by ID
  async deleteEmployeeById(empId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(`/admin/${empId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete employee: ${error}`);
    }
  }

  // ✅ Get client by ID
  async getClientById(clientId: string): Promise<WebResponseDTOClientDTO> {
    console.log(`🔍 [getClientById] Fetching client details for ID: ${clientId}`);
    try {
      const response: AxiosResponse<WebResponseDTOClientDTO> = await api.get(`/admin/client/${clientId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ [getClientById] Failed:', error);
      throw new Error(`Failed to get client by ID: ${error}`);
    }
  }

  // ✅ Get all clients
  async getAllClients(): Promise<WebResponseDTOListClientDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListClientDTO> = await api.get('/admin/client/all');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get all clients: ${error}`);
    }
  }

  // ✅ Get employee by ID
  async getEmployeeById(empId: string): Promise<WebResponseDTOEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOEmployeeDTO> = await api.get(`/admin/emp/${empId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get employee by ID: ${error}`);
    }
  }

  // ✅ Get all employees
  async getAllEmployees(): Promise<WebResponseDTOListEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListEmployeeDTO> = await api.get('/admin/emp/all');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get all employees: ${error}`);
    }
  }

  // ✅ Get manager’s employees
  async getAllManagerEmployees(): Promise<WebResponseDTOListEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListEmployeeDTO> = await api.get('/employee/manager/employees');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get all employees: ${error}`);
    }
  }

  // ✅ Get employees by designation
  async getEmployeesByDesignation(designation: Designation): Promise<EmployeeDTO[]> {
    try {
      const response: AxiosResponse<WebResponseDTOListEmployeeDTO> = await api.get(`/employee/designation/${designation}`);
      if (response.data.flag && Array.isArray(response.data.response)) {
        return response.data.response;
      }
      throw new Error(response.data.message || 'Failed to get employees by designation');
    } catch (error) {
      console.error('❌ Error fetching employees by designation:', error);
      throw new Error(`Failed to get employees by designation: ${error}`);
    }
  }

  // ✅ Unassign employee from client
  async unassignEmployeeFromClient(empId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.patch(`/admin/emp/${empId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to unassign employee: ${error}`);
    }
  }

  // ✅ Get all admin names
  async getAllAdminNames(): Promise<WebResponseDTOListString> {
    try {
      const response: AxiosResponse<WebResponseDTOListString> = await api.get('/admin/getAllAdminNames');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get all admin names: ${error}`);
    }
  }

  // ✅ Upload file
  async uploadFile(file: File): Promise<WebResponseDTO<string>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response: AxiosResponse<WebResponseDTO<string>> = await api.post('/admin/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  // ✅ DELETE: Employee Address
  async deleteEmployeeAddress(entityId: string, addressId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/delete/${entityId}/address/${addressId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete employee address: ${error}`);
    }
  }

  // ✅ DELETE: Employee Document
  async deleteEmployeeDocument(employeeId: string, documentId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/delete/employee/${employeeId}/document/${documentId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete employee document: ${error}`);
    }
  }
  // Delete employee equipment info by equipmentId
  async deleteEmployeeEquipmentInfo(equipmentId: string): Promise<WebResponseDTOString> {
    console.log(`🗑️ [deleteEmployeeEquipmentInfo] Deleting employee equipment with ID: ${equipmentId}`);

    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/delete/employee/equipment/${equipmentId}`
      );

      console.log("✅ [deleteEmployeeEquipmentInfo] API Response:", response.data);

      return response.data;
    } catch (error: any) {
      console.error("❌ [deleteEmployeeEquipmentInfo] Failed to delete employee equipment:", error?.message || error);
      if (error.response) {
        console.error("🚨 [deleteEmployeeEquipmentInfo] Server Error Response:", error.response.data);
        console.error("🔗 [deleteEmployeeEquipmentInfo] Endpoint:", error.config?.url);
        console.error("📄 [deleteEmployeeEquipmentInfo] Status Code:", error.response.status);
      }
      throw new Error(`Failed to delete employee equipment info: ${error}`);
    }
  }

  // ✅ DELETE: Client Tax Details
  async deleteClientTaxDetails(clientId: string, taxId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/delete/client/${clientId}/taxDetails/${taxId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete client tax details: ${error}`);
    }
  }

  // ✅ DELETE: Client POC Details
  async deleteClientPocDetails(clientId: string, pocId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/delete/client/${clientId}/pocDetails/${pocId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete client POC details: ${error}`);
    }
  }
}

export const adminService = new AdminService();
