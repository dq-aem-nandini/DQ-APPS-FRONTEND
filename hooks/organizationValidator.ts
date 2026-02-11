// hooks/organizationValidator.ts

export const patterns = {
  nameWithSymbols: /^[A-Za-z\s&.,()-]+$/,
  email: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
  mobile: /^[6-9]\d{9}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]Z[0-9A-Z]$/,
  cin: /^[LPUA][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
  website: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-./?%&=]*)?$/i,
  pincode: /^\d{6}$/,
  accountNumber: /^\d{9,18}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  aadhar: /^\d{12}$/,
  onlyPositiveDigits: /^[1-9]\d*$/
} as const;

// Error messages
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
const onlyLettersSymbols =
  "Only letters, spaces, and common symbols (& . , - () ) allowed";
const invalidPincode = "Pincode must be exactly 6 digits";

export function createOrganizationValidator() {
  return function validateOrganizationField(
    name: string,
    value: string | number | boolean | null | undefined,
    formData?: any
  ): string {
    const val = String(value ?? "").trim();

    // Skip empty (required handled elsewhere)
    if (!val) return "";

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

    /* ───── Pincode ───── */
    if (name.endsWith("pincode") && !patterns.pincode.test(val)) {
      return invalidPincode;
    }

    /* ───── Registration Number ───── */
    if (name === "registrationNumber" && val.length > 50) {
      return max50Chars;
    }

    return "";
  };
}

export function useOrganizationFieldValidation() {
  const validate = createOrganizationValidator();
  return { validateField: validate };
}
