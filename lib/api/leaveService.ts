//lib/api/leaveService.ts
import api from './axios';
import {
  LeaveRequestDTO,
  LeaveResponseDTO,
  DateRangeRequestDTO,
  WorkdayResponseDTO,
  LeaveAvailabilityDTO,
  PageLeaveResponseDTO,
  LeaveStatus,
  LeaveCategoryType,
  FinancialType,
  WebResponseDTOLeaveResponseDTO,
  WebResponseDTOPageLeaveResponseDTO,
  WebResponseDTOWorkdayResponseDTO,
  WebResponseDTOString,
  WebResponseDTOListPendingLeavesResponseDTO,
  PendingLeavesResponseDTO,
  WebResponseDTOListEmployeeLeaveDayDTO,
  EmployeeLeaveDayDTO,
  WebResponseDTO,
  LeaveStatusCountResponseDTO,
  WebResponseDTOLeaveStatusCount,
  LeaveAdjustmentRequestDTO,
  LeaveAdjustmentResponse,
  WebResponseDTOListEmployeeDTO,
  WebResponseDTOListEmployeeDropdownDTO
} from './types';
import axios, { AxiosResponse, AxiosError } from 'axios';
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

export const leaveService = {
  /**
 * SUPER HR / HR – Apply leave for an employee
 */
  async applyLeaveBySuperHR(
    employeeId: string,
    request: LeaveRequestDTO,
    attachment?: File | null
  ): Promise<LeaveResponseDTO> {
    try {
      if (!employeeId) {
        throw new Error('employeeId is required');
      }

      const formData = new FormData();

      Object.entries(request).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });

      if (attachment) {
        formData.append('attachmentFile', attachment);
      }

      const response: AxiosResponse<WebResponseDTOLeaveResponseDTO> =
        await api.post(
          `/super-hr/employee/applyLeave`,
          formData,
          {
            params: { employeeId }, // ✅ REQUIRED
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );

      console.log('🧩 SuperHR apply leave response:', response.data.response);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to apply leave (SuperHR)');
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  ,
  /**
   * SUPER HR / HR – Delete an employee leave
   */
  async deleteLeaveBySuperHR(leaveId: string): Promise<string> {
    try {
      if (!leaveId) {
        throw new Error('leaveId is required');
      }

      const response: AxiosResponse<WebResponseDTOString> =
        await api.delete(
          `/super-hr/employee/leave/delete`,
          {
            params: { leaveId },
            headers: { Accept: '*/*' },
          }
        );

      console.log('🧩 SuperHR delete leave response:', response.data);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message);
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },
  /**
   * Apply for a new leave (POST multipart/form-data; appends fields from LeaveRequestDTO).
   */
  async applyLeave(request: LeaveRequestDTO, attachment?: File | null): Promise<LeaveResponseDTO> {
    try {
      const formData = new FormData();
      Object.keys(request).forEach((key) => {
        const value = request[key as keyof LeaveRequestDTO];
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });

      if (attachment) {
        formData.append('attachmentFile', attachment);
      }

      const response: AxiosResponse<WebResponseDTOLeaveResponseDTO> = await api.post(
        '/employee/leaveApply',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('🧩 Full apply leave API response:', response.data.response);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to apply for leave');
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * Update an existing leave request (PUT multipart/form-data; appends fields from LeaveRequestDTO).
   */
  async updateLeave(request: LeaveRequestDTO, attachment?: File | null): Promise<LeaveResponseDTO> {
    try {
      const formData = new FormData();
      Object.keys(request).forEach((key) => {
        const value = request[key as keyof LeaveRequestDTO];
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });

      if (attachment) {
        formData.append('attachmentFile', attachment);
      }

      const response: AxiosResponse<WebResponseDTOLeaveResponseDTO> = await api.put(
        '/employee/update/leave',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('🧩 Full update leave API response:', response.data.response);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to update leave');
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * Update leave status (PUT with path param and query params for status/comment).
   */
  async updateLeaveStatus(leaveId: string, status: LeaveStatus, comment?: string): Promise<LeaveResponseDTO> {
    try {
      const params = new URLSearchParams();
      params.append('status', status);
      if (comment) params.append('comment', comment);

      const response: AxiosResponse<WebResponseDTOLeaveResponseDTO> = await api.put(
        `/employee/leave/updateStatus/${leaveId}?${params.toString()}`,
        {}
      );

      console.log('🧩 Full update leave status API response:', response.data.response);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to update leave status');
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * Withdraw a leave request (PUT with query param for ID).
   */
  async withdrawLeave(leaveId: string): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append('id', leaveId);

      const response: AxiosResponse<WebResponseDTOString> = await api.put(
        `/employee/leave/withdrawn?${params.toString()}`,
        {}
      );

      console.log('🧩 Full withdraw leave API response:', response.data.response);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to withdraw leave');
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * Get leave by ID (GET with path param).
   */
  async getLeaveById(leaveId: string): Promise<LeaveResponseDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOLeaveResponseDTO> = await api.get(
        `/employee/view/leave/${leaveId}`
      );

      console.log('🧩 Full get leave by ID API response:', response.data.response);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to fetch leave');
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },
  
  /**
 * Calculate working days between dates (POST with body + optional employeeId)
 */
  async calculateWorkingDays(
    range: DateRangeRequestDTO,
    employeeId?: string,
    leaveId?: string
  ): Promise<WorkdayResponseDTO> {
    try {
      const params = new URLSearchParams();
  
      if (employeeId) {
        params.append("employeeId", employeeId);
      }
  
      if (leaveId) {
        params.append("leaveId", leaveId);
      }
  
      const queryString = params.toString();
      const url = queryString
        ? `/employee/workDays?${queryString}`
        : `/employee/workDays`;
  
      const response: AxiosResponse<WebResponseDTOWorkdayResponseDTO> =
        await api.post(url, range);
  
      if (response.data.flag && response.data.response) {
        return response.data.response;
      }
  
      throw new Error(
        response.data.message || "Failed to calculate working days"
      );
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },
  


  /**
   * Check leave availability (POST with query params).
   */

  async checkLeaveAvailability(employeeId: string, leaveDuration: number): Promise<LeaveAvailabilityDTO> {
    // Client-side validation    
    if (!employeeId || typeof employeeId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId)) {
      throw new Error('Invalid employee ID: must be a valid UUID string');
    }
    if (!Number.isFinite(leaveDuration) || leaveDuration <= 0) {
      throw new Error('Invalid leave duration: must be a positive number');
    }

    try {
      const params = new URLSearchParams();
      params.append('employeeId', employeeId);
      params.append('leaveDuration', leaveDuration.toString());

      const response: AxiosResponse<WebResponseDTO<LeaveAvailabilityDTO>> = await api.post(
        `/employee/leave/checkLeaveAvailability?${params.toString()}`,
        {},
        { headers: { 'Accept': '*/*' } }
      );

      console.log('🧩 Full check leave availability API response:', response.data);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to check leave availability');
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },
  /**
   * Get paginated leave summary (for dashboard; uses filters like employeeId, status, etc.).
   */
  async getLeaveSummary(
    employeeId?: string,
    month?: string,
    type?: LeaveCategoryType,
    status?: LeaveStatus,
    financialType?: FinancialType,
    futureApproved?: boolean,
    date?: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'fromDate,desc',
    teamView?: boolean,
    maxRetries: number = 3
  ): Promise<WebResponseDTOPageLeaveResponseDTO> {
    let retryCount = 0;
    while (retryCount <= maxRetries) {
      try {
        const params = new URLSearchParams();
        if (employeeId) params.append('employeeId', employeeId);
        if (month) params.append('month', month);
        if (type) params.append('leaveCategory', type);
        if (status) params.append('status', status);
        if (financialType) params.append('financialType', financialType);
        if (futureApproved !== undefined) params.append('futureApproved', futureApproved.toString());
        if (date) params.append('date', date);
        if (teamView !== undefined) {
          params.append('teamView', teamView.toString());
        }        
        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append('sort', sort);

        const response: AxiosResponse<WebResponseDTOPageLeaveResponseDTO> = await api.get(
          `/employee/leave-summary`,
          { params }
        );

        // console.log('🧩 Full leave summary API response:', response.data);

        if (response.data.flag && response.data.response) {
          return response.data;
        }

        throw new Error(response.data.message || 'Failed to fetch leave summary');
      } catch (error: any) {
        throw new Error(getBackendError(error));
      }
    }
    return {
      flag: false,
      message: 'Failed to fetch leave summary after retries',
      status: 500,
      response: {
        content: [],
        totalPages: 0,
        totalElements: 0,
        first: true,
        last: true,
        numberOfElements: 0,
        pageable: { paged: true, unpaged: false, pageNumber: 0, pageSize: 10, offset: 0, sort: { sorted: true, unsorted: false, empty: false } },
        size: 0,
        number: 0,
        sort: { sorted: true, unsorted: false, empty: false },
        empty: true,
      },
      totalRecords: 0,
      otherInfo: {},
    };
  },

  /**
   * Get pending leaves for manager dashboard (GET no params).
   */
  async getPendingLeaves(
    teamView: boolean = false,
    maxRetries: number = 3
  ): Promise<PendingLeavesResponseDTO[]> {
  
    let retryCount = 0;
  
    while (retryCount <= maxRetries) {
      try {
        const response: AxiosResponse<WebResponseDTOListPendingLeavesResponseDTO> =
          await api.get('/employee/leave/pendingLeaves', {
            params: {
              teamView
            }
          });
  
        if (response.data.flag && response.data.response) {
          return response.data.response;
        }
  
        throw new Error(response.data.message || 'Failed to fetch pending leaves');
      } catch (error: any) {
        throw new Error(getBackendError(error));
      }
    }
  
    return [];
  },
  
  // Get leave status counts for dashboard (GET no params).
  async getLeaveStatusCount(): Promise<LeaveStatusCountResponseDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOLeaveStatusCount> =
        await api.get(`/employee/leave/status/count`);

      console.log("🧩 Leave Status Count API response:", response.data);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || "Failed to fetch leave status count");
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * Get approved leaves for an employee in a given year (GET with query params).
   */
  async getApprovedLeaves(year?: string, employeeId?: string,): Promise<EmployeeLeaveDayDTO[]> {
    try {
      // 🧩 1️⃣ Determine correct year format for backend (LocalDate -> "YYYY-01-01")
      const currentYear = year
        ? `${year}-01-01`
        : `${new Date().getFullYear()}-01-01`;

      const params = new URLSearchParams();

      // 🧩 2️⃣ Only include employeeId if it's a MANAGER call
      // (employeeId must be a valid UUID, not the logged-in user’s numeric ID)
      const isManagerCall = employeeId && employeeId.includes('-'); // crude UUID check

      if (isManagerCall) {
        params.append('employeeId', employeeId);
      }

      // 🧩 3️⃣ Always append currentYear (as LocalDate string)
      params.append('currentYear', currentYear);

      // 🧩 4️⃣ API call
      const response: AxiosResponse<WebResponseDTOListEmployeeLeaveDayDTO> = await api.get(
        `/employee/approved/leaves`,
        { params }
      );
      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to fetch approved leaves');
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
 * Adjust leave balances in bulk (ADMIN / HR only)
 */
  async adjustLeaveCount(
    payload: LeaveAdjustmentRequestDTO[]
  ): Promise<LeaveAdjustmentResponse> {
    try {
      // Basic validation
      if (!Array.isArray(payload) || payload.length === 0) {
        throw new Error('Adjustment payload cannot be empty');
      }

      payload.forEach((item) => {
        if (!item.employeeId || typeof item.adjustment !== 'number') {
          throw new Error('Invalid leave adjustment payload');
        }
      });

      const response: AxiosResponse<WebResponseDTO<LeaveAdjustmentResponse>> =
        await api.post(
          '/employee/leave/adjust',
          payload
        );

      console.log('🧩 Adjust leave API response:', response.data.response);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to adjust leave balances');
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
 * Get all employees except logged-in HR ( HR only)
 */
  // ✅ Get all employees
  async getAllEmployeesExceptLoginHR(): Promise<WebResponseDTOListEmployeeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListEmployeeDTO> = await api.get('employee/emp/all/except/loginHR');
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },
  /**
 * Get Leave Approval History (Manager / HR)
 */
async getLeaveApprovalHistory(
  employeeId?: string,
  month?: string,
  financialType?: FinancialType,
  leaveCategory?: LeaveCategoryType,
  status?: LeaveStatus,
  date?: string,
  page: number = 0,
  size: number = 10,
  sort: string = 'createdAt,desc'
): Promise<WebResponseDTOPageLeaveResponseDTO> {
  try {
    const params = new URLSearchParams();

    if (employeeId) params.append('employeeId', employeeId);
    if (month) params.append('month', month);
    if (financialType) params.append('financialType', financialType);
    if (leaveCategory) params.append('leaveCategory', leaveCategory);
    if (status) params.append('status', status);
    if (date) params.append('date', date);

    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sort', sort);

    const response: AxiosResponse<WebResponseDTOPageLeaveResponseDTO> =
      await api.get(`/employee/leave/approval/history`, { params });

    console.log('🧩 Leave Approval History API response:', response.data);

    if (response.data.flag && response.data.response) {
      return response.data;
    }

    throw new Error(
      response.data.message || 'Failed to fetch leave approval history'
    );
  } catch (error: any) {
    throw new Error(getBackendError(error));
  }
},
/**
 * Get Employees for Leave Approval Dropdown (Manager / HR)
 */
async getApprovalEmployees(): Promise<WebResponseDTOListEmployeeDropdownDTO> {
  try {
    const response: AxiosResponse<WebResponseDTOListEmployeeDropdownDTO> =
      await api.get(`/employee/leave/approval/employees`, {
        headers: { Accept: '*/*' }
      });

    console.log('🧩 Approval Employees API response:', response.data);

    if (response.data.flag && response.data.response) {
      return response.data;
    }

    throw new Error(
      response.data.message || 'Failed to fetch approval employees'
    );
  } catch (error: any) {
    throw new Error(getBackendError(error));
  }
}
};
