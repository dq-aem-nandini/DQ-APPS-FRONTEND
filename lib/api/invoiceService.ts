// /lib/api/invoiceService.ts - Fix getInvoiceById to return WebResponseDTOInvoiceDTO
import api from './axios';
import {
  ClientInvoiceSummaryDTO,
  InvoiceDTO,
  WebResponseDTOInvoiceDTO,
  WebResponseDTOListClientInvoiceSummaryDTO,
  WebResponseDTOListInvoiceDTO,
} from './types';
import { AxiosResponse, AxiosError } from 'axios';

class InvoiceService {
  /**
   * Generate a new invoice for a client
   * Endpoint: POST /web/api/v1/invoice/generateInvoice
   */
  async generateInvoice(
    clientId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<InvoiceDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOInvoiceDTO> = await api.post(
        '/invoice/generateInvoice',
        null,
        {
          params: { clientId, fromDate, toDate },
        }
      );

      console.log('Full generate invoice API response:', response.data);

      if (response.data?.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data?.message || 'Invalid response: No invoice data returned');
    } catch (error: unknown) {
      console.error('Error generating invoice:', error);
      const errorMessage = this.getErrorMessage(error, 'Failed to generate invoice');
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all invoices for a specific client with optional filters
   * Endpoint: GET /web/api/v1/invoice/view/client/{clientId}
   */
  async getInvoicesByClient(
    clientId: string,
    fromDate?: string,
    toDate?: string,
    status?: string
  ): Promise<InvoiceDTO[]> {
    try {
      const response: AxiosResponse<WebResponseDTOListInvoiceDTO> = await api.get(
        `/invoice/view/client/${clientId}`,
        {
          params: { fromDate, toDate, status },
        }
      );

      console.log('Full get invoices by client API response:', response.data);

      if (response.data?.flag && Array.isArray(response.data.response)) {
        return response.data.response;
      }

      throw new Error(response.data?.message || 'Invalid response: Expected array of invoices');
    } catch (error: unknown) {
      console.error('Error fetching invoices by client:', error);
      const errorMessage = this.getErrorMessage(error, 'Failed to fetch invoices by client');
      throw new Error(errorMessage);
    }
  }

  /**
   * Get ALL invoices (no client filter)
   * Endpoint: GET /web/api/v1/invoice/view/all
   */
  async getAllInvoices(): Promise<InvoiceDTO[]> {
    try {
      const response: AxiosResponse<WebResponseDTOListInvoiceDTO> = await api.get(
        '/invoice/view/all'
      );

      console.log('Full get all invoices API response:', response.data);

      if (response.data?.flag && Array.isArray(response.data.response)) {
        return response.data.response;
      }

      throw new Error(response.data?.message || 'Invalid response: Expected array of invoices');
    } catch (error: unknown) {
      console.error('Error fetching all invoices:', error);
      const errorMessage = this.getErrorMessage(error, 'Failed to fetch all invoices');
      throw new Error(errorMessage);
    }
  }

  /**
   * Get a single invoice by its ID
   * Endpoint: GET /web/api/v1/invoice/view/{invoiceId}
   */
  async getInvoiceById(invoiceId: string): Promise<WebResponseDTOInvoiceDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOInvoiceDTO> = await api.get(
        `/invoice/view/${invoiceId}`
      );

      console.log('Full get invoice by ID API response:', response.data);

      if (response.data.flag && response.data.response) {
        return response.data;
      }

      throw new Error(response.data.message || 'Invalid response: No invoice found');
    } catch (error: unknown) {
      console.error('Error fetching invoice by ID:', error);
      const errorMessage = this.getErrorMessage(error, 'Failed to fetch invoice by ID');
      throw new Error(errorMessage);
    }
  }
 /**
   * ✅ Get client invoice summary
   * Endpoint: GET /web/api/v1/invoice/view/summary/client/{clientId}
   */
 async getClientInvoiceSummary(
  clientId: string
): Promise<ClientInvoiceSummaryDTO[]> {
  try {
    const response: AxiosResponse<WebResponseDTOListClientInvoiceSummaryDTO> =
      await api.get(`/invoice/view/summary/client/${clientId}`);

    console.log(
      'Full get client invoice summary API response:',
      response.data
    );

    if (response.data?.flag && Array.isArray(response.data.response)) {
      return response.data.response;
    }

    throw new Error(
      response.data?.message ||
        'Invalid response: Expected client invoice summary data'
    );
  } catch (error: unknown) {
    console.error('Error fetching client invoice summary:', error);
    const errorMessage = this.getErrorMessage(
      error,
      'Failed to fetch client invoice summary'
    );
    throw new Error(errorMessage);
  }
}

  /**
   * Download invoice as PDF (returns Blob)
   * Endpoint: GET /web/api/v1/invoice/download/{invoiceId}
   */
  async downloadInvoicePDF(invoiceId: string): Promise<Blob> {
    try {
      const response: AxiosResponse = await api.get(
        `/invoice/download/${invoiceId}`,
        {
          responseType: 'blob',
        }
      );

      console.log('Full download invoice PDF API response:', response);

      if (response.data instanceof Blob) {
        return response.data;
      }

      throw new Error('Invalid response: Expected Blob data');
    } catch (error: unknown) {
      console.error('Error downloading invoice PDF:', error);

      let errorMessage = 'Failed to download invoice PDF';
      if (error instanceof AxiosError) {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to download invoice PDF';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Helper: Extract readable error message
   */
  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof AxiosError) {
      return (
        error.response?.data?.message ||
        error.message ||
        fallback
      );
    }
    return fallback;
  }
}

export const invoiceService = new InvoiceService();