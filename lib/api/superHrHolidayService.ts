import api from "./axios";
import type { WebResponseDTO, SuperHrHolidayRequestDTO, DeleteEmployeeHolidayRequestDTO } from "@/lib/api/types";

function getBackendError(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.response ||
    error?.message ||
    "Something went wrong"
  );
}

export class SuperHrHolidayService {

  /**
   * Add holiday for multiple employees (SUPER_HR)
   */
  async addEmployeeHoliday(
    request: SuperHrHolidayRequestDTO
  ): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.post(
        "/super-hr/employee/holiday/add",
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  /**
   * Delete holiday for a specific employee (SUPER_HR)
   */
  async deleteEmployeeHoliday(
    request: DeleteEmployeeHolidayRequestDTO
  ): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.post(
        "/super-hr/employee/holiday/delete",
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

/**
 * 🔐 Admin / Super HR - Update Employee Password(s)
 */
async updateEmployeePasswords(
  request: {
    password: string;
    employeeId: string;
  }[]
): Promise<WebResponseDTO<string>> {
  try {
    const response = await api.put(
      "/user/admin/updatePassWord",
      request
    );
    return response.data;
  } catch (error: any) {
    throw new Error(getBackendError(error));
  }
}

  
}


export const superHrHolidayService = new SuperHrHolidayService();
