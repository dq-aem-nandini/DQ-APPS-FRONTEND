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
    month: number,
    year: number
  ): Promise<InvoiceDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOInvoiceDTO> = await api.post(
        '/invoice/generateInvoice',
        null, // no request body, only query params
        {
          params: { clientId, month, year },
        }
      );

      console.log('Full generate invoice API response:', response.data);

      // Validate API response
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
    * ✅ Get client invoice summary
    * Endpoint: GET /web/api/v1/invoice/view/summary/client/{clientId}
    */
  async getClientInvoiceSummary(
    invoiceId: string
  ): Promise<ClientInvoiceSummaryDTO[]> {
    try {
      const response: AxiosResponse<WebResponseDTOListClientInvoiceSummaryDTO> =
        await api.get(`/invoice/view/summary/invoice/${invoiceId}`);

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
   * ✅ Delete an invoice by invoiceId
   * Endpoint: DELETE /web/api/v1/invoice/delete/{invoiceId}
   */
  async deleteInvoice(invoiceId: string): Promise<string> {
    try {
      const response: AxiosResponse<WebResponseDTOInvoiceDTO> =
        await api.delete(`/invoice/delete/${invoiceId}`);

      console.log('Full delete invoice API response:', response.data);

      if (response.data?.flag) {
        return response.data.message || 'Invoice deleted successfully';
      }

      throw new Error(response.data?.message || 'Failed to delete invoice');
    } catch (error: unknown) {
      console.error('Error deleting invoice:', error);
      const errorMessage = this.getErrorMessage(
        error,
        'Failed to delete invoice'
      );
      throw new Error(errorMessage);
    }
  }

  /**
  * ✅ Update invoice status (Approve / Reject / Draft / Sent / Paid / Overdue)
  * Endpoint: PATCH /web/api/v1/invoice/approve/{invoiceId}/status/{status}
  */
  async updateInvoiceStatus(
    invoiceId: string,
    status: string
  ): Promise<InvoiceDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOInvoiceDTO> =
        await api.patch(`/invoice/approve/${invoiceId}/status/${status}`);

      console.log('Full update invoice status API response:', response.data);

      if (response.data?.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data?.message || 'Failed to update invoice status');
    } catch (error: unknown) {
      console.error('Error updating invoice status:', error);
      const errorMessage = this.getErrorMessage(
        error,
        'Failed to update invoice status'
      );
      throw new Error(errorMessage);
    }
  }

  /**
  * ✅ Download invoice as PDF (returns Blob)
  * Endpoint: GET /web/api/v1/invoice/{invoiceId}/pdf
  */
  async downloadInvoicePDF(invoiceId: string): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await api.get(
        `/invoice/${invoiceId}/pdf`,
        {
          responseType: 'blob', // Return binary PDF data
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
   * ✅ Lock or Unlock an invoice
   * Endpoint: PATCH /web/api/v1/invoice/{invoiceId}/action/{action}
   * Available actions: LOCK | UNLOCK
   */
  async updateInvoiceLockStatus(invoiceId: string, action: 'LOCK' | 'UNLOCK'): Promise<InvoiceDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOInvoiceDTO> = await api.patch(
        `/invoice/${invoiceId}/action/${action}`
      );

      console.log(`Full update invoice lock status API response (${action}):`, response.data);

      if (response.data?.flag && response.data.response) {
        return response.data.response;
      }

      throw new Error(response.data?.message || `Failed to ${action.toLowerCase()} invoice`);
    } catch (error: unknown) {
      console.error(`Error while trying to ${action.toLowerCase()} invoice:`, error);
      const errorMessage = this.getErrorMessage(error, `Failed to ${action.toLowerCase()} invoice`);
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