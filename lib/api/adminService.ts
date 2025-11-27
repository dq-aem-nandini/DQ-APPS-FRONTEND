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
  // async addEmployee(employee: EmployeeModel): Promise<WebResponseDTOEmployeeDTO> {
  //   try {
  //     const response: AxiosResponse<WebResponseDTOEmployeeDTO> = await api.post(
  //       '/admin/add/employee',
  //       employee
  //     );
  //     return response.data;
  //   } catch (error) {
  //     throw new Error(`Failed to add employee: ${error}`);
  //   }
  // }
// ⭐ FINAL — 100% Working with Spring Boot multipart/form-data
async addEmployee(
  employee: EmployeeModel,
  employeePhotoFile?: File | null,
  documentFiles: File[] = []
): Promise<WebResponseDTO<EmployeeDTO>> {
  try {
    const formData = new FormData();

    // === BASIC FIELDS ===
    formData.append('firstName', employee.firstName);
    formData.append('lastName', employee.lastName);
    formData.append('personalEmail', employee.personalEmail);
    formData.append('companyEmail', employee.companyEmail);
    formData.append('contactNumber', employee.contactNumber);
    if (employee.alternateContactNumber) formData.append('alternateContactNumber', employee.alternateContactNumber);
    formData.append('gender', employee.gender);
    if (employee.maritalStatus) formData.append('maritalStatus', employee.maritalStatus);
    if (employee.numberOfChildren != null) formData.append('numberOfChildren', employee.numberOfChildren.toString());
    formData.append('nationality', employee.nationality);
    formData.append('emergencyContactName', employee.emergencyContactName);
    formData.append('emergencyContactNumber', employee.emergencyContactNumber);
    if (employee.remarks) formData.append('remarks', employee.remarks);
    if (employee.skillsAndCertification) formData.append('skillsAndCertification', employee.skillsAndCertification);

    // === CLIENT ===
    if (employee.clientId) formData.append('clientId', employee.clientId);
    if (employee.clientSelection) formData.append('clientSelection', employee.clientSelection);

    formData.append('reportingManagerId', employee.reportingManagerId || '');
    formData.append('designation', employee.designation);
    formData.append('dateOfBirth', employee.dateOfBirth);
    formData.append('dateOfJoining', employee.dateOfJoining);
    formData.append('rateCard', employee.rateCard.toString());
    formData.append('employmentType', employee.employmentType);

    // === BANKING ===
    if (employee.panNumber) formData.append('panNumber', employee.panNumber);
    if (employee.aadharNumber) formData.append('aadharNumber', employee.aadharNumber);
    if (employee.accountNumber) formData.append('accountNumber', employee.accountNumber);
    if (employee.accountHolderName) formData.append('accountHolderName', employee.accountHolderName);
    if (employee.bankName) formData.append('bankName', employee.bankName);
    if (employee.ifscCode) formData.append('ifscCode', employee.ifscCode);
    if (employee.branchName) formData.append('branchName', employee.branchName);

    // === FILES ===
    if (employeePhotoFile) formData.append('employeePhotoUrl', employeePhotoFile);
    documentFiles.forEach(file => formData.append('documents', file));

    // === FLATTEN NESTED DTOs (THIS IS THE KEY FIX) ===
    // employeeSalaryDTO
    const salary = employee.employeeSalaryDTO;
    if (salary) {
      formData.append('employeeSalaryDTO.ctc', salary.ctc.toString());
      formData.append('employeeSalaryDTO.payType', salary.payType);
      formData.append('employeeSalaryDTO.standardHours', salary.standardHours.toString());
      formData.append('employeeSalaryDTO.bankAccountNumber', salary.bankAccountNumber || '');
      formData.append('employeeSalaryDTO.ifscCode', salary.ifscCode || '');
      formData.append('employeeSalaryDTO.payClass', salary.payClass);

      // Allowances & Deductions as JSON strings (or flatten further if needed)
      if (salary.allowances && salary.allowances.length > 0) {
        formData.append('employeeSalaryDTO.allowances', JSON.stringify(salary.allowances));
      }
      if (salary.deductions && salary.deductions.length > 0) {
        formData.append('employeeSalaryDTO.deductions', JSON.stringify(salary.deductions));
      }
    }

    // employeeAdditionalDetailsDTO
    const additional = employee.employeeAdditionalDetailsDTO;
    if (additional) {
      if (additional.offerLetterUrl) formData.append('employeeAdditionalDetailsDTO.offerLetterUrl', additional.offerLetterUrl);
      if (additional.contractUrl) formData.append('employeeAdditionalDetailsDTO.contractUrl', additional.contractUrl);
      if (additional.taxDeclarationFormUrl) formData.append('employeeAdditionalDetailsDTO.taxDeclarationFormUrl', additional.taxDeclarationFormUrl);
      if (additional.workPermitUrl) formData.append('employeeAdditionalDetailsDTO.workPermitUrl', additional.workPermitUrl);
      if (additional.backgroundCheckStatus) formData.append('employeeAdditionalDetailsDTO.backgroundCheckStatus', additional.backgroundCheckStatus);
      if (additional.remarks) formData.append('employeeAdditionalDetailsDTO.remarks', additional.remarks);
    }

    // employeeEmploymentDetailsDTO
    const empDetails = employee.employeeEmploymentDetailsDTO;
    if (empDetails) {
      if (empDetails.noticePeriodDuration) formData.append('employeeEmploymentDetailsDTO.noticePeriodDuration', empDetails.noticePeriodDuration);
      formData.append('employeeEmploymentDetailsDTO.probationApplicable', empDetails.probationApplicable.toString());
      if (empDetails.probationDuration) formData.append('employeeEmploymentDetailsDTO.probationDuration', empDetails.probationDuration);
      if (empDetails.probationNoticePeriod) formData.append('employeeEmploymentDetailsDTO.probationNoticePeriod', empDetails.probationNoticePeriod);
      formData.append('employeeEmploymentDetailsDTO.bondApplicable', empDetails.bondApplicable.toString());
      if (empDetails.bondDuration) formData.append('employeeEmploymentDetailsDTO.bondDuration', empDetails.bondDuration);
      if (empDetails.workingModel) formData.append('employeeEmploymentDetailsDTO.workingModel', empDetails.workingModel);
      if (empDetails.shiftTiming) formData.append('employeeEmploymentDetailsDTO.shiftTiming', empDetails.shiftTiming);
      if (empDetails.department) formData.append('employeeEmploymentDetailsDTO.department', empDetails.department);
      if (empDetails.dateOfConfirmation) formData.append('employeeEmploymentDetailsDTO.dateOfConfirmation', empDetails.dateOfConfirmation);
      if (empDetails.location) formData.append('employeeEmploymentDetailsDTO.location', empDetails.location);
    }

    // employeeInsuranceDetailsDTO
    const insurance = employee.employeeInsuranceDetailsDTO;
    if (insurance) {
      if (insurance.policyNumber) formData.append('employeeInsuranceDetailsDTO.policyNumber', insurance.policyNumber);
      if (insurance.providerName) formData.append('employeeInsuranceDetailsDTO.providerName', insurance.providerName);
      if (insurance.coverageStart) formData.append('employeeInsuranceDetailsDTO.coverageStart', insurance.coverageStart);
      if (insurance.coverageEnd) formData.append('employeeInsuranceDetailsDTO.coverageEnd', insurance.coverageEnd);
      if (insurance.nomineeName) formData.append('employeeInsuranceDetailsDTO.nomineeName', insurance.nomineeName);
      if (insurance.nomineeRelation) formData.append('employeeInsuranceDetailsDTO.nomineeRelation', insurance.nomineeRelation);
      if (insurance.nomineeContact) formData.append('employeeInsuranceDetailsDTO.nomineeContact', insurance.nomineeContact);
      formData.append('employeeInsuranceDetailsDTO.groupInsurance', insurance.groupInsurance.toString());
    }

    // employeeStatutoryDetailsDTO
    const statutory = employee.employeeStatutoryDetailsDTO;
    if (statutory) {
      if (statutory.passportNumber) formData.append('employeeStatutoryDetailsDTO.passportNumber', statutory.passportNumber);
      if (statutory.taxRegime) formData.append('employeeStatutoryDetailsDTO.taxRegime', statutory.taxRegime);
      if (statutory.pfUanNumber) formData.append('employeeStatutoryDetailsDTO.pfUanNumber', statutory.pfUanNumber);
      if (statutory.esiNumber) formData.append('employeeStatutoryDetailsDTO.esiNumber', statutory.esiNumber);
      if (statutory.ssnNumber) formData.append('employeeStatutoryDetailsDTO.ssnNumber', statutory.ssnNumber);
    }

    // addresses & equipment (stringify arrays)
    if (employee.addresses && employee.addresses.length > 0) {
      formData.append('addresses', JSON.stringify(employee.addresses));
    }
    if (employee.employeeEquipmentDTO && employee.employeeEquipmentDTO.length > 0) {
      formData.append('employeeEquipmentDTO', JSON.stringify(employee.employeeEquipmentDTO));
    }

    // === API CALL ===
    const response = await api.post<WebResponseDTO<EmployeeDTO>>(
      '/admin/add/employee',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Failed to add employee';
    console.error('Add employee error:', error);
    throw new Error(msg);
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
      console.error(' [updateClient] Failed to update client:', error?.message || error);
      throw new Error(`Failed to update client: ${error}`);
    }
  }

  // ✅ Update employee
// async updateEmployee(empId: string, employee: EmployeeModel): Promise<WebResponseDTOString> {
//   try {
//     const payload = {
//       ...employee,
//     };

//     const response: AxiosResponse<WebResponseDTOString> = await api.put(
//       `/admin/updateemp/${empId}`,
//       payload
//     );
//     return response.data;
//   } catch (error: any) {
//     // 🔥 Extract only backend error message
//     const backendMessage =
//       error?.response?.data?.message ||
//       error?.response?.data?.error ||
//       JSON.stringify(error?.response?.data) ||
//       "Something went wrong";

//     throw new Error(backendMessage); // ⬅ ONLY BACKEND MESSAGE
//   }
// }
// ✅ Update employee (multipart/form-data)
// BEST & ONLY RELIABLE WAY — Works 100% with Spring Boot + nested DTOs + files

async updateEmployee(empId: string, employee: any): Promise<WebResponseDTOString> {
  const formData = new FormData();

  // Helper to append safely (skip null/undefined/objects)
  const appendIfValid = (key: string, value: any) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'object' && !(value instanceof File)) return;
    if (Array.isArray(value) && value.length === 0) return;
    formData.append(key, value);
  };

  // === ROOT LEVEL FIELDS ===
  appendIfValid('firstName', employee.firstName);
  appendIfValid('lastName', employee.lastName);
  appendIfValid('personalEmail', employee.personalEmail);
  appendIfValid('companyEmail', employee.companyEmail);
  appendIfValid('contactNumber', employee.contactNumber);
  appendIfValid('alternateContactNumber', employee.alternateContactNumber);
  appendIfValid('gender', employee.gender);
  appendIfValid('maritalStatus', employee.maritalStatus);
  appendIfValid('numberOfChildren', employee.numberOfChildren);
  appendIfValid('nationality', employee.nationality);
  appendIfValid('emergencyContactName', employee.emergencyContactName);
  appendIfValid('emergencyContactNumber', employee.emergencyContactNumber);
  appendIfValid('remarks', employee.remarks);
  appendIfValid('skillsAndCertification', employee.skillsAndCertification);
  appendIfValid('clientId', employee.clientId);
  appendIfValid('clientSelection', employee.clientSelection);
  appendIfValid('reportingManagerId', employee.reportingManagerId || '');
  appendIfValid('designation', employee.designation);
  appendIfValid('dateOfBirth', employee.dateOfBirth);
  appendIfValid('dateOfJoining', employee.dateOfJoining);
  appendIfValid('rateCard', employee.rateCard);
  appendIfValid('employmentType', employee.employmentType);
  appendIfValid('panNumber', employee.panNumber);
  appendIfValid('aadharNumber', employee.aadharNumber);
  appendIfValid('accountNumber', employee.accountNumber);
  appendIfValid('accountHolderName', employee.accountHolderName);
  appendIfValid('bankName', employee.bankName);
  appendIfValid('ifscCode', employee.ifscCode);
  appendIfValid('branchName', employee.branchName);

  // === FILES (Root level) ===
  if (employee.employeePhoto instanceof File) {
    formData.append('employeePhoto', employee.employeePhoto);
  }
  if (employee.offerLetter instanceof File) formData.append('offerLetter', employee.offerLetter);
  if (employee.contract instanceof File) formData.append('contract', employee.contract);
  if (employee.taxDeclarationForm instanceof File) formData.append('taxDeclarationForm', employee.taxDeclarationForm);
  if (employee.workPermit instanceof File) formData.append('workPermit', employee.workPermit);

  // === DYNAMIC DOCUMENTS (with files) ===
  employee.documents?.forEach((doc: any, i: number) => {
    appendIfValid(`documents[${i}].documentId`, doc.documentId);
    appendIfValid(`documents[${i}].docType`, doc.docType);
    appendIfValid(`documents[${i}].fileUrl`, doc.fileUrl);
    if (doc.file instanceof File) {
      formData.append(`documents[${i}].file`, doc.file, doc.file.name);
    }
  });

  // === ADDRESSES ===
  employee.addresses?.forEach((addr: any, i: number) => {
    Object.entries(addr).forEach(([k, v]) => {
      if (v !== null && v !== undefined) {
        formData.append(`addresses[${i}].${k}`, v as string);
      }
    });
  });

  // === SALARY DTO + Allowances/Deductions ===
  const salary = employee.employeeSalaryDTO;
  if (salary) {
    appendIfValid('employeeSalaryDTO.ctc', salary.ctc);
    appendIfValid('employeeSalaryDTO.payType', salary.payType);
    appendIfValid('employeeSalaryDTO.standardHours', salary.standardHours);
    appendIfValid('employeeSalaryDTO.bankAccountNumber', salary.bankAccountNumber);
    appendIfValid('employeeSalaryDTO.ifscCode', salary.ifscCode);
    appendIfValid('employeeSalaryDTO.payClass', salary.payClass);

    salary.allowances?.forEach((a: any, i: number) => {
      Object.entries(a).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          formData.append(`employeeSalaryDTO.allowances[${i}].${k}`, v as string);
        }
      });
    });

    salary.deductions?.forEach((d: any, i: number) => {
      Object.entries(d).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          formData.append(`employeeSalaryDTO.deductions[${i}].${k}`, v as string);
        }
      });
    });
  }

  // === OTHER DTOs (flatten with dot notation) ===
  const appendDTO = (prefix: string, obj: any) => {
    if (!obj) return;
    Object.entries(obj).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (typeof v === 'object' && !(v instanceof File)) return; // skip nested objects
      formData.append(`${prefix}.${k}`, v as string);
    });
  };

  appendDTO('employeeAdditionalDetailsDTO', employee.employeeAdditionalDetailsDTO);
  appendDTO('employeeEmploymentDetailsDTO', employee.employeeEmploymentDetailsDTO);
  appendDTO('employeeInsuranceDetailsDTO', employee.employeeInsuranceDetailsDTO);
  appendDTO('employeeStatutoryDetailsDTO', employee.employeeStatutoryDetailsDTO);

  // === EQUIPMENT ===
  employee.employeeEquipmentDTO?.forEach((eq: any, i: number) => {
    Object.entries(eq).forEach(([k, v]) => {
      if (v !== null && v !== undefined) {
        formData.append(`employeeEquipmentDTO[${i}].${k}`, v as string);
      }
    });
  });

  // CRITICAL: DO NOT SET Content-Type HEADER!
  // const response = await api.put(`/admin/updateemp/${empId}`, 
  //   formData, {
  //   timeout: 60000,
  //   // Let browser set the correct boundary
  // });
  const response = await api.put(`/admin/updateemp/${empId}`, 
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
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
      console.error('[getClientById] Failed:', error);
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
      console.error("[deleteEmployeeEquipmentInfo] Failed to delete employee equipment:", error?.message || error);
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
    console.error("❌ [getEmployeesByClientId] Error:", error);

    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch employees for this client";

    throw new Error(msg);
  }
}

  
}

export const adminService = new AdminService();
