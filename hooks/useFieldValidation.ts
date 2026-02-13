
// ────────────────────────────────────────────────
// Shared regex patterns (used by both client & employee)
// ────────────────────────────────────────────────
const phoneRegex = /^[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-z ]+$/;
const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]$/;
const tanRegex = /^[A-Z]{4}\d{5}[A-Z]$/;
const aadhar = /^\d{12}$/;
const accountNumber = /^\d{9,18}$/;
const ifsc = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const passportRegex = /^[A-Z][0-9]{7,8}$/;


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
const invalidAccountNumber = "Account number must be 9–18 digits";
const invalidIFSC = "Invalid IFSC format (e.g., SBIN0000123)";
const invalidAadhar = "Invalid Aadhar format (12 digits)";
const invalidGST = "Invalid GSTIN format (15 characters, e.g., 22AAAAA0000A1Z5)";
const invalidTAN = "Invalid TAN format (10 characters, e.g., ABCD12345E)";
const invalidPAN = "Invalid PAN format (e.g., ABCDE1234F)";
const invalidPFUAN = "PF UAN must be exactly 12 digits.";
const invalidPassport = "Passport must start with a capital letter followed by 7-8 digits (e.g., A1234567)";
const onlyLettersSymbols =
  "Only letters, spaces, and common symbols (& . , - () ) allowed";
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
  "employeeEmploymentDetailsDTO.department",
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
    // 🛡️ HARD GUARD — FIXES ALL RUNTIME CRASHES
    if (!name || typeof name !== "string") {
      return "";
    }
    const val = String(value ?? "").trim();

    // ─── 1. Required check ───
    if (requiredFields.includes(name) && isEmpty(val)) {
      return requiredError;
    }

    // ─── 2. Name fields (both client companyName & employee first/last name) ───
    if (["companyName", "firstName", "lastName", 'accountHolderName'].includes(name)) {
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
    if (
      ["email", "personalEmail", "companyEmail"].includes(name) ||
      (name.includes("clientPocs") && name.includes("email"))
    ) {
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
    if (
      name.endsWith("contactNumber") ||
      name.endsWith("emergencyContactNumber") ||
      name.endsWith("nomineeContact") ||
      (name.includes("clientPocs") && name.endsWith("contactNumber"))
    ) {
      // Step 1: Optional vs required
      if (!val) {
        // Main contactNumber is required
        if (name === "contactNumber") {
          return requiredError;
        }
        return "";
      }
    
      // Step 2: Digits only
      if (!/^\d+$/.test(val)) {
        return "Only digits allowed.";
      }
    
      // Step 3: Length must be exactly 10
      if (val.length !== 10) {
        return "Mobile number must be exactly 10 digits.";
      }
    
      // Step 4: Indian mobile validation
      if (!phoneRegex.test(val)) {
        return invalidIndianMobile;
      }
    
      return "";
    }
    

    // ─── 6. Max 30 characters for many fields ───
    if (max30Fields.some(f => name.includes(f)) && val.length > 30) {
      return max30Chars;
    }
    if (name === "panNumber" && val && !panRegex.test(val)) {
      return invalidPAN;
    }
     /* ───── Aadhar ───── */
     if (name === "aadharNumber" && val && !aadhar.test(val)) {
      return invalidAadhar;
    }
     /* ───── Account Number ───── */
     if (name === "accountNumber" && val && !accountNumber.test(val)) {
      return invalidAccountNumber;
    }

    /* ───── IFSC ───── */
    if (name === "ifscCode" && val && !ifsc.test(val)) {
      return invalidIFSC;
    }
    // ─── 7. Client-specific: GST, PAN, TAN ───
    if (isClient) {
      if (name === "gst" && val && !gstRegex.test(val)) {
        return invalidGST;
      }
     
      if (name === "tanNumber" && val && !tanRegex.test(val)) {
        return invalidTAN;
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

   // ─── 8. Employee-specific strict rules ───
   if (!isClient) {
    // Passport – must start with capital letter + digits
    if (name === "employeeStatutoryDetailsDTO.passportNumber" && val) {
      if (!passportRegex.test(val)) {
        return invalidPassport;
      }
    }

    if (name === "employeeStatutoryDetailsDTO.pfUanNumber" && val && !/^\d{12}$/.test(val)) {
      return invalidPFUAN;
    }

    // Policy Number (optional but strict when filled)
    if (name === "employeeInsuranceDetailsDTO.policyNumber") {
      if (!val.trim()) return "";
      if (val.length < 8) return "Policy number must be at least 8 characters.";
      if (val.length > 30) return "Policy number cannot exceed 30 characters.";
      const policyRegex = /^[A-Za-z0-9\-/#\s]+$/;
      if (!policyRegex.test(val)) {
        return "Only letters, numbers, -, /, #, spaces allowed.";
      }
    }

    // SSN
    if (name === "employeeStatutoryDetailsDTO.ssnNumber") {
      if (!val.trim()) return "";
      if (!/^\d+$/.test(val)) return "Only digits allowed.";
      if (val.length < 9) return "At least 9 digits.";
      if (val.length > 12) return "Max 12 digits.";
    }

    // ESI
    if (name === "employeeStatutoryDetailsDTO.esiNumber") {
      if (!val.trim()) return "";
      if (!/^\d+$/.test(val)) return "Only digits allowed.";
      if (val.length < 10) return "At least 10 digits.";
      if (val.length > 17) return "Max 17 digits.";
    }
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