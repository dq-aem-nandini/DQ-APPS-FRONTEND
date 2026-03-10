import api from "./axios";
import type { WebResponseDTO, AttendanceStatusDTO, MonthlyAttendanceResponseDTO, AttendanceRegularization, RegularizationRequestDTO } from "@/lib/api/types";

function getBackendError(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.response ||
    error?.message ||
    "Something went wrong"
  );
}

export class EmployeePunchService {

  /**
   *  Employee Punch (Clock In / Clock Out)
   * POST /web/api/v1/employee/punch
   */
  async punch(): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.post(
        "/employee/punch"
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  /**
   * Get Employee Attendance Status
   * GET /web/api/v1/employee/punch/status/{employeeId}
   */
  async getPunchStatus(
    employeeId: string
  ): Promise<WebResponseDTO<AttendanceStatusDTO>> {
    try {
      const response = await api.get(
        `/employee/punch/status/${employeeId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  /**
 * Get Employee Monthly Attendance
 * GET /employees/{employeeId}/attendance
 */
async getMonthlyAttendance(
  employeeId: string,
  fromDate: string,
  toDate: string
): Promise<WebResponseDTO<MonthlyAttendanceResponseDTO>> {
  try {
    const response = await api.get(
      `/employees/${employeeId}/attendance`,
      {
        params: {
          fromDate,
          toDate,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(getBackendError(error));
  }
}
/* -------------------------------------------------------------------------- */
  /*                          REGULARIZATION APIs                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Employee Request Regularization
   * POST /web/api/v1/employee/add/regularization
   */
  async addRegularization(
    data: RegularizationRequestDTO
  ): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.post(
        "/employee/add/regularization",
        data
      );

      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  /**
   * Admin - Get Pending Regularizations 
   */
  async getPendingRegularizations(): Promise<
    WebResponseDTO<AttendanceRegularization[]>
  > {
    try {
      const response = await api.get(
        "/admin/regularization/get/pending"
      );

      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  /**
   * Approve Regularization
   */
  async approveRegularization(
    id: string
  ): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.post(
        `/regularization/${id}/approve`
      );

      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  /**
   * Reject Regularization
   */
  async rejectRegularization(
    id: string
  ): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.post(
        `/regularization/${id}/reject`
      );

      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

}

export const employeePunchService = new EmployeePunchService();
