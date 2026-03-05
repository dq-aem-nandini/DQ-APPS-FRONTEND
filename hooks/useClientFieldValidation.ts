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
    /* ───── Postal Code (Global Safe Validation) ───── */
    // if (
    //   name.toLowerCase().includes("pincode") ||
    //   name.toLowerCase().includes("postal")
    // ) {
    //   if (val.length < 3 || val.length > 10) {
    //     return "Postal/ZIP code must be between 3 and 10 characters";
    //   }
    // }

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
            return common.invalidPostal; // reuse your message
          }
        }
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
