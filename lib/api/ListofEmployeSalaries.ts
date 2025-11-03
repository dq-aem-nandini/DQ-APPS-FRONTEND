// lib/api/ListofEmployeSalaries.ts
import { AxiosError } from "axios";
import api from "./axios";
import { EmployeeDTO, WebResponseDTO } from "@/lib/api/types";

/**
 * Service for fetching active employees and individual employee details.
 */
export const ListofEmployeeSalaries = {
  /**
   * ✅ Get all active employees
   * Endpoint: GET /web/api/v1/employee/activeemployees/list
   */
  async getAllEmployees(): Promise<WebResponseDTO<EmployeeDTO[]>> {
    try {
      const res = await api.get("/employee/activeemployees/list");
      return res.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(" Error fetching employees:", err.message);
      throw err;
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
    } catch (error) {
      const err = error as AxiosError;
      console.error(` Error fetching employee (${empId}):`, err.message);
      throw err;
    }
  },
};
