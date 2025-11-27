import api from "./axios";
import type {
  HolidaysModel,
  HolidaysDTO,
  WebResponseDTOHolidaysDTO,
  WebResponseDTOListHolidaysDTO,
  WebResponseDTOGeneric,
} from "@/lib/api/types";

export class HolidayService {
  // Add Holiday
  async addHoliday(request: HolidaysModel): Promise<WebResponseDTOGeneric> {
    try {
      const response = await api.post("/web/api/v1/simple/holiday/add", request);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add holiday: ${error}`);
    }
  }

  // Update Holiday
  async updateHoliday(holidayId: string, request: HolidaysModel): Promise<WebResponseDTOGeneric> {
    try {
      const response = await api.put(
        `/web/api/v1/simple/holiday/update/${holidayId}`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update holiday: ${error}`);
    }
  }

  // Get holiday by Id  getHolidayById(holidayId: string)
  async getHolidayById(holidayId: string): Promise<WebResponseDTOHolidaysDTO> {
    try {
      const response = await api.get("/web/api/v1/simple/holiday/get/byId", {params: { holidayId },});
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get holiday by Id: ${error}`);
    }
  }

  // Get all holidays
  async getAllHolidays(): Promise<WebResponseDTOListHolidaysDTO> {
    try {
      const response = await api.get("/web/api/v1/simple/holiday/get/all");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch all holidays: ${error}`);
    }
  }

  // Delete holiday
  async deleteHoliday(holidayId: string): Promise<WebResponseDTOGeneric> {
    try {
      const response = await api.delete(
        `/web/api/v1/simple/holiday/delete/${holidayId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete holiday: ${error}`);
    }
  }
}

// Export instance
export const holidayService = new HolidayService();
