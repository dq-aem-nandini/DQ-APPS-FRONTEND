// /lib/api/employeeService.ts
import api from './axios';
import {
  EmployeeModel,
  WebResponseDTOListEmployeeDTO,

  Designation,
  WebResponseDTOListString,
  EmployeeDTO,
  WebResponseDTO,
  WebResponseDTOString,
  WebResponseDTOListEmployeeUpdateRequestDTO,

} from './types';
import { AxiosResponse, AxiosError } from 'axios';

class EmployeeService {
 
  async updateEmployee(employee: EmployeeModel): Promise<WebResponseDTO<EmployeeDTO>> {
    try {
      const response: AxiosResponse<WebResponseDTO<EmployeeDTO>> = await api.put(
        '/employee/update',
        employee
      );

      console.log('🧩 Full update employee API response:', response.data);

      const { flag, message, status, response: data, totalRecords, otherInfo } = response.data;

      return {
        flag,
        message: message || (flag ? 'Employee updated successfully' : 'Failed to update employee'),
        status: status ?? (flag ? 200 : 400),
        response: data ?? ({} as EmployeeDTO), // ✅ use empty object for non-nullable type
        totalRecords: totalRecords ?? 0,
        otherInfo: otherInfo ?? null,
      };
    } catch (error: unknown) {
      console.error('❌ Error updating employee:', error);

      let errorMessage = 'Failed to update employee';
      let errorStatus = 500;

      if (error instanceof AxiosError) {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to update employee';
        errorStatus = error.response?.status || 500;
      }

      // ✅ return a well-typed fallback response
      return {
        flag: false,
        message: errorMessage,
        status: errorStatus,
        response: {} as EmployeeDTO, // ✅ prevents TS error if response cannot be null
        totalRecords: 0,
        otherInfo: null,
      };
    }
  }


  /**
   * Get current employee's details (GET no params; for authenticated user).
   */
  async getEmployeeById(): Promise<EmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTO<EmployeeDTO>> = await api.get('/employee/view');
      console.log('🧩 Full get employee by ID API response:', response.data);
      if (response.data.flag && response.data.response) {
        return response.data.response;
      }
      throw new Error(response.data.message || 'Failed to fetch employee');
    } catch (error: unknown) {
      console.error('❌ Error fetching employee by ID:', error);
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || error.message || 'Failed to fetch employee'
        : 'Failed to fetch employee';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get employee by ID for admin access (GET with path param).
   */
  async getEmployeeByIdAdmin(empId: string): Promise<EmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTO<EmployeeDTO>> = await api.get(`/admin/emp/${empId}`);
      console.log('🧩 Full get employee by ID (admin) API response:', response.data.response);
      if (response.data.flag && response.data.response) {
        return response.data.response;
      }
      throw new Error(response.data.message || 'Failed to fetch employee');
    } catch (error) {
      console.error('❌ Error fetching employee by ID (admin):', error);
      throw new Error(`Failed to fetch employee by ID: ${error}`);
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
      console.log('🧩 Full get employees by designation API response:', response.data.response);
      if (response.data.flag && response.data.response) {
        return response.data.response;
      }
      throw new Error(response.data.message || 'Failed to get employees by designation');
    } catch (error) {
      console.error('❌ Error fetching employees by designation:', error);
      throw new Error(`Failed to get employees by designation: ${error}`);
    }
  }

  /**
   * Get designation list (GET no params).
   */
  async getDesignationList(): Promise<string[]> {
    try {
      const response: AxiosResponse<WebResponseDTOListString> = await api.get('/employee/designationList');
      console.log('🧩 Full get designation list API response:', response.data.response);
      if (response.data.flag && response.data.response) {
        return response.data.response;
      }
      throw new Error(response.data.message || 'Failed to get designation list');
    } catch (error) {
      console.error('❌ Error fetching designation list:', error);
      throw new Error(`Failed to get designation list: ${error}`);
    }
  }
    // ✅ DELETE: Employee Address (New Global Endpoint)
    async deleteEmployeeAddressGlobal(
      employeeId: string,
      addressId: string
    ): Promise<WebResponseDTOString> {
      console.log(`[delete] address ${addressId} for employee ${employeeId}`);
    
      try {
        const response: AxiosResponse<WebResponseDTOString> = await api.delete(
          `/employee/address/delete/${addressId}`
        );
    
        if (!response.data.flag) {
          throw new Error(response.data.message || 'Delete failed');
        }
    
        console.log('Success:', response.data);
        return response.data;
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to delete address';
        console.error('Error:', msg);
        throw new Error(msg);
      }
    }
    // my update requests
    async getMyUpdateRequests(): Promise<WebResponseDTOListEmployeeUpdateRequestDTO> {
      try {
        const response: AxiosResponse<WebResponseDTOListEmployeeUpdateRequestDTO> =
          await api.get("/employee/update-request/my");
    
        console.log("📌 My Update Requests:", response.data);
    
        return response.data;
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error.message ||
          "Failed to fetch update requests";
        throw new Error(msg);
      }
    }
    // submit update
    async submitUpdateRequest(
      payload: any
    ): Promise<WebResponseDTOString> {
      try {
        const response: AxiosResponse<WebResponseDTOString> =
          await api.post("/employee/update-request/submit", payload);
    
        console.log("📌 Submit Update Request:", response.data);
    
        return response.data;
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error.message ||
          "Failed to submit update request";
        throw new Error(msg);
      }
    }
    // admin requests
    async getAllUpdateRequestsAdmin(): Promise<WebResponseDTOListEmployeeUpdateRequestDTO> {
      try {
        const response: AxiosResponse<WebResponseDTOListEmployeeUpdateRequestDTO> =
          await api.get("/admin/update-request/all");
    
        console.log("📌 All Update Requests (Admin):", response.data);
    
        return response.data;
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error.message ||
          "Failed to fetch admin update requests";
        throw new Error(msg);
      }
    }
        
}

export const employeeService = new EmployeeService();
