// lib/api/validationService.ts
import api from "./axios";

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
  | "SERIAL_NUMBER";

export const validationService = {
  async validateField({
    field,
    value,
    mode,
    currentRecordId,
    fieldColumn,
  }: {
    field: UniqueField;
    value: string;
    mode: "create" | "edit";
    currentRecordId?: string;
    fieldColumn?: string;
  }): Promise<{ exists: boolean; message: string }> {
    try {
      let endpoint = "";
      const params: Record<string, string> = { field, value };

      if (mode === "create") {
        endpoint = "/validation/create/mode";
      }

      if (mode === "edit") {
        endpoint = "/validation/edit/mode";
        params.excludeId = currentRecordId ?? "";
        if (fieldColumn) params.fieldColumn = fieldColumn;
      }

      const res = await api.get(endpoint, { params });

      const backendResult: boolean = res.data; // true/false

      // -----------------------
      // ⭐ FIXED INTERPRETATION
      // -----------------------
      const exists = backendResult; 
      // backend true  → exists:true
      // backend false → exists:false

      return {
        exists,
        message: exists ? "Already exists" : "Available",
      };
    } catch (error: any) {
      console.warn("Validation Error:", error.message);

      return {
        exists: false,
        message: "Validation unavailable. Try again.",
      };
    }
  },
};

