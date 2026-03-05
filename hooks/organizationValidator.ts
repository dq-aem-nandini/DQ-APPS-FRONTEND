// hooks/organizationValidator.ts
const requiredFields = [
  "organizationName",
  "organizationLegalName",
  "registrationNumber",
  "gstNumber",
  "panNumber",
  "cinNumber",
  "email",
  "contactNumber",
  "domain",
  "industryType",
  "establishedDate",
  "currencyCode",
  "attendancePolicy.absentMaxMinutes",
  "attendancePolicy.fullDayMinMinutes",
  "accountNumber",
  "accountHolderName",
  "ifscCode",
  "prefix",
  "sequenceNumber",
  "companyType",
  "autoClockOutTime",
  "bankName",
  "branchName",

];

export const patterns = {
  nameWithSymbols: /^[A-Za-z\s&.,()-]+$/,
  email: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
  mobile: /^[6-9]\d{9}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]Z[0-9A-Z]$/,
  cin: /^[LPUA][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
  website: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-./?%&=]*)?$/i,
  // pincode: /^\d{6}$/,
  accountNumber: /^\d{9,18}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  aadhar: /^\d{12}$/,
  onlyPositiveDigits: /^[1-9]\d*$/,
  registrationNumber: /^[A-Za-z0-9\-\/]{3,50}$/,
  locationName: /^[A-Za-z\s'.,()-]+$/,
  countryName: /^[A-Za-z\s'.,()-]+$/,
  postalCode: /^[A-Za-z0-9\s-]{3,10}$/,
} as const;

// Error messages
// const required= "This field is required";
const max100Chars = "Maximum 100 characters allowed.";
const max50Chars = "Maximum 50 characters allowed.";
const min3Chars = "Minimum 3 characters required.";
const invalidEmail = "Invalid email format.";
const invalidIndianMobile = "Enter valid 10-digit Indian mobile number.";
const invalidPAN = "Invalid PAN format (e.g., ABCDE1234F)";
const invalidGST = "Invalid GST format (e.g., 22AAAAA0000A1Z5)";
const invalidCIN = "Invalid CIN format (e.g., L12345MH2020PLC123456)";
const invalidWebsite = "Invalid website URL";
const invalidAccountNumber = "Account number must be 9–18 digits";
const invalidIFSC = "Invalid IFSC format (e.g., SBIN0000123)";
const invalidAadhar = "Invalid Aadhar format (12 digits)";
const invalidPostal = "Postal/ZIP code must be 3–10 alphanumeric characters, spaces or hyphens";
const invalidLocation = "Only letters, spaces and common punctuation allowed";

const onlyLettersSymbols =
  "Only letters, spaces, and common symbols (& . , - () ) allowed";
const invalidRegistrationNumber =
  "Registration number must be 3–50 characters (letters, numbers, - or / only)";

export function createOrganizationValidator() {
  return function validateOrganizationField(
    name: string,
    value: string | number | boolean | null | undefined,
    formData?: any
  ): string {
    const val = String(value ?? "").trim();

    // ✅ Required validation
    if (requiredFields.includes(name)) {
      const effectiveVal = value == null ? "" : String(value).trim();
      if (effectiveVal === "") {
        return "This field is required";
      }
    }
    // ✅ Required validation
    if (!val) {

      // normal required fields
      if (requiredFields.includes(name)) {
        return "This field is required";
      }

      // dynamic address required validation
      if (name.startsWith("addresses.")) {
        const field = name.split(".")[2];

        const requiredAddressFields = [
          "houseNo",
          "streetName",
          "city",
          "state",
          "country",
          "pincode",
          "addressType"
        ];

        if (requiredAddressFields.includes(field)) {
          return "This field is required";
        }
      }
    }
    if (
      name === "attendancePolicy.absentMaxMinutes" ||
      name === "attendancePolicy.fullDayMinMinutes"
    ) {
      const strVal = value == null ? "" : String(value).trim();
    
      // Required already handled above, but double-check for safety
      if (strVal === "") {
        return "This field is required";
      }
    
      const num = Number(strVal);
    
      if (isNaN(num) || !isFinite(num)) {
        return "Please enter a valid number";
      }
    
      if (num < 0) {
        return "Value cannot be negative";
      }
    
      if (num > 24) {
        return "Maximum allowed value is 24 hours";
      }
    
      // Optional: minimum sensible value
      if (name === "attendancePolicy.fullDayMinMinutes" && num < 1) {
        return "Full day should be at least 1 hour";
      }
    
      if (name === "attendancePolicy.absentMaxMinutes" && num < 0.5) {
        return "Grace period should be at least 0.5 hours";
      }
    
      return ""; // valid
    }
    /* ───── Names ───── */
    if (
      [
        "firstName",
        "lastName",
        "organizationName",
        "organizationLegalName",
        "emergencyContactName",
        "accountHolderName",
      ].includes(name)
    ) {
      if (!patterns.nameWithSymbols
        .test(val)) return onlyLettersSymbols;
      if (val.length > 100) return max100Chars;
      if (val.length < 3) return min3Chars;
    }



    /* ───── Email ───── */
    if (
      ["email", "personalEmail"].includes(
        name
      )
    ) {
      if (!patterns.email.test(val)) return invalidEmail;
    }
    // if (name === "email" &&  !patterns.email.test(val)) {
    //   return invalidEmail;
    // }

    /* ───── Mobile Numbers ───── */
    if (
      ["contactNumber", "alternateContactNumber", "emergencyContactNumber"].includes(
        name
      )
    ) {
      if (!patterns.mobile.test(val)) return invalidIndianMobile;
    }

    /* ───── Aadhar ───── */
    if (name === "aadharNumber" && !patterns.aadhar.test(val)) {
      return invalidAadhar;
    }

    /* ───── PAN ───── */
    if (name === "panNumber" && !patterns.pan.test(val)) {
      return invalidPAN;
    }

    /* ───── GST ───── */
    if (name === "gstNumber" && !patterns.gst.test(val)) {
      return invalidGST;
    }

    /* ───── CIN ───── */
    if (name === "cinNumber" && !patterns.cin.test(val)) {
      return invalidCIN;
    }

    /* ───── Website ───── */
    if (name === "website" && !patterns.website.test(val)) {
      return invalidWebsite;
    }

    /* ───── Sequence Number ───── */
    if (name === "sequenceNumber" && !patterns.onlyPositiveDigits.test(val)) {
      return "Only positive numbers allowed";
    }


    /* ───── Account Number ───── */
    if (name === "accountNumber" && !patterns.accountNumber.test(val)) {
      return invalidAccountNumber;
    }

    /* ───── IFSC ───── */
    if (name === "ifscCode" && !patterns.ifsc.test(val)) {
      return invalidIFSC;
    }
    /* ───── Address Fields ───── */

    // House No / Street Name - basic length
    if (name.endsWith(".houseNo") || name.endsWith(".streetName")) {
      if (val.length > 100) return max100Chars;
      // optional: if (val.length < 1) return "This field is required"; but already in requiredFields
    }

    // City / State - length + letters
    if (name.endsWith(".city") || name.endsWith(".state")) {
      if (val.length > 50) return max50Chars;
      if (val.length > 0 && !patterns.locationName.test(val)) {
        return invalidLocation;
      }
    }

    // Country
    if (name.endsWith(".country")) {
      if (val.length > 50) return max50Chars;
      if (val.length > 0 && !patterns.countryName.test(val)) {
        return "Invalid country name format";
      }
    }

    // ───── Postal / ZIP / Pincode ─────
    if (name.endsWith(".pincode") || name.toLowerCase().includes("postal") || name.toLowerCase().includes("zip")) {
      const trimmed = val.trim();

      if (trimmed === "") {
        return ""; // requiredFields already handles empty
      }

      // Extract country if possible (for addresses.0.pincode → addresses.0.country)
      let country = "";
      const parts = name.split(".");
      if (parts.length >= 3 && parts[0] === "addresses") {
        const idx = Number(parts[1]);
        country = (formData?.addresses?.[idx]?.country || "").trim();
      }

      // Country-aware validation (expand as needed)
      const countryPatterns: Record<string, { regex: RegExp; msg: string }> = {
        "India": {
          regex: /^[1-9]\d{5}$/,
          msg: "Indian PIN code must be exactly 6 digits (e.g. 500081)",
        },
        "United States": {
          regex: /^\d{5}(?:[- ]?\d{4})?$/,
          msg: "US ZIP: 5 digits or ZIP+4 (e.g. 90210 or 90210-1234)",
        },
        "Canada": {
          regex: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
          msg: "Canadian format: A1A 1A1 (e.g. M5V 2T6)",
        },
        // Add 4–6 more frequent countries if needed
      };

      if (country && countryPatterns[country]) {
        if (!countryPatterns[country].regex.test(trimmed)) {
          return countryPatterns[country].msg;
        }
      } else {
        // Global fallback - improved version
        if (trimmed.length < 3 || trimmed.length > 12) {   // raised max to 12
          return "Postal/ZIP/Pin code should be 3–12 characters";
        }
        if (!/^[A-Za-z0-9\s-]{3,12}$/.test(trimmed)) {
          return invalidPostal; // reuse your message
        }
      }
    }

    /* ───── Registration Number ───── */
    if (name === "registrationNumber" && !patterns.registrationNumber.test(val)) {
      return invalidRegistrationNumber;
    }


    return "";
  };
}

export function useOrganizationFieldValidation() {
  const validate = createOrganizationValidator();
  return { validateField: validate };
}
