// lib/api/holidayService.ts
import api from "./axios";
import type {
  WebResponseDTOHolidaysDTO,
  WebResponseDTOListHolidaysDTO,
  WebResponseDTO,
  HolidaysModel,
  HolidayUpdateRequestDTO,
} from "@/lib/api/types";
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

export class HolidayService {
  
  // Extract only backend error message
  private handleError(error: any): never {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Something went wrong";

    throw new Error(backendMessage);
  }

  // Add Holiday
  async addHoliday(request: HolidaysModel): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.post("simple/holiday/add", request);
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  // Update Holiday
  async updateHoliday(
    holidayId: string,
    request: HolidaysModel
  ): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.put(
        `/simple/holiday/update/${holidayId}`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  // Get holiday by Id
  async getHolidayById(
    holidayId: string
  ): Promise<WebResponseDTOHolidaysDTO> {
    try {
      const response = await api.get("/simple/holiday/get/byId", {
        params: { holidayId },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
  // Get all holidays of the selected employee
  // async getAllHolidays(): Promise<WebResponseDTOListHolidaysDTO> {
  //   try {
  //     const response = await api.get("/simple/holiday/timesheet/get/all");
  //     return response.data;
  //   } 
  //   catch (error: any) {
  //     throw error;
  //   }
  // }


// lib/api/holidayService.ts
async getAllHolidays(
  year?: number,
  employeeId?: string
): Promise<WebResponseDTOListHolidaysDTO> {
  try {
    const params = new URLSearchParams();

    if (year) {
      params.append("year", year.toString());
    }

    // pass only if valid UUID (manager/admin case)
    if (employeeId && employeeId.includes("-")) {
      params.append("employeeId", employeeId);
    }

    const response = await api.get(
      `/simple/holiday/employee-specific/get/all?${params.toString()}`
    );

    return response.data;
  } catch (error: any) {
    throw error;
  }
}


  // Get all holidays for Leave calendar view (Admin)
async getAllHolidaysView(
  year?: number
): Promise<WebResponseDTOListHolidaysDTO> {
  try {
    const params = new URLSearchParams();

    if (year) {
      params.append("year", year.toString());
    }

    const response = await api.get(
      `/simple/holiday/leave/calendar/get/all?${params.toString()}`
    );

    return response.data;
  } catch (error: any) {
    throw error;
  }
}

// async getAllHolidaysview(): Promise<WebResponseDTOListHolidaysDTO> {
//   try {
//     const response = await api.get("/simple/holiday/leave/calendar/get/all");
//     return response.data;
//   } 
//   catch (error: any) {
//     throw error;
//   }
// }

  // Delete holiday
  async deleteHoliday(
    holidayId: string
  ): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.delete(
        `/simple/holiday/delete/${holidayId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  // Submit holiday add/remove request (approval workflow)
  async submitHolidayUpdateRequest(
    request: HolidayUpdateRequestDTO[]
  ): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.post(
        "/employee/update-request/submit/holiday",
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }

  }
// Export instance
export const holidayService = new HolidayService();
