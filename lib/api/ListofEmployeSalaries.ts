// lib/api/ListofEmployeSalaries.ts
import { AxiosError } from "axios";
import api from "./axios";
import { EmployeeDTO, WebResponseDTO } from "@/lib/api/types";

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

export const ListofEmployeeSalaries = {
  /**
   * ✅ Get all active employees
   * Endpoint: GET /web/api/v1/employee/activeemployees/list
   */
  async getAllEmployees(): Promise<WebResponseDTO<EmployeeDTO[]>> {
    try {
      const res = await api.get("/employee/activeemployees/list");
      return res.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * ✅ Get specific employee details by ID
   * Endpoint: GET /web/api/v1/admin/emp/{empId}
   */
  async getEmployeeById(empId: string): Promise<WebResponseDTO<EmployeeDTO>> {
    try {
      const res = await api.get(`/admin/emp/${empId}`);
      return res.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },
};
