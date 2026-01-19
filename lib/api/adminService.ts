
// /lib/api/adminService.ts
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
  EmployeeDTO,
  WebResponseDTO,
  Designation,
  AdminDTO,
  AdminUpdatePayload,
} from './types';
import { AxiosResponse } from 'axios';
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
const stateCache: Record<string, string[]> = {};

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


  // ⭐ FINAL — 100% Working with Spring Boot multipart/form-data
  async addEmployee(
    employee: EmployeeModel,
    // employeePhotoFile?: File | null,
    documentFiles: File[] = []
  ) {
    try {
      const formData = new FormData();

      // -------------------------------------------------------
      // 1) CLEAN JSON — remove all fields backend does not accept
      // -------------------------------------------------------
      const cleanEmployee: any = { ...employee };

      //  Remove file fields (backend does NOT accept MultipartFile in JSON)
      delete cleanEmployee.employeePhotoUrl;

      //  Remove frontend-only label fields from Employment DTO
      if (cleanEmployee.employeeEmploymentDetailsDTO) {
        const dto = cleanEmployee.employeeEmploymentDetailsDTO;
        delete dto.noticePeriodDurationLabel;
        delete dto.probationDurationLabel;
        delete dto.probationNoticePeriodLabel;
        delete dto.bondDurationLabel;
        delete dto.shiftTimingLabel;
      }

      // -------------------------------------------------------
      // 2) CLEAN DOCUMENT METADATA — backend expects only docType + documentId
      // -------------------------------------------------------
      // Include ONLY documents that have an uploaded file
      cleanEmployee.documents = [];

      documentFiles.forEach((file, index) => {
        if (file instanceof File) {
          const doc = employee.documents[index];
          cleanEmployee.documents.push({
            documentId: null,
            docType: doc.docType,
          });

          formData.append("documents", file);
        }
      });


      // -------------------------------------------------------
      // 3) Append JSON as string
      // -------------------------------------------------------
      formData.append("employee", JSON.stringify(cleanEmployee));

      // -------------------------------------------------------
      // 5) Append document files (multiple)
      // -------------------------------------------------------
      documentFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("documents", file); // backend expects key "documents"
        }
      });

      // -------------------------------------------------------
      // 6) API Call
      // -------------------------------------------------------
      const response = await api.post("/admin/add/employee", formData);
      return response.data;

    } catch (error: any) {
      throw new Error(getBackendError(error));
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
      throw new Error(getBackendError(error));
    }
  }

  // ✅ Update employee
  async updateEmployee(
    empId: string,
    payload: FormData
  ): Promise<any> {
    try {
      const response = await api.put(`/admin/updateemp/${empId}`, payload, {
        // timeout: 90000,
        // Important: Do NOT set Content-Type header
        // Browser automatically sets it with correct boundary for FormData
      });

      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ Delete client by ID
  async deleteClientById(clientId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(`/admin/client/${clientId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ Delete employee by ID
  async deleteEmployeeById(empId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(`/admin/${empId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ Get client by ID
  async getClientById(clientId: string): Promise<WebResponseDTOClientDTO> {
    console.log(`🔍 [getClientById] Fetching client details for ID: ${clientId}`);
    try {
      const response: AxiosResponse<WebResponseDTOClientDTO> = await api.get(`/admin/client/${clientId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ Get all clients
  async getAllClients(): Promise<WebResponseDTOListClientDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListClientDTO> = await api.get('/admin/client/all');
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ Get employee by ID
  async getEmployeeById(empId: string): Promise<WebResponseDTOEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOEmployeeDTO> = await api.get(`/admin/emp/${empId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ Get all employees
  async getAllEmployees(): Promise<WebResponseDTOListEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListEmployeeDTO> = await api.get('/admin/emp/all');
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ Get manager’s employees
  async getAllManagerEmployees(): Promise<WebResponseDTOListEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListEmployeeDTO> = await api.get('/employee/manager/employees');
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
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
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ Unassign employee from client
  async unassignEmployeeFromClient(empId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.patch(`/admin/emp/${empId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ Get all admin names
  async getAllAdminNames(): Promise<WebResponseDTOListString> {
    try {
      const response: AxiosResponse<WebResponseDTOListString> = await api.get('/admin/getAllAdminNames');
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
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
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ DELETE: Employee Address
  async deleteEmployeeAddress(entityId: string, addressId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/delete/${entityId}/address/${addressId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ DELETE: Employee Document
  async deleteEmployeeDocument(employeeId: string, documentId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/delete/employee/${employeeId}/document/${documentId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
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
      throw new Error(getBackendError(error));
    }
  }

  // ✅ DELETE: Client Tax Details
  async deleteClientTaxDetails(clientId: string, taxId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/delete/client/${clientId}/taxDetails/${taxId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ DELETE: Client POC Details
  async deleteClientPocDetails(clientId: string, pocId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/delete/client/${clientId}/pocDetails/${pocId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  // ✅ Get all employees for a specific client ID
  async getEmployeesByClientId(
    clientId: string
  ): Promise<WebResponseDTOListEmployeeDTO> {
    if (!clientId) {
      throw new Error("Client ID is required");
    }
    console.log("🔍 [getEmployeesByClientId] Fetching employees for client:", clientId);
    try {
      const response: AxiosResponse<WebResponseDTOListEmployeeDTO> =
        await api.get(`/admin/emp/all/${clientId}`);

      console.log("✅ [getEmployeesByClientId] Response:", response.data);

      return response.data;

    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  async getAdminProfile(): Promise<WebResponseDTO<AdminDTO>> {
    try {
      const response = await api.get<WebResponseDTO<AdminDTO>>("/admin/view");
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  async requestAdminUpdate(payload: AdminUpdatePayload): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.patch<WebResponseDTO<string>>(
        "/admin/update",
        payload
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  async verifyAdminOtp(otp: string): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.post<WebResponseDTO<string>>(
        `/admin/update/verify/otp?otp=${otp}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  // ✅ DELETE: Employee Salary Allowance
  async deleteEmployeeAllowance(employeeId: string, allowanceId: string): Promise<WebResponseDTOString> {
    console.log(`🗑️ [deleteEmployeeAllowance] Removing allowance ${allowanceId} for employee ${employeeId}`);

    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/${employeeId}/salary/allowances/${allowanceId}`
      );

      console.log("✅ [deleteEmployeeAllowance] API Response:", response.data);

      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ✅ DELETE: Employee Salary Deduction
  async deleteEmployeeDeduction(employeeId: string, deductionId: string): Promise<WebResponseDTOString> {
    console.log(`🗑️ [deleteEmployeeDeduction] Removing deduction ${deductionId} for employee ${employeeId}`);

    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.delete(
        `/admin/${employeeId}/salary/deduction/${deductionId}`
      );

      console.log("✅ [deleteEmployeeDeduction] API Response:", response.data);

      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  async revertTimesheet(
    params: {
      employeeId: string;
      startDate: string;
      endDate: string;
      workRequest: string;
    }
  ): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.get(
        `/admin/revert/timesheet`,
        { params }
      );
  
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  
  // ------------------------------
  // 1️⃣ Get all pending holiday update requests
  // ------------------------------
  async getAllHolidayUpdateRequests(): Promise<WebResponseDTOListEmployeeDTO> {
    try {
      const response: AxiosResponse<any> = await api.get(
        '/admin/update-request/all/holidays'
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // ------------------------------
  // 2️⃣ Approve a holiday update request
  // ------------------------------
  async approveHolidayUpdateRequest(requestId: string): Promise<WebResponseDTOString> {
    try {
      const response: AxiosResponse<WebResponseDTOString> = await api.put(
        `/admin/update-request/approve/holiday/${requestId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  /**
 * Simple in-memory cache
 * Key = country (lowercase)
 * Value = list of states
 */


  async getStatesByCountry(country: string): Promise<string[]> {
    const normalizedCountry = country.trim().toLowerCase();

    console.log(`🌍 [getStatesByCountry] Country: ${normalizedCountry}`);

    // ✅ CACHE HIT
    if (stateCache[normalizedCountry]) {
      console.log("🧠 [getStatesByCountry] Returning cached states");
      return stateCache[normalizedCountry];
    }

    try {
      const response: AxiosResponse<string[]> = await api.get(
        `/client/states`,
        {
          params: { country },
        }
      );

      console.log("✅ [getStatesByCountry] API Response:", response.data);

      // ✅ SAVE TO CACHE
      stateCache[normalizedCountry] = response.data;

      return response.data;
    } catch (error: any) {
      console.error("❌ [getStatesByCountry] Error:", error);
      throw new Error(getBackendError(error));
    }
  }

}
export const adminService = new AdminService();
