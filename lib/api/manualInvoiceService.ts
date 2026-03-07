import { AxiosResponse } from "axios";
import api from "./axios";


import {
  WebResponseDTO,
  ClientMinDTO,
  ClientEmployeeMinResponseDTO,
  ManualInvoiceRequestDTO
} from "./types";

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

export const manualInvoiceService = {
    // Get all clients (minimal data)
    async getAllClientsMin(): Promise<WebResponseDTO<ClientMinDTO[]>> {
        try {
          const response: AxiosResponse<WebResponseDTO<ClientMinDTO[]>> =
            await api.get("/admin/client/all/min");
      
          return response.data;
        } catch (error: any) {
          throw new Error(getBackendError(error));
        }
      },

   // Get employees by client ID (minimal data)
      async getEmployeesByClientId(
        clientId: string,
        isForCourierInvoice?: boolean,
        month?: number,
        year?: number
      ): Promise<WebResponseDTO<ClientEmployeeMinResponseDTO>> {
        try {
          const params: any = {};
          if (isForCourierInvoice !== undefined) {
            params.isForCourierInvoice = isForCourierInvoice;
          }
          if (month !== undefined) {
            params.month = month;
          }
          if (year !== undefined) {
            params.year = year;
          }
          const response: AxiosResponse<
            WebResponseDTO<ClientEmployeeMinResponseDTO>
          > = await api.get(`/admin/emp/all/min/${clientId}`, {
            params,
          });
      
          return response.data;
        } catch (error: any) {
          throw new Error(getBackendError(error));
        }
      },

      // Generate manual invoice
      async generateManualInvoice(
        payload: ManualInvoiceRequestDTO,
        isForCourierInvoice: boolean
      ): Promise<WebResponseDTO<any>> {
        try {
          const response: AxiosResponse<WebResponseDTO<any>> =
            await api.post("/invoice/generate/manual", payload,
              {
                params: {
                  isForCourierInvoice,
                },
              }
            );
      
          return response.data;
        } catch (error: any) {
          throw new Error(getBackendError(error));
        }
      }
      
};