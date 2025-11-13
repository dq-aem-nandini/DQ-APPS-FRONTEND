//lib/api/managerTimeSheetService.ts
import api from "./axios";
import {
  WebResponseDTOListTimeSheetResponseDto,
  WebResponseDTOString,
  TimeSheetResponseDto,
  WebResponseDTOListEmployeeDTO,
} from "./types";

export const managerTimeSheetService = {
      /**
   * Get list of employees under the manager
   */
  async getEmployeesUnderManager(): Promise<WebResponseDTOListEmployeeDTO> {
    const res = await api.get("/employee/manager/employees");
    return res.data;
  },

  /**
   * Get timesheets of a selected employee
   */
  async getEmployeeTimesheets(employeeId: string, page = 0, size = 25): Promise<WebResponseDTOListTimeSheetResponseDto> {
    const res = await api.get("/employee/manager/timesheet/list", {
      params: { employeeId, page, size },
    });
    return res.data;
  },

  async approveTimesheets(timesheetIds: string[], comment: string): Promise<WebResponseDTOString> {
    const res = await api.patch("/employee/manager/approve", null, {
      params: { timesheetsIds: timesheetIds,
                managerComment: comment
       },
      paramsSerializer: { indexes: null }, // ensures timesheetsIds=uuid1&timesheetsIds=uuid2
    });
    return res.data;
  },

  async rejectTimesheets(timesheetIds: string[], comment: string): Promise<WebResponseDTOString> {
    const res = await api.patch("/employee/manager/reject", null, {
      params: { timesheetsIds: timesheetIds, 
                managerComment: comment
       },
      paramsSerializer: { indexes: null },
    });
    return res.data;
  },
};
