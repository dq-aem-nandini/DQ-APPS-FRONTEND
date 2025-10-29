
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
  // Add client
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

  // Add employee
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

  // Update client
  // async updateClient(clientId: string, clientModel: ClientModel): Promise<WebResponseDTOString> {
  //   try {
  //     const response: AxiosResponse<WebResponseDTOString> = await api.put(
  //       `/admin/updateclient/${clientId}`,
  //       clientModel
  //     );
  //     return response.data;
  //   } catch (error) {
  //     throw new Error(`Failed to update client: ${error}`);
  //   }
  // }
  // Update client
  
async updateClient(clientId: string, clientModel: ClientModel): Promise<WebResponseDTOString> {
  console.log(`📝 [updateClient] Updating client with ID: ${clientId}`);
  console.log("📤 [updateClient] Payload:", clientModel);

  try {
    const response: AxiosResponse<WebResponseDTOString> = await api.put(
      `/admin/updateclient/${clientId}`,
      clientModel
    );

    console.log("✅ [updateClient] API Response:", response.data);

    if (response.data?.response) {
      console.log("📦 [updateClient] Server Message:", response.data.response);
    }

    return response.data;
  } catch (error: any) {
    console.error("❌ [updateClient] Failed to update client:", error?.message || error);

    if (error.response) {
      console.error("🚨 [updateClient] Server Error Response:", error.response.data);
      console.error("🔗 [updateClient] Endpoint:", error.config?.url);
      console.error("📄 [updateClient] Status Code:", error.response.status);
    }

    throw new Error(`Failed to update client: ${error}`);
  }
}


  // // Update employee
  // async updateEmployee(empId: string, employee: EmployeeModel): Promise<WebResponseDTOString> {
  //   try {
  //     const response: AxiosResponse<WebResponseDTOString> = await api.put(
  //       `/admin/updateemp/${empId}`,
  //       employee
  //     );
  //     return response.data;
  //   } catch (error) {
  //     throw new Error(`Failed to update employee: ${error}`);
  //   }
  // }
  // Update employee
async updateEmployee(empId: string, employee: EmployeeModel): Promise<WebResponseDTOString> {
  try {
    // ✅ Flatten arrays to match backend expectations
    const payload = {
      ...employee,
      employeeEquipmentDTO: Array.isArray(employee.employeeEquipmentDTO)
        ? employee.employeeEquipmentDTO[0]
        : employee.employeeEquipmentDTO || null,

      employeeAdditionalDetailsDTO: Array.isArray(employee.employeeAdditionalDetailsDTO)
        ? employee.employeeAdditionalDetailsDTO[0]
        : employee.employeeAdditionalDetailsDTO || null,
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


  // Delete client by ID
  async deleteClientById(clientId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/client/${clientId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete client: ${error}`);
    }
  }

  // Delete employee by ID
  async deleteEmployeeById(empId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/${empId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete employee: ${error}`);
    }
  }

  // Get client by ID
  // async getClientById(clientId: string): Promise<WebResponseDTOClientDTO> {
  //   try {
  //     const response: AxiosResponse<WebResponseDTOClientDTO> = await api.get(
  //       `/admin/client/${clientId}`
  //     );
  //     return response.data;
  //   } catch (error) {
  //     throw new Error(`Failed to get client by ID: ${error}`);
  //   }
  // }
  // Get client by ID
async getClientById(clientId: string): Promise<WebResponseDTOClientDTO> {
  console.log(`🔍 [getClientById] Fetching client details for ID: ${clientId}`);

  try {
    const response: AxiosResponse<WebResponseDTOClientDTO> = await api.get(
      `/admin/client/${clientId}`
    );

    console.log("✅ [getClientById] API Response:", response.data);

    // Optionally log specific nested data for clarity
    if (response.data?.response) {
      console.log("📦 Client Details:", response.data.response);
    }

    return response.data;
  } catch (error: any) {
    console.error("❌ [getClientById] Failed to fetch client:", error?.message || error);
    if (error.response) {
      console.error("🚨 [getClientById] Server Response:", error.response.data);
    }
    throw new Error(`Failed to get client by ID: ${error}`);
  }
}


  // // Get all clients
  async getAllClients(): Promise<WebResponseDTOListClientDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListClientDTO> = await api.get(
        '/admin/client/all'
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get all clients: ${error}`);
    }
  }

  // Get employee by ID
  async getEmployeeById(empId: string): Promise<WebResponseDTOEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOEmployeeDTO> = await api.get(
        `/admin/emp/${empId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get employee by ID: ${error}`);
    }
  }

  // Get all employees
  async getAllEmployees(): Promise<WebResponseDTOListEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListEmployeeDTO> = await api.get(
        '/admin/emp/all'
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get all employees: ${error}`);
    }
  }
   // Get all employees
   async getAllManagerEmployees(): Promise<WebResponseDTOListEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListEmployeeDTO> = await api.get(
        '/employee/manager/employees'
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get all employees: ${error}`);
    }
  }
/**
 * Get employees by designation (GET with path param).
 */
async getEmployeesByDesignation(designation: Designation): Promise<EmployeeDTO[]> {
  try {
    const response: AxiosResponse<WebResponseDTOListEmployeeDTO> = await api.get(
      `/employee/designation/${designation}`
    );
    console.log('🧩 Full get employees by designation API response:', response.data);
    if (response.data.flag && Array.isArray(response.data.response)) {
      return response.data.response;
    }
    throw new Error(response.data.message || 'Failed to get employees by designation');
  } catch (error) {
    console.error('❌ Error fetching employees by designation:', error);
    throw new Error(`Failed to get employees by designation: ${error}`);
  }
}
  // Unassign employee from client
  async unassignEmployeeFromClient(empId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.patch(
        `/admin/emp/${empId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to unassign employee from client: ${error}`);
    }
  }

  // Get all admin names
  async getAllAdminNames(): Promise<WebResponseDTOListString> {
    try {
      const response: AxiosResponse<WebResponseDTOListString> = await api.get(
        '/admin/getAllAdminNames'
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get all admin names: ${error}`);
    }
  }
  // New uploadFile method
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
}

export const adminService = new AdminService();
