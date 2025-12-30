// DTO types (adjust names if you already have them)
import api from "./axios";
import {
  WebResponseDTO,
  WebResponseDTOLeaveCalendarDTO,
  LeaveCalendarDTO
} from "./types";
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
export const LeaveCalendarService = {
    async getLeaveCalendar(
      month: number,
      year: number
    ): Promise<LeaveCalendarDTO[]> {
      try {
        const response: AxiosResponse<WebResponseDTOLeaveCalendarDTO> =
          await api.get("/employee/leave/calendar", {
            params: { month, year },
          });
    
        console.log(
          "🗓️ Leave calendar API response:",
          response.data.response
        );
    
        if (response.data.flag && response.data.response) {
          return response.data.response;
        }
    
        throw new Error(response.data.message || "Failed to fetch leave calendar");
      } catch (error: any) {
        throw new Error(getBackendError(error));
      }
    }   ,

     // ---------------------------------------
  // Export Leave Calendar
  // ---------------------------------------
  async exportLeaveCalendar(month: number, year: number): Promise<string> {
    try {
      const response = await api.get(
        "/employee/leave/calendar/export",
        {
          params: { month, year },
        }
      );
  
      /**
       * Backend returns PLAIN STRING
       * Example:
       *  - file URL
       *  - CSV text
       */
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  
  

}