// validation/commonValidation.ts

export const phoneRegex = /^[6-9]\d{9}$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const nameRegex = /^[A-Za-z ]+$/;
export const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
export const gstRegex =
  /^[0-9]{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const tanRegex = /^[A-Z]{4}\d{5}[A-Z]$/;
export const aadharRegex = /^\d{12}$/;
export const accountNumberRegex = /^\d{9,18}$/;
export const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const passportRegex = /^[A-Z][0-9]{7,8}$/;

export const requiredError = "This field is required.";
export const invalidEmail = "Invalid email format.";
export const max30Chars = "Maximum 30 characters allowed.";
export const max50Chars = "Maximum 50 characters allowed.";
export const onlyLettersSpaces =
  "Must contain only letters and spaces.";
export const invalidIndianMobile =
  "Invalid Indian mobile number.";
export const invalidAccountNumber =
  "Account number must be 9–18 digits";
export const invalidIFSC =
  "Invalid IFSC format (e.g., SBIN0000123)";
export const invalidAadhar =
  "Invalid Aadhar format (12 digits)";
export const invalidGST =
  "Invalid GSTIN format (15 characters)";
export const invalidTAN =
  "Invalid TAN format (10 characters)";
export const invalidPAN =
  "Invalid PAN format (e.g., ABCDE1234F)";
export const invalidPFUAN =
  "PF UAN must be exactly 12 digits.";
export const invalidPassport =
  "Passport must start with a capital letter followed by 7-8 digits";
export const pincode=
"Pincode must be 6-digits";
