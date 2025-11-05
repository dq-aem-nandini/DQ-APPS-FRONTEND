//lib/api/leaveService.ts
import api from './axios';
import { employeeService } from './employeeService';
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
  WebResponseDTOLeaveAvailabilityDTO,
  WebResponseDTOString,
  WebResponseDTOListPendingLeavesResponseDTO,
  PendingLeavesResponseDTO,
  User,
  EmployeeDTO,
  WebResponseDTOListEmployeeLeaveDayDTO,
  EmployeeLeaveDayDTO,
} from './types';
import { AxiosResponse, AxiosError } from 'axios';

export const leaveService = {
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
    } catch (error) {
      console.error('❌ Error applying for leave:', error);
      throw new Error(`Failed to apply for leave: ${error}`);
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
    } catch (error) {
      console.error('❌ Error updating leave:', error);
      throw new Error(`Failed to update leave: ${error}`);
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
    } catch (error) {
      console.error('❌ Error updating leave status:', error);
      throw new Error(`Failed to update leave status: ${error}`);
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
    } catch (error) {
      console.error('❌ Error withdrawing leave:', error);
      throw new Error(`Failed to withdraw leave: ${error}`);
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
    } catch (error) {
      console.error('❌ Error fetching leave by ID:', error);
      throw new Error(`Failed to fetch leave by ID: ${error}`);
    }
  },

  /**
   * Calculate working days between dates (POST with body).
   */
  async calculateWorkingDays(range: DateRangeRequestDTO): Promise<WorkdayResponseDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOWorkdayResponseDTO> = await api.post(
        '/employee/workDays',
        range
      );

      console.log('🧩 Full calculate working days API response:', response.data.response);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to calculate working days');
    } catch (error) {
      console.error('❌ Error calculating working days:', error);
      throw new Error(`Failed to calculate working days: ${error}`);
    }
  },

  /**
   * Check leave availability (POST with query params).
   */
  async checkLeaveAvailability(employeeId: string, leaveDuration: number): Promise<LeaveAvailabilityDTO> {
    try {
      const params = new URLSearchParams();
      params.append('employeeId', employeeId);
      params.append('leaveDuration', leaveDuration.toString());

      const response: AxiosResponse<WebResponseDTOLeaveAvailabilityDTO> = await api.post(
        `/employee/leave/checkLeaveAvailability?${params.toString()}`,
        {}
      );

      console.log('🧩 Full check leave availability API response:', response.data.response);

      if (response.data.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data.message || 'Failed to check leave availability');
    } catch (error) {
      console.error('❌ Error checking leave availability:', error);
      throw new Error(`Failed to check leave availability: ${error}`);
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
        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append('sort', sort);

        const response: AxiosResponse<WebResponseDTOPageLeaveResponseDTO> = await api.get(
          `/employee/leave-summary`,
          { params }
        );

        console.log('🧩 Full leave summary API response:', response.data);

        if (response.data.flag && response.data.response) {
          return response.data;
        }

        throw new Error(response.data.message || 'Failed to fetch leave summary');
      } catch (error: unknown) {
        retryCount++;
        console.error(`❌ Error fetching leave summary (Attempt ${retryCount}/${maxRetries}):`, error);
        if (retryCount > maxRetries) {
          let errorMessage = 'Failed to fetch leave summary';
          let errorStatus = 500;
          if (error instanceof AxiosError) {
            errorMessage = error.response?.data?.message || error.message || 'Failed to fetch leave summary';
            errorStatus = error.response?.status || 500;
          }
          return {
            flag: false,
            message: errorMessage,
            status: errorStatus,
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
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
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
  async getPendingLeaves(maxRetries: number = 3): Promise<PendingLeavesResponseDTO[]> {
    let retryCount = 0;
    while (retryCount <= maxRetries) {
      try {
        const response: AxiosResponse<WebResponseDTOListPendingLeavesResponseDTO> = await api.get(
          '/employee/leave/pendingLeaves'
        );

        console.log('🧩 Full pending leaves API response:', response.data.response);

        if (response.data.flag && response.data.response) {
          return response.data.response;
        }

        throw new Error(response.data.message || 'Failed to fetch pending leaves');
      } catch (error) {
        retryCount++;
        console.error(`❌ Error fetching pending leaves (Attempt ${retryCount}/${maxRetries}):`, error);
        if (retryCount > maxRetries) {
          return [];
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }
    return [];
  },

  /**
   * Get leave dashboard data (fetches real employee balances + categorized requests; no hardcoded values).
   */
  async getLeaveDashboard(user: User): Promise<{
    balances: { availableLeaves: number };
    pendingRequests: LeaveResponseDTO[];
    approvedRequests: LeaveResponseDTO[];
    rejectedRequests: LeaveResponseDTO[];
    withdrawnRequests: LeaveResponseDTO[];
    totalLeavesTaken: number;
    remainingLeaves: number;
    error?: string;
  }> {
    try {
      let availableLeaves = 0;
      try {
        const employeeResponse: EmployeeDTO = await employeeService.getEmployeeById();
        if (employeeResponse) {
          availableLeaves = employeeResponse.availableLeaves || 0;
        } else {
          console.warn('⚠️ Employee response invalid');
        }
      } catch (empError) {
        console.warn('⚠️ Error fetching employee details:', empError);
        availableLeaves = 0;
      }

      let summary: PageLeaveResponseDTO;
      try {
        const response = await this.getLeaveSummary(user.userId);
        if (!response.flag || !response.response) {
          throw new Error(response.message || 'Failed to fetch leave summary');
        }
        summary = response.response;
      } catch (sumError) {
        console.warn('⚠️ Error fetching leave summary, using empty data:', sumError);
        summary = {
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
          numberOfElements: 0,
          pageable: {
            paged: true,
            unpaged: false,
            pageNumber: 0,
            pageSize: 10,
            offset: 0,
            sort: { sorted: false, unsorted: true, empty: true },
          },
          size: 10,
          content: [],
          number: 0,
          sort: { sorted: false, unsorted: true, empty: true },
          empty: true,
        };
      }

      const pendingRequests = summary.content.filter((req) => req.status === 'PENDING');
      const approvedRequests = summary.content.filter((req) => req.status === 'APPROVED');
      const rejectedRequests = summary.content.filter((req) => req.status === 'REJECTED');
      const withdrawnRequests = summary.content.filter((req) => req.status === 'WITHDRAWN');

      const totalLeavesTaken = approvedRequests.reduce((sum, req) => sum + (req.leaveDuration ?? 0), 0);
      const remainingLeaves = Math.max(0, availableLeaves - totalLeavesTaken);

      return {
        balances: { availableLeaves },
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        withdrawnRequests,
        totalLeavesTaken,
        remainingLeaves,
      };
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      return {
        balances: { availableLeaves: 0 },
        pendingRequests: [],
        approvedRequests: [],
        rejectedRequests: [],
        withdrawnRequests: [],
        totalLeavesTaken: 0,
        remainingLeaves: 0,
        error: 'Failed to load leave dashboard data. Please try refreshing or contact support if the issue persists.',
      };
    }
  },
  async getApprovedLeaves(year?: string): Promise<EmployeeLeaveDayDTO[]> {
    try {
      // Backend expects LocalDate format (ISO: YYYY-MM-DD), so pass as string
      const currentYear = year || new Date().getFullYear().toString();
      const formattedDate = `${currentYear}-01-01`; // Matches LocalDate.toString() in backend
  
      const params = new URLSearchParams();
      params.append('currentYear', formattedDate); // Send as string; backend parses to LocalDate
  
      const response: AxiosResponse<WebResponseDTOListEmployeeLeaveDayDTO> = await api.get(
        `/employee/approved/leaves`,
        { params }
      );
  
      console.log('🧩 Full approved leaves API response:', response.data.response);
  
      if (response.data.flag && response.data.response) {
        return response.data.response;
      }
  
      throw new Error(response.data.message || 'Failed to fetch approved leaves');
    } catch (error) {
      console.error('❌ Error fetching approved leaves:', error);
      throw new Error(`Failed to fetch approved leaves: ${error}`);
    }
  }
};