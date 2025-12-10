// lib/api/validationService.ts
import api from "./axios";

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
export type UniqueField =
  | "COMPANY_NAME"
  | "CONTACT_NUMBER"
  | "EMAIL"
  | "GST"
  | "PAN_NUMBER"
  | "TAN_NUMBER"
  | "AADHAR_NUMBER"
  | "ACCOUNT_NUMBER"
  | "ACCOUNT_HOLDER_NAME"
  | "PASSPORT_NUMBER"
  | "PF_UAN_NUMBER"
  | "ESI_NUMBER"
  | "SSN_NUMBER"
  | "POLICY_NUMBER"
  | "SERIAL_NUMBER"
  |"REGISTRATION_NUMBER"
  |"CIN_NUMBER";

export const validationService = {
  async validateField({
    field,
    value,
    mode,
    excludeId,
    fieldColumn,
  }: {
    field: UniqueField;
    value: string;
    mode: "create" | "edit";
    excludeId?: string;
    fieldColumn?: string;
  }): Promise<{ exists: boolean; message?: string }> {
    try {
      const endpoint =
        mode === "create"
          ? "/validation/create/mode"
          : "/validation/edit/mode";

      const params: Record<string, string> = {
        field,
        value: value.trim(),
      };

      // Only send fieldColumn & excludeId in edit mode
      if (mode === "edit") {
        if (fieldColumn) {
          params.fieldColumn = fieldColumn; 
        }
        if (excludeId) {
          params.excludeId = excludeId;
        }
      }

      const response = await api.get(endpoint, { params });

      const exists = response.data === true;

      return {
        exists,
        message: exists
          ? "Already exists in the system"
          : "Available",
      };
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },
};