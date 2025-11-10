//lib/api/holidayService.ts
import { AxiosError, AxiosResponse } from "axios";
import { HolidayCalendarDTO, HolidayCalendarModel, HolidaySchemeModel, WebResponseDTO, WebResponseDTOListHolidaySchemeDTO } from "./types";
import api from "./axios";
interface GetSchemesParams {
  schemeCountryCode?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "ASC" | "DESC";
}
class HolidaysService {

  /**
   * Create a new holiday scheme (POST with body).
   */
  async createScheme(scheme: HolidaySchemeModel): Promise<WebResponseDTO<string>> {
    try {
      const response: AxiosResponse<WebResponseDTO<string>> = await api.post(
        '/holidays/scheme/register',
        scheme
      );
      console.log('🧩 Full create scheme API response:', response.data);
      const { flag, message, status, response: data, totalRecords, otherInfo } = response.data;
      return {
        flag,
        message: message || (flag ? 'Scheme created successfully' : 'Failed to create scheme'),
        status: status ?? (flag ? 200 : 400),
        response: data ?? '',
        totalRecords: totalRecords ?? 0,
        otherInfo: otherInfo ?? null,
      };
    } catch (error: unknown) {
      console.error('❌ Error creating scheme:', error);
      let errorMessage = 'Failed to create scheme';
      let errorStatus = 500;
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.message || 'Failed to create scheme';
        errorStatus = error.response?.status || 500;
      }
      return {
        flag: false,
        message: errorMessage,
        status: errorStatus,
        response: '',
        totalRecords: 0,
        otherInfo: null,
      };
    }
  }

/**
 * Update a holiday scheme (PUT with PATH param id and body).
 */
async updateScheme(id: string, scheme: HolidaySchemeModel): Promise<WebResponseDTO<string>> {
  if (!id) throw new Error('Scheme ID is required');

  try {
    console.log('Updating scheme ID (PATH):', id);
    console.log('Payload:', JSON.stringify(scheme, null, 2));

    const response: AxiosResponse<WebResponseDTO<string>> = await api.put(
      `/holidays/scheme/update/${id}`,  // PATH PARAM
      scheme
      // NO { params: { id } } — it's in URL now
    );

    console.log('Full update response:', response.data);
    const { flag, message, status, response: data, totalRecords, otherInfo } = response.data;

    return {
      flag,
      message: message || (flag ? 'Scheme updated successfully' : 'Failed to update scheme'),
      status: status ?? (flag ? 200 : 400),
      response: data ?? '',
      totalRecords: totalRecords ?? 0,
      otherInfo: otherInfo ?? null,
    };
  } catch (error: unknown) {
    console.error('Error updating scheme:', error);
    let errorMessage = 'Failed to update scheme';
    let errorStatus = 500;

    if (error instanceof AxiosError) {
      console.error('Axios error:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      errorMessage = error.response?.data?.message || error.message || 'Failed to update scheme';
      errorStatus = error.response?.status || 500;
    }

    return {
      flag: false,
      message: errorMessage,
      status: errorStatus,
      response: '',
      totalRecords: 0,
      otherInfo: null,
    };
  }
}

  /**
   * Delete a holiday scheme (DELETE with query param id).
   */
  async deleteScheme(id: string): Promise<WebResponseDTO<string>> {
    try {
      const response: AxiosResponse<WebResponseDTO<string>> = await api.delete(
        '/holidays/scheme/delete',
        { params: { id } }
      );
      console.log('🧩 Full delete scheme API response:', response.data);
      const { flag, message, status, response: data, totalRecords, otherInfo } = response.data;
      return {
        flag,
        message: message || (flag ? 'Scheme deleted successfully' : 'Failed to delete scheme'),
        status: status ?? (flag ? 200 : 400),
        response: data ?? '',
        totalRecords: totalRecords ?? 0,
        otherInfo: otherInfo ?? null,
      };
    } catch (error: unknown) {
      console.error('❌ Error deleting scheme:', error);
      let errorMessage = 'Failed to delete scheme';
      let errorStatus = 500;
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.message || 'Failed to delete scheme';
        errorStatus = error.response?.status || 500;
      }
      return {
        flag: false,
        message: errorMessage,
        status: errorStatus,
        response: '',
        totalRecords: 0,
        otherInfo: null,
      };
    }
  }

  /**
   * Get all holiday schemes (GET no params).
   */
  // async getAllSchemes(): Promise<WebResponseDTO<any>> {
  //   try {
  //     const response: AxiosResponse<WebResponseDTO<any>> = await api.get('/holidays/view/scheme');
  //     console.log('🧩 Full get all schemes API response:', response.data);
  //     if (response.data.flag) {
  //       return response.data;
  //     }
  //     throw new Error(response.data.message || 'Failed to fetch schemes');
  //   } catch (error: unknown) {
  //     console.error('❌ Error fetching schemes:', error);
  //     const errorMessage = error instanceof AxiosError
  //       ? error.response?.data?.message || error.message || 'Failed to fetch schemes'
  //       : 'Failed to fetch schemes';
  //     throw new Error(errorMessage);
  //   }
  // }
  async getAllSchemes(
    params: GetSchemesParams = {}
  ): Promise<WebResponseDTOListHolidaySchemeDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListHolidaySchemeDTO> = await api.get(
        "/holidays/view/scheme",
        { params }
      );
  
      console.log("Full get all schemes API response:", response.data);
  
      if (response.data.flag && Array.isArray(response.data.response)) {
        return {
          ...response.data,
          response: response.data.response.map((dto) => ({
            holidaySchemeId: dto.holidaySchemeId,
            schemeName: dto.schemeName ?? "",
            schemeDescription: dto.schemeDescription ?? "",
            createdByAdminId: dto.createdByAdminId,
            city: dto.city ?? "",
            state: dto.state ?? "",
            schemeCountryCode: dto.schemeCountryCode ?? "",
            schemeCreateAt: dto.schemeCreateAt,
            schemeUpdateAt: dto.schemeUpdateAt,
            holidayCalendarId: Array.isArray(dto.holidayCalendarId)
              ? dto.holidayCalendarId
              : [],
            schemeActive: dto.schemeActive ?? true,
          })),
        };
      }
  
      throw new Error(response.data.message || "Failed to fetch schemes");
    } catch (error: any) {
      console.error("Error fetching schemes:", error);
      throw new Error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch schemes"
      );
    }
  }
  

  /**
   * Get holiday scheme by ID (GET with path param).
   */
  async getSchemeById(id: string): Promise<WebResponseDTO<any>> {
    try {
      const response: AxiosResponse<WebResponseDTO<any>> = await api.get(`/holidays/view/scheme/${id}`);
      console.log('🧩 Full get scheme by ID API response:', response.data);
      if (response.data.flag) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to fetch scheme');
    } catch (error: unknown) {
      console.error('❌ Error fetching scheme by ID:', error);
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || error.message || 'Failed to fetch scheme'
        : 'Failed to fetch scheme';
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new holiday calendar (POST with body).
   */
  async createHoliday(holiday: HolidayCalendarModel): Promise<WebResponseDTO<string>> {
    try {
      const response: AxiosResponse<WebResponseDTO<string>> = await api.post(
        '/holidays/calendar/register',
        holiday
      );
      console.log('🧩 Full create holiday API response:', response.data);
      const { flag, message, status, response: data, totalRecords, otherInfo } = response.data;
      return {
        flag,
        message: message || (flag ? 'Holiday created successfully' : 'Failed to create holiday'),
        status: status ?? (flag ? 200 : 400),
        response: data ?? '',
        totalRecords: totalRecords ?? 0,
        otherInfo: otherInfo ?? null,
      };
    } catch (error: unknown) {
      console.error('❌ Error creating holiday:', error);
      let errorMessage = 'Failed to create holiday';
      let errorStatus = 500;
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.message || 'Failed to create holiday';
        errorStatus = error.response?.status || 500;
      }
      return {
        flag: false,
        message: errorMessage,
        status: errorStatus,
        response: '',
        totalRecords: 0,
        otherInfo: null,
      };
    }
  }

  /**
   * Update a holiday calendar (PUT with path param id and body).
   */
  async updateHoliday(id: string, holiday: HolidayCalendarModel): Promise<WebResponseDTO<string>> {
    try {
      const response: AxiosResponse<WebResponseDTO<string>> = await api.put(
        `/holidays/calendar/update/${id}`,
        holiday
      );
      console.log('🧩 Full update holiday API response:', response.data);
      const { flag, message, status, response: data, totalRecords, otherInfo } = response.data;
      return {
        flag,
        message: message || (flag ? 'Holiday updated successfully' : 'Failed to update holiday'),
        status: status ?? (flag ? 200 : 400),
        response: data ?? '',
        totalRecords: totalRecords ?? 0,
        otherInfo: otherInfo ?? null,
      };
    } catch (error: unknown) {
      console.error('❌ Error updating holiday:', error);
      let errorMessage = 'Failed to update holiday';
      let errorStatus = 500;
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.message || 'Failed to update holiday';
        errorStatus = error.response?.status || 500;
      }
      return {
        flag: false,
        message: errorMessage,
        status: errorStatus,
        response: '',
        totalRecords: 0,
        otherInfo: null,
      };
    }
  }

  /**
   * Delete a holiday calendar (DELETE with query param id).
   */
  async deleteHoliday(id: string): Promise<WebResponseDTO<string>> {
    try {
      const response: AxiosResponse<WebResponseDTO<string>> = await api.delete(
        '/holidays/calendar/delete',
        { params: { id } }
      );
      console.log('🧩 Full delete holiday API response:', response.data);
      const { flag, message, status, response: data, totalRecords, otherInfo } = response.data;
      return {
        flag,
        message: message || (flag ? 'Holiday deleted successfully' : 'Failed to delete holiday'),
        status: status ?? (flag ? 200 : 400),
        response: data ?? '',
        totalRecords: totalRecords ?? 0,
        otherInfo: otherInfo ?? null,
      };
    } catch (error: unknown) {
      console.error('❌ Error deleting holiday:', error);
      let errorMessage = 'Failed to delete holiday';
      let errorStatus = 500;
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.message || 'Failed to delete holiday';
        errorStatus = error.response?.status || 500;
      }
      return {
        flag: false,
        message: errorMessage,
        status: errorStatus,
        response: '',
        totalRecords: 0,
        otherInfo: null,
      };
    }
  }

  /**
   * Get all holiday calendars (GET no params).
   */
  async getAllCalendars(): Promise<WebResponseDTO<any>> {
    try {
      const response: AxiosResponse<WebResponseDTO<any>> = await api.get('/holidays/view/calendar');
      console.log('🧩 Full get all calendars API response:', response.data);
      if (response.data.flag) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to fetch calendars');
    } catch (error: unknown) {
      console.error('❌ Error fetching calendars:', error);
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || error.message || 'Failed to fetch calendars'
        : 'Failed to fetch calendars';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get holiday calendar by ID (GET with path param).
   */
  async getCalendarById(id: string): Promise<WebResponseDTO<HolidayCalendarDTO>> {
    try {
      const response: AxiosResponse<WebResponseDTO<HolidayCalendarDTO>> = await api.get(`/holidays/view/calendar/${id}`);
      console.log('🧩 Full get calendar by ID API response:', response.data);
      if (response.data.flag && response.data.response) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to fetch calendar');
    } catch (error: unknown) {
      console.error('❌ Error fetching calendar by ID:', error);
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || error.message || 'Failed to fetch calendar'
        : 'Failed to fetch calendar';
      throw new Error(errorMessage);
    }
  }
}

export const holidaysService = new HolidaysService();
