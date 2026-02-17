import * as common from "./commonValidation";

export function useEmployeeFieldValidation() {
  const validateField = (name: string, value: any, formData?: any): string => {
    if (!name) return "";

    const val = String(value ?? "").trim();

    const requiredFields = [
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
    const max30Fields = [
      "allowanceType",
      "deductionType",
      "equipmentType",
      "serialNumber",
      "backgroundCheckStatus",
      "providerName",
      "nomineeName",
      "nomineeRelation",
      "taxRegime",
    ];
    if (requiredFields.includes(name) && !val) return common.requiredError;

    // ================= NAME =================
    if (["firstName", "lastName", "accountHolderName"].includes(name)) {
      if (val && !common.nameRegex.test(val)) return common.onlyLettersSpaces;

      if (val.length > 50) return common.max50Chars;
    }

    // ================= EMAIL =================
    if (name === "personalEmail" || name === "companyEmail") {
      if (val && !common.emailRegex.test(val)) return common.invalidEmail;

      if (val.length > 50) return common.max50Chars;
    }

    // Cross email
    if (formData && name === "personalEmail" && val === formData.companyEmail)
      return "Personal and company email should not be same.";

    if (formData && name === "companyEmail" && val === formData.personalEmail)
      return "Personal and company email should not be same.";

    // ================= CONTACT =================
    if (name === "contactNumber" || name.endsWith("nomineeContact")) {
      if (!/^\d+$/.test(val)) return "Only digits allowed.";

      if (val.length !== 10) return "Mobile number must be exactly 10 digits.";

      if (!common.phoneRegex.test(val)) return common.invalidIndianMobile;
    }

    // ================= AADHAR =================
    if (name === "aadharNumber" && val && !common.aadharRegex.test(val))
      return common.invalidAadhar;

    // ================= MAX 30 CHAR FIELDS =================
    if (val.length > 30) {
      const max30Match = max30Fields.some((field) => name.includes(field)
    );

      if (max30Match) {
        return common.max30Chars;
      }
    }

    // ================= PAN =================
    if (name === "panNumber" && val && !common.panRegex.test(val))
      return common.invalidPAN;
    // ================= PASSPORT =================
    if (
      name === "employeeStatutoryDetailsDTO.passportNumber" &&
      val &&
      !common.passportRegex.test(val)
    )
      return common.invalidPassport;

    // ================= PF UAN =================
    if (
      name === "employeeStatutoryDetailsDTO.pfUanNumber" &&
      val &&
      !/^\d{12}$/.test(val)
    )
      return common.invalidPFUAN;
    // ================= POLICY NUMBER (STRICT) =================
    if (name === "employeeInsuranceDetailsDTO.policyNumber") {
      if (!val) return "";
      if (val.length < 8) return "Policy number must be at least 8 characters.";
      if (val.length > 30) return "Policy number cannot exceed 30 characters.";

      const policyRegex = /^[A-Za-z0-9\-/#\s]+$/;
      if (!policyRegex.test(val)) {
        return "Only letters, numbers, -, /, #, spaces allowed.";
      }
    }

    // ================= SSN =================
    if (name === "employeeStatutoryDetailsDTO.ssnNumber") {
      if (!val) return "";
      if (!/^\d+$/.test(val)) return "Only digits allowed.";
      if (val.length < 9) return "At least 9 digits.";
      if (val.length > 12) return "Max 12 digits.";
    }

    // ================= ESI =================
    if (name === "employeeStatutoryDetailsDTO.esiNumber") {
      if (!val) return "";
      if (!/^\d+$/.test(val)) return "Only digits allowed.";
      if (val.length < 10) return "At least 10 digits.";
      if (val.length > 17) return "Max 17 digits.";
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
