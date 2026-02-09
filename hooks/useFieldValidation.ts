
// ────────────────────────────────────────────────
// Shared regex patterns (used by both client & employee)
// ────────────────────────────────────────────────
const phoneRegex = /^[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-z ]+$/;
const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]$/;
const tanRegex = /^[A-Z]{4}\d{5}[A-Z]$/;

// ────────────────────────────────────────────────
// Shared helper functions
// ────────────────────────────────────────────────
const isEmpty = (val: string) => val.trim() === "";

const requiredError = "This field is required.";
const invalidEmail = "Invalid email format.";
const max30Chars = "Maximum 30 characters allowed.";
const max50Chars = "Maximum 50 characters allowed.";
const onlyLettersSpaces = "Must contain only letters and spaces.";
const invalidIndianMobile = "Invalid Indian mobile number.";

// ────────────────────────────────────────────────
// Shared max-30 fields (used in both client & employee)
// ────────────────────────────────────────────────
const max30Fields = [
  "allowanceType",
  "deductionType",
  "equipmentType",
  "serialNumber",
  "employeeAdditionalDetailsDTO.backgroundCheckStatus",
  "employeeInsuranceDetailsDTO.policyNumber",
  "employeeInsuranceDetailsDTO.providerName",
  "employeeInsuranceDetailsDTO.nomineeName",
  "employeeInsuranceDetailsDTO.nomineeRelation",
  "employeeStatutoryDetailsDTO.taxRegime",
  "employeeStatutoryDetailsDTO.esiNumber",
  "employeeStatutoryDetailsDTO.ssnNumber",
  // Add client-side max30 fields here if any (e.g. some POC fields)
];

// ────────────────────────────────────────────────
// Client-specific required fields & rules
// ────────────────────────────────────────────────
const clientRequiredFields = [
  "companyName",
  "contactNumber",
  "addresses.0.city",
  "addresses.0.state",
  "addresses.0.country",
  "addresses.0.pincode",
  "clientPocs.0.name",
];

// ────────────────────────────────────────────────
// Employee-specific required fields
// ────────────────────────────────────────────────
const employeeRequiredFields = [
  "firstName",
  "lastName",
  "personalEmail",
  "companyEmail",
  "contactNumber",
  "designation",
  "dateOfBirth",
  "dateOfJoining",
  "gender",
  "nationality",
  "employeeEmploymentDetailsDTO.department",     // now required check will work
  "employeeSalaryDTO.payType",
  "employeeSalaryDTO.ctc",
];

// ────────────────────────────────────────────────
// Main validation function factory
// ────────────────────────────────────────────────
export function createValidator(entity: "client" | "employee") {
  const isClient = entity === "client";
  const requiredFields = isClient ? clientRequiredFields : employeeRequiredFields;

  return function validateField(
    name: string,
    value: string | number | boolean,
    formData?: any
  ): string {
    const val = String(value ?? "").trim();

    // ─── 1. Required check ───
    if (requiredFields.includes(name) && isEmpty(val)) {
      return requiredError;
    }

    // ─── 2. Name fields (both client companyName & employee first/last name) ───
    if (["companyName", "firstName", "lastName"].includes(name)) {
      if (val && !nameRegex.test(val)) {
        return onlyLettersSpaces;
      }
      if (val.length > 30) {
        return max30Chars;
      }
      if (name === "companyName" && val.length < 3) {
        return "Minimum 3 characters";
      }
    }

    // ─── 3. Email fields ───
    if (["email", "personalEmail", "companyEmail"].includes(name) || name.includes("clientPocs") && name.includes("email")) {
      if (val && !emailRegex.test(val)) {
        return invalidEmail;
      }
      if (name !== "email" && val.length > 50) {
        return max50Chars;
      }
    }

    // ─── 4. Cross-email check (only for employee) ───
    if (["personalEmail", "companyEmail"].includes(name) && formData) {
      const other = name === "personalEmail" ? formData.companyEmail : formData.personalEmail;
      if (other && val.toLowerCase() === other.toLowerCase()) {
        return "Personal and company email should not be same.";
      }
    }

    // ─── 5. Contact number (both client & employee) ───
    if (["contactNumber", "emergencyContactNumber"].includes(name) || name.includes("clientPocs") && name.includes("contactNumber")) {
      if (isClient && name.includes("clientPocs") && !val) {
        // POC contact is optional
      } else if (!val) {
        return requiredError;
      } else if (!/^\d+$/.test(val)) {
        return "Only digits allowed.";
      } else if (val.length === 10 && !phoneRegex.test(val)) {
        return invalidIndianMobile;
      }
    }

    // ─── 6. Max 30 characters for many fields ───
    if (max30Fields.some(f => name.includes(f)) && val.length > 30) {
      return max30Chars;
    }

    // ─── 7. Client-specific: GST, PAN, TAN ───
    if (isClient) {
      if (name === "gst" && val && !gstRegex.test(val)) {
        return "Invalid GSTIN format.";
      }
      if (name === "panNumber" && val && !panRegex.test(val)) {
        return "Invalid PAN format.";
      }
      if (name === "tanNumber" && val && !tanRegex.test(val)) {
        return "Invalid TAN format.";
      }

      // Address fields (first address mandatory)
      if (name.startsWith("addresses.0.")) {
        if (["city", "state", "country", "pincode"].includes(name.split(".")[2])) {
          if (isEmpty(val)) return requiredError;
          if (name.endsWith("pincode")) {
            if (!/^\d+$/.test(val)) return "Only digits";
            if (val.length === 6 && !/^\d{6}$/.test(val)) return "Must be 6 digits";
          }
        }
      }
    }

    // ─── 8. Employee-specific special rules ───
    if (!isClient) {
      if (name === "employeeStatutoryDetailsDTO.pfUanNumber" && val && !/^\d{12}$/.test(val)) {
        return "PF UAN must be exactly 12 digits.";
      }

      if (name === "employeeStatutoryDetailsDTO.passportNumber" && val && !/^[A-Z0-9]{8,12}$/.test(val)) {
        return "Invalid passport number.";
      }
    }
    if (name === "employeeInsuranceDetailsDTO.policyNumber") {
      // Optional: no error if empty
      if (!val.trim()) {
        return "";  // ← no error if blank
      }
    
      // Length check (only when filled)
      if (val.length < 8) {
        return "Policy number must be at least 8 characters.";
      }
      if (val.length > 30) {
        return "Policy number cannot exceed 30 characters.";
      }
    
      // Allowed characters
      const policyRegex = /^[A-Za-z0-9\-/#\s]+$/;
      if (!policyRegex.test(val)) {
        return "Policy number can only contain letters, numbers, -, /, #, and spaces.";
      }
    }
   // For SSN
if (name === "employeeStatutoryDetailsDTO.ssnNumber") {
  if (!val.trim()) return "";
  if (!/^\d+$/.test(val)) return "Only digits allowed.";
  if (val.length < 9) return "At least 9 digits.";
  if (val.length > 12) return "Max 12 digits.";
}
   
// For ESI
if (name === "employeeStatutoryDetailsDTO.esiNumber") {
  if (!val.trim()) return "";
  if (!/^\d+$/.test(val)) return "Only digits allowed.";
  if (val.length < 10) return "At least 10 digits.";
  if (val.length > 17) return "Max 17 digits.";
}
    return "";
  };
}

// ────────────────────────────────────────────────
// Hook exports – use the one you need in each page
// ────────────────────────────────────────────────

export function useClientFieldValidation() {
  const validate = createValidator("client");
  return { validateField: validate };
}

export function useEmployeeFieldValidation() {
  const validate = createValidator("employee");
  return { validateField: validate };
}