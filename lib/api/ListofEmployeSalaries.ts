// lib/api/ListofEmployeSalaries.ts
import { AxiosError, AxiosResponse } from "axios";
import api from "./axios";
import {
  WebResponseDTOListActiveEmployees,
  WebResponseDTOEmployeeDetails,
} from "./types";

export const employeeService = {
  /**
   * Fetch all active employees
   */
  async getActiveEmployees(): Promise<WebResponseDTOListActiveEmployees> {
    try {
      const response: AxiosResponse<WebResponseDTOListActiveEmployees> =
        await api.get("/employee/activeemployees/list");
      console.log(" Full get active employees API response:", response.data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Error fetching active employees:",
        err.response?.data || err.message
      );
      throw err;
    }
  },

  /**
   * Fetch employee details (includes dateOfJoining)
   */
  async getEmployeeDetails(
    empId: string
  ): Promise<WebResponseDTOEmployeeDetails> {
    try {
      const response: AxiosResponse<WebResponseDTOEmployeeDetails> =
        await api.get(`/admin/emp/${empId}`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Error fetching employee details:",
        err.response?.data || err.message
      );
      throw err;
    }
  },
};
