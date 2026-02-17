import * as common from "./commonValidation";

export function useClientFieldValidation() {
  const validateField = (name: string, value: any, formData?: any): string => {
    if (!name) return "";

    const val = String(value ?? "").trim();

    // ================= REQUIRED =================
    const requiredFields = [
      "companyName",
      "contactNumber",
      "addresses.0.houseNo",
      "addresses.0.streetName",
      "addresses.0.city",
      "addresses.0.state",
      "addresses.0.country",
      "addresses.0.pincode",
      "clientPocs.0.name",
      "clientPocs.0.email",
    ];

    if (requiredFields.includes(name) && !val) {
      return common.requiredError;
    }

    // ================= NAME =================
    if (["companyName", "accountHolderName"].includes(name)) {
      if (val && !common.nameRegex.test(val)) return common.onlyLettersSpaces;

      if (val.length > 50) return common.max50Chars;
    }
    // ================= POC NAME =================
    if (name.includes("clientPocs") && name.endsWith(".name")) {
      if (!val) return common.requiredError;

      if (!common.nameRegex.test(val)) return common.onlyLettersSpaces;

      if (val.length > 50) return common.max50Chars;
    }

    // ================= EMAIL =================
    if (
      name === "email" ||
      name === "personalEmail" ||
      name === "companyEmail" ||
      name.endsWith(".email")
    ) {
   

      if (val && !common.emailRegex.test(val)) {
      
        return common.invalidEmail;
      }

      if (val.length > 50) {
        return common.max50Chars;
      }
    }

    // ================= CONTACT =================
    if (name === "contactNumber" || name.endsWith(".contactNumber")) {
      if (!val) return common.requiredError;

      if (!/^\d+$/.test(val)) return "Only digits allowed.";

      if (val.length !== 10) return "Mobile number must be exactly 10 digits.";

      if (!common.phoneRegex.test(val)) return common.invalidIndianMobile;
    }

    // ================= PAN =================
    if (name === "panNumber" && val && !common.panRegex.test(val))
      return common.invalidPAN;

    // ================= GST =================
    if (name === "gst" && val && !common.gstRegex.test(val))
      return common.invalidGST;

    // ================= TAN =================
    if (name === "tanNumber" && val && !common.tanRegex.test(val))
      return common.invalidTAN;

    // ================= ADDRESS HOUSE / STREET =================
    if (name.endsWith(".houseNo") || name.endsWith(".streetName")) {
      if (!val) return common.requiredError;

      if (val.length > 50) return common.max50Chars;
    }

    // ================= ADDRESS CITY =================
    if (name.endsWith(".city")) {
      if (!val) return common.requiredError;

      if (!common.nameRegex.test(val)) return common.onlyLettersSpaces;

      if (val.length > 30) return common.max30Chars;
    }

    // ================= ADDRESS STATE =================
    if (name.endsWith(".state")) {
      if (!val) return common.requiredError;

      if (!common.nameRegex.test(val)) return common.onlyLettersSpaces;

      if (val.length > 30) return common.max30Chars;
    }

    // ================= ADDRESS COUNTRY =================
    if (name.endsWith(".country")) {
      if (!val) return common.requiredError;

      if (!common.nameRegex.test(val)) return common.onlyLettersSpaces;

      if (val.length > 30) return common.max30Chars;
    }

    // ================= PINCODE =================
    if (name.endsWith(".pincode")) {
      if (!val) return common.requiredError;

      if (!/^\d{6}$/.test(val)) return common.pincode;
    }

    // ================= ACCOUNT =================
    if (name === "accountNumber" && val && !common.accountNumberRegex.test(val))
      return common.invalidAccountNumber;

    if (name === "ifscCode" && val && !common.ifscRegex.test(val))
      return common.invalidIFSC;

    return "";
  };

  return { validateField };
}
