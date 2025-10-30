// lib/api/salaryService.ts
import { AxiosError, AxiosResponse } from "axios";
import api from "./axios";
import { SalarySummaryDTO, WebResponseDTO } from "./types";

export const salaryService = {
  /**
   * Fetch salary summary for an employee (by employeeId)
   */
  async getAllSalaries(employeeId: string): Promise<WebResponseDTO<SalarySummaryDTO>> {
    try {
      const response: AxiosResponse<WebResponseDTO<SalarySummaryDTO>> = await api.get(`/salary/${employeeId}`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error("Error fetching salary summary:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Fetch payslip for a given employee and month (month format: YYYY-MM or YYYY-MM-DD)
   */
  async getPayslip(employeeId: string, month: string): Promise<WebResponseDTO<SalarySummaryDTO>> {
    try {
      const response: AxiosResponse<WebResponseDTO<SalarySummaryDTO>> = await api.get(`/salary/${employeeId}/${month}`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error("Error fetching payslip:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Download payslip as PDF for a given employee and month
   */
  async downloadPayslipPdf(employeeId: string, month: string): Promise<void> {
    try {
      const response = await api.get(`/salary/${employeeId}/${month}/pdf`, {
        responseType: "blob", // Important: handle binary PDF file
        headers: { Accept: "application/pdf" },
      });

      // Create a blob and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      // Format month as readable string (e.g., "Aug-2025")
      const monthName = new Date(month + "-01").toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      link.href = url;
      link.download = `Payslip-${monthName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const err = error as AxiosError;
      console.error("Error downloading payslip PDF:", err.response?.data || err.message);
      throw err;
    }
  },
};
