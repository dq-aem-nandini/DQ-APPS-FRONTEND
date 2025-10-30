// /lib/api/invoiceService.ts
import api from './axios';
import {
  InvoiceDTO,

} from './types';
import { AxiosResponse, AxiosError } from 'axios';

class InvoiceService {
  /**
   * Generate a new invoice for a client
   */
  async generateInvoice(
    clientId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<InvoiceDTO> {
    try {
      const response: AxiosResponse<InvoiceDTO> = await api.post(
        '/invoice/generateInvoice',
        null,
        {
          params: { clientId,fromDate, toDate },
        }
      );

      console.log('Full generate invoice API response:', response.data);

      if (response.data) {
        return response.data;
      }

      throw new Error('Invalid response: No invoice data returned');
    } catch (error: unknown) {
      console.error('Error generating invoice:', error);

      let errorMessage = 'Failed to generate invoice';
      if (error instanceof AxiosError) {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to generate invoice';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Get all invoices for a specific client with optional filters
   */
  async getInvoicesByClient(
    clientId: string,
    fromDate?: string,
    toDate?: string,
    status?: string
  ): Promise<InvoiceDTO[]> {
    try {
      const response: AxiosResponse<InvoiceDTO[]> = await api.get(
        `/invoice/view/client/${clientId}`,
        {
          params: { fromDate, toDate, status },
        }
      );

      console.log('Full get invoices by client API response:', response.data);

      if (Array.isArray(response.data)) {
        return response.data;
      }

      throw new Error('Invalid response: Expected array of invoices');
    } catch (error: unknown) {
      console.error('Error fetching invoices by client:', error);

      let errorMessage = 'Failed to fetch invoices';
      if (error instanceof AxiosError) {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch invoices';
      }

      throw new Error(errorMessage);
    }
  }
/**
   * Get ALL invoices (no client filter)
   */
async getAllInvoices(): Promise<InvoiceDTO[]> {
    try {
      const response: AxiosResponse<InvoiceDTO[]> = await api.get(
        '/invoice/view/all'
      );

      console.log('Full get all invoices API response:', response.data);

      if (Array.isArray(response.data)) {
        return response.data;
      }

      throw new Error('Invalid response: Expected array of invoices');
    } catch (error: unknown) {
      console.error('Error fetching all invoices:', error);
      const errorMessage = this.getErrorMessage(error, 'Failed to fetch all invoices');
      throw new Error(errorMessage);
    }
  }

  // Helper: Extract error message from AxiosError or unknown
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