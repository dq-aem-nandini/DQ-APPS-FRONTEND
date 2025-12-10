import api from "./axios";
import { AxiosResponse} from "axios";
import {
  OrganizationRequestDTO,
  OrganizationResponseDTO,
  WebResponseDTO
} from "./types";

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

// --------------------------------------------------------
// Helper: Convert RequestDTO → FormData
// --------------------------------------------------------
function toFormData(dto: OrganizationRequestDTO): FormData {
  const formData = new FormData();

  Object.entries(dto).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value as any);
    }
  });

  return formData;
}

class OrganizationService {
  // =====================================================
  // 1️⃣ VIEW ALL ORGANIZATIONS
  // =====================================================
  async getAll(): Promise<OrganizationResponseDTO[]> {
    try {
      const response: AxiosResponse<WebResponseDTO<OrganizationResponseDTO[]>> =
        await api.get("/admin/organization/view/all");

      if (response.data.flag && Array.isArray(response.data.response)) {
        return response.data.response;
      }

      return [];
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  // =====================================================
  // GET BY ID
  // =====================================================
  async getById(organizationId: string): Promise<OrganizationResponseDTO> {
    try {
      const response: AxiosResponse<WebResponseDTO<OrganizationResponseDTO>> =
        await api.get("/admin/organization/view", {
          params: { organizationId },
        });

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message);
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }


  async add(request: OrganizationRequestDTO | FormData): Promise<WebResponseDTO<OrganizationResponseDTO>> {
    try {
      const formData = request instanceof FormData ? request : this.buildFormData(request);
  
      const response = await api.post('/admin/organization/add', formData);
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  
  // Helper to build FormData from DTO (only used if not already FormData)
  private buildFormData(dto: OrganizationRequestDTO): FormData {
    const form = new FormData();
  
    form.append('organizationName', dto.organizationName || '');
    form.append('organizationLegalName', dto.organizationLegalName || '');
    form.append('registrationNumber', dto.registrationNumber || '');
    form.append('gstNumber', dto.gstNumber || '');
    form.append('panNumber', dto.panNumber || '');
    form.append('cinNumber', dto.cinNumber || '');
    form.append('website', dto.website || '');
    form.append('email', dto.email || '');
    form.append('contactNumber', dto.contactNumber || '');
    form.append('domain', dto.domain || '');
    form.append('industryType', dto.industryType || '');
    form.append('establishedDate', dto.establishedDate || '');
    form.append('timezone', dto.timezone || '');
    form.append('currencyCode', dto.currencyCode || '');
    form.append('accountNumber', dto.accountNumber || '');
    form.append('accountHolderName', dto.accountHolderName || '');
    form.append('bankName', dto.bankName || '');
    form.append('ifscCode', dto.ifscCode || '');
    form.append('branchName', dto.branchName || '');
  
    if (dto.logo) form.append('logo', dto.logo);
    if (dto.digitalSignature) form.append('digitalSignature', dto.digitalSignature);
  
    dto.addresses.forEach((addr, i) => {
      form.append(`addresses[${i}].houseNo`, addr.houseNo || '');
      form.append(`addresses[${i}].streetName`, addr.streetName || '');
      form.append(`addresses[${i}].city`, addr.city || '');
      form.append(`addresses[${i}].state`, addr.state || '');
      form.append(`addresses[${i}].country`, addr.country || '');
      form.append(`addresses[${i}].pincode`, addr.pincode || '');
      form.append(`addresses[${i}].addressType`, addr.addressType || 'OFFICE');
    });
  
    return form;
  }

  // =====================================================
  // UPDATE ORGANIZATION
  // =====================================================
  // async update(
  //   organizationId: string,
  //   request: OrganizationRequestDTO
  // ): Promise<WebResponseDTO<OrganizationResponseDTO>> {
  //   try {
  //     const formData = toFormData(request);

  //     const response: AxiosResponse<WebResponseDTO<OrganizationResponseDTO>> =
  //       await api.post("/admin/organization/update", formData, {
  //         params: { organizationId },
  //       });

  //     return response.data;
  //   } catch (error: any) {
  //     throw new Error(getBackendError(error));
  //   }
  // }

  
  async update(
    organizationId: string,
    formData: FormData
  ): Promise<WebResponseDTO<OrganizationResponseDTO>> {
    try {
      const response = await api.post(
        "/admin/organization/update",
        formData,
        {
          params: { organizationId }
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  
  
  // =====================================================
  // DELETE ORGANIZATION
  // =====================================================
  async delete(organizationId: string): Promise<WebResponseDTO<string>> {
    try {
      const response: AxiosResponse<WebResponseDTO<string>> =
        await api.delete(`/admin/organization/${organizationId}`, {
          params: { organizationId }
        });
  
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  
}

export const organizationService = new OrganizationService();
