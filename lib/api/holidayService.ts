// lib/api/holidayService.ts
import api from "./axios";
import type {
  WebResponseDTOHolidaysDTO,
  WebResponseDTOListHolidaysDTO,
  WebResponseDTO,
  HolidaysModel,
} from "@/lib/api/types";

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
    } catch (error) {
      this.handleError(error);
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
    } catch (error) {
      this.handleError(error);
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
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get all holidays
  async getAllHolidays(): Promise<WebResponseDTOListHolidaysDTO> {
    try {
      const response = await api.get("/simple/holiday/get/all");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Delete holiday
  async deleteHoliday(
    holidayId: string
  ): Promise<WebResponseDTO<string>> {
    try {
      const response = await api.delete(
        `/simple/holiday/delete/${holidayId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Export instance
export const holidayService = new HolidayService();
