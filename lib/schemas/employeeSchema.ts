// lib/schemas/employeeSchema.ts
import { z } from "zod";

export const employeeSchema = z.object({
  // Personal
  firstName: z.string().min(1, "First name required").regex(/^[A-Za-z\s]+$/, "Only letters & spaces"),
  lastName: z.string().min(1, "Last name required").regex(/^[A-Za-z\s]+$/, "Only letters & spaces"),
  personalEmail: z.string().email("Invalid email format"),
  companyEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  alternateContactNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid alternate mobile").optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Select gender" }),
  maritalStatus: z.string().optional(),
  numberOfChildren: z.coerce.number().min(0).optional(),
  dateOfBirth: z.string().min(1, "Date of birth required"),
  nationality: z.string().min(1, "Nationality required"),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid emergency contact").optional().or(z.literal("")),

  // Employment
  clientId: z.string().nullable(),
  clientSelection: z.string().optional(),
  reportingManagerId: z.string().optional(),
  designation: z.string().min(1, "Designation required"),
  dateOfJoining: z.string().min(1, "Joining date required"),
  employmentType: z.enum(["FULLTIME", "CONTRACTOR", "FREELANCER"]),
  rateCard: z.coerce.number().min(0).optional(),

  // Salary
  ctc: z.coerce.number().min(0, "CTC required"),
  payType: z.enum(["MONTHLY", "HOURLY", "DAILY"]).default("MONTHLY"),
  standardHours: z.coerce.number().min(1).max(168),
  payClass: z.string().optional(),

  // Employment Details
  workingModel: z.string().optional(),
  department: z.string().optional(),
  shiftTiming: z.string().optional(),
  noticePeriodDuration: z.string().optional(),
  probationApplicable: z.boolean().default(false),
  probationDuration: z.string().optional(),
  probationNoticePeriod: z.string().optional(),
  bondApplicable: z.boolean().default(false),
  bondDuration: z.string().optional(),
  location: z.string().optional(),

  // Bank
  accountNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC").optional().or(z.literal("")),
  branchName: z.string().optional(),

  // Statutory
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN").optional().or(z.literal("")),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional().or(z.literal("")),

  // Files & Documents
  offerLetterFile: z.instanceof(File).optional(),
  contractFile: z.instanceof(File).optional(),
  taxDeclarationFormFile: z.instanceof(File).optional(),
  workPermitFile: z.instanceof(File).optional(),

  // Dynamic Arrays
  allowances: z.array(z.object({
    allowanceType: z.string(),
    amount: z.coerce.number(),
    effectiveDate: z.string(),
  })).optional(),

  deductions: z.array(z.object({
    deductionType: z.string(),
    amount: z.coerce.number(),
    effectiveDate: z.string(),
  })).optional(),

  documents: z.array(z.object({
    docType: z.string(),
    file: z.instanceof(File),
  })).optional(),

  equipment: z.array(z.object({
    equipmentType: z.string(),
    serialNumber: z.string(),
    issuedDate: z.string().optional(),
  })).optional(),

  skillsAndCertification: z.string().optional(),
  remarks: z.string().optional(),
}).refine(data => !data.companyEmail || data.personalEmail.toLowerCase() !== data.companyEmail.toLowerCase(), {
  message: "Personal and company email cannot be the same",
  path: ["companyEmail"],
}).refine(data => data.clientId || data.clientSelection, {
  message: "Select a client or status (BENCH, INHOUSE, etc.)",
  path: ["clientSelection"],
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;