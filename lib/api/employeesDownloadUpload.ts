import { AxiosResponse } from 'axios';
import api from '@/lib/api/axios'; // adjust path if needed

class EmployeesDownloadUploadService {
  /**
   * Download employees data (Excel)
   * Endpoint: GET /admin/employees/export
   */
  async downloadEmployees(): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await api.get(
        '/admin/employees/export',
        {
          responseType: 'blob',
        }
      );

      if (response.data instanceof Blob) {
        return response.data;
      }

      throw new Error('Invalid response: Expected Blob');
    } catch (error: any) {
      console.error('Employees export error:', error);
      throw new Error(
        error?.response?.data?.message || 'Failed to download employees'
      );
    }
  }

   /**
   * Bulk create employees from Excel
   * Endpoint: POST /web/api/v1/admin/employees/bulk-create
   * FormData key: excelFile
   */
   async bulkCreateEmployees(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('excelFile', file);
  
    try {
      const response: AxiosResponse<any> = await api.post(
        '/admin/employees/bulk-create',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      return response.data;
  
    } catch (error: any) {
      //  HANDLE 409 AS VALID BUSINESS RESPONSE
      if (error?.response?.status === 409 && error.response.data) {
        return error.response.data;
      }
  
      // True failures only (network / 500 / etc)
      console.error('Employee bulk create error:', error);
      throw new Error(
        error?.response?.data?.message ||
        'Failed to bulk create employees'
      );
    }
  }
  
  
}

export const employeesDownloadUploadService =
  new EmployeesDownloadUploadService();
