import { AxiosError, AxiosResponse, Method } from "axios";
import api from "./axios";
import { TimeSheetModel, TimeSheetResponseDto, WebResponseDTO } from "./types";

type WebResponseDTOList<T> = WebResponseDTO<T[]>;
type WebResponseDTOObject = WebResponseDTO<any>; // For generic object responses

class TimesheetService {
  /**
   * 🔹 Private helper for mutation operations (create, update, delete, submit, approve, reject).
   */
  private async _mutation<T = string>(
    url: string,
    method: Method,
    data?: any,
    config?: any,
    isFormData = false,
    successMessage?: string,
    failureMessage?: string
  ): Promise<WebResponseDTO<T>> {
    try {
      const headers: any = {};
      if (isFormData && data && typeof data === 'string') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      const response: AxiosResponse<WebResponseDTO<T>> = await api({
        method,
        url,
        data: isFormData ? data : data,
        ...config,
        headers: { ...config?.headers, ...headers },
      });

      console.log(`🧩 Full ${method.toUpperCase()} API response:`, response.data);

      const { flag, message, status, response: resp, totalRecords, otherInfo } = response.data;
      return {
        flag,
        message: message || (flag ? successMessage || "Operation successful" : failureMessage || "Operation failed"),
        status: status ?? (flag ? 200 : 400),
        response: resp ?? ({} as T),
        totalRecords: totalRecords ?? 0,
        otherInfo: otherInfo ?? null,
      };
    } catch (error: unknown) {
      console.error(`❌ Error in ${method.toUpperCase()} operation:`, error);
      let errorMessage = failureMessage || "Operation failed";
      let errorStatus = 500;
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.message || errorMessage;
        errorStatus = error.response?.status || 500;
      }
      return {
        flag: false,
        message: errorMessage,
        status: errorStatus,
        response: {} as T,
        totalRecords: 0,
        otherInfo: null,
      };
    }
  }

  /**
   * 🔹 Private helper for GET queries.
   */
  private async _query<T>(url: string, config?: any): Promise<WebResponseDTO<T>> {
    try {
      // Clean params to remove undefined values
      const cleanConfig = config ? { ...config } : {};
      if (cleanConfig.params) {
        cleanConfig.params = Object.fromEntries(
          Object.entries(cleanConfig.params).filter(([_, v]) => v !== undefined && v !== null)
        );
      }

      const response: AxiosResponse<WebResponseDTO<T>> = await api.get(url, cleanConfig);
      console.log(`🧩 Full GET API response:`, response.data);
      if (response.data.flag) {
        return response.data;
      }
      throw new Error(response.data.message || "Failed to fetch data");
    } catch (error: unknown) {
      console.error("❌ Error in GET operation:", error);
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || error.message || "Failed to fetch data"
        : "Failed to fetch data";
      throw new Error(errorMessage);
    }
  }

  /**
   * ➕ Register new timesheets (POST)
   */
  async createTimesheets(timesheets: TimeSheetModel | TimeSheetModel[]): Promise<WebResponseDTOObject> {
    const list = Array.isArray(timesheets) ? timesheets : [timesheets];
    const payload = list.map((ts) => ({
      workDate: ts.workDate,
      hoursWorked: Number(ts.hoursWorked),
      taskName: ts.taskName ?? '',
      taskDescription: ts.taskDescription ?? '',
    }));
    console.debug('[TimesheetService] createTimesheets payload:', payload);
    return this._mutation(
      "/employee/timesheet/register",
      "post",
      payload,
      undefined,
      false,
      "Timesheets created successfully",
      "Failed to create timesheets"
    );
  }

  /**
   * ✏️ Update timesheet (PUT)
   */
  async updateTimesheet(timesheetId: string, timesheet: TimeSheetModel): Promise<WebResponseDTO<string>> {
    if (!timesheetId) {
      return {
        flag: false,
        message: "Timesheet ID is required",
        status: 400,
        response: '',
        totalRecords: 0,
        otherInfo: null,
      };
    }

    const model = {
      ...(timesheet.timesheetId && { timesheetId: timesheet.timesheetId }),
      workDate: timesheet.workDate,
      hoursWorked: Number(timesheet.hoursWorked),
      taskName: timesheet.taskName ?? '',
      taskDescription: timesheet.taskDescription ?? '',
    };

    const payload = [model];
    const params = { timesheetIds: timesheetId };
    console.debug('[TimesheetService] updateTimesheet params:', params, 'payload:', payload);

    return this._mutation(
      "/employee/timesheet/update",
      "put",
      payload,
      { params },
      false,
      "Timesheet updated successfully",
      "Failed to update timesheet"
    );
  }

  /**
   * ❌ Delete a timesheet (DELETE)
   */
  async deleteTimesheet(timesheetId: string): Promise<WebResponseDTO<string>> {
    if (!timesheetId) {
      return {
        flag: false,
        message: "Timesheet ID is required",
        status: 400,
        response: '',
        totalRecords: 0,
        otherInfo: null,
      };
    }

    return this._mutation(
      "/employee/timesheet/delete",
      "delete",
      undefined,
      { params: { timesheetId } },
      false,
      "Timesheet deleted successfully",
      "Failed to delete timesheet"
    );
  }

  /**
   * 📤 Submit timesheets for manager approval (GET)
   * @param timesheetIds Array of timesheet IDs to submit
   * @returns WebResponseDTO with success/failure info
   */
  async submitForApproval(timesheetIds: string[]): Promise<WebResponseDTO<string>> {
    console.debug('[TimesheetService] submitForApproval - input:', {
      timesheetIds,
      count: timesheetIds?.length ?? 0
    });

    // Validate input
    if (!timesheetIds?.length) {
      console.warn('[TimesheetService] submitForApproval - no timesheet IDs provided');
      return {
        flag: false,
        message: "At least one timesheet ID is required for submission",
        status: 400,
        response: '',
        totalRecords: 0,
        otherInfo: null,
      };
    }

    // Remove any duplicate IDs
    const uniqueIds = Array.from(new Set(timesheetIds));
    if (uniqueIds.length !== timesheetIds.length) {
      console.warn('[TimesheetService] submitForApproval - Found duplicate IDs, filtered to unique set');
    }

    try {
      const result = await this._mutation(
        "/employee/timesheet/approvaltomanager",
        "get",
        undefined,
        { params: { timesheetIds: uniqueIds } },
        false,
        "Timesheets submitted for approval successfully",
        "Failed to submit timesheets for approval"
      );

      console.debug('[TimesheetService] submitForApproval - result:', {
        success: result.flag,
        message: result.message,
        status: result.status
      });

      return result;
    } catch (error) {
      console.error('[TimesheetService] submitForApproval - error:', error);
      throw error;
    }
  }

  /**
   * ✅ Manager Approves timesheets (PATCH)
   */
  async approveTimesheetsByManager(timesheetIds: string[]): Promise<WebResponseDTO<string>> {
    if (!timesheetIds || timesheetIds.length === 0) {
      return {
        flag: false,
        message: "At least one timesheet ID is required for approval",
        status: 400,
        response: '',
        totalRecords: 0,
        otherInfo: null,
      };
    }

    return this._mutation(
      "/employee/manager/approve",
      "patch",
      undefined,
      { params: { timesheetsIds: timesheetIds } },
      false,
      "Timesheets approved successfully",
      "Failed to approve timesheets"
    );
  }

  /**
   * 🚫 Manager Rejects timesheets (PATCH)
   */
  async rejectTimesheetsByManager(timesheetIds: string[]): Promise<WebResponseDTO<string>> {
    if (!timesheetIds || timesheetIds.length === 0) {
      return {
        flag: false,
        message: "At least one timesheet ID is required for rejection",
        status: 400,
        response: '',
        totalRecords: 0,
        otherInfo: null,
      };
    }

    return this._mutation(
      "/employee/manager/reject",
      "patch",
      undefined,
      { params: { timesheetsIds: timesheetIds } },
      false,
      "Timesheets rejected successfully",
      "Failed to reject timesheets"
    );
  }

  /**
   * 📄 Fetch timesheets list (GET)
   */
async getAllTimesheets(params?: {
  page?: number;
  size?: number;
  direction?: string;
  orderBy?: string;
  startDate?: string;
  endDate?: string;
}): Promise<WebResponseDTOList<TimeSheetResponseDto>> {
  // Default values for every call
  const defaultParams = {
    page: 0,
    size: 25,
    direction: "DESC",
    orderBy: "createdAt",
  };

  // Merge defaults with user-provided params and remove null/undefined
  const cleanParams = Object.fromEntries(
    Object.entries({ ...defaultParams, ...params }).filter(
      ([_, v]) => v !== undefined && v !== null
    )
  );

  return this._query<TimeSheetResponseDto[]>("/employee/view/timesheet", { params: cleanParams });
}

  /**
   * 🔍 Get single timesheet by ID (GET)
   */
  async getTimesheetById(timesheetId: string): Promise<WebResponseDTO<TimeSheetResponseDto>> {
    return this._query<TimeSheetResponseDto>(`/employee/view/timesheet/${timesheetId}`);
  }
}

export const timesheetService = new TimesheetService();