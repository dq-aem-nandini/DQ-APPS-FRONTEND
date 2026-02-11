
// Enums
export type Role =
  | "ADMIN"
  | "EMPLOYEE"
  | "MANAGER"
  | "HR"
  | "FINANCE"
  | "SUPER_HR";

export interface SidebarItem {
  label: string;
  href: string;
  permission?: string;
}
export type SidebarRole = Extract<Role, "MANAGER" | "FINANCE" | "SUPER_HR">;
export type Designation =
  | "INTERN"
  | "TRAINEE"
  | "ASSOCIATE_ENGINEER"
  | "SOFTWARE_ENGINEER"
  | "SENIOR_SOFTWARE_ENGINEER"
  | "LEAD_ENGINEER"
  | "TEAM_LEAD"
  | "TECHNICAL_ARCHITECT"
  | "REPORTING_MANAGER"
  | "DELIVERY_MANAGER"
  | "DIRECTOR"
  | "VP_ENGINEERING"
  | "CTO"
  | "HR"
  | "FINANCE"
  | "OPERATIONS";
export type IndustryType =
  | "IT"
  | "FINANCE"
  | "HEALTHCARE"
  | "EDUCATION"
  | "ECOMMERCE"
  | "MANUFACTURING"
  | "CONSULTING"
  | "REAL_ESTATE"
  | "HOSPITALITY"
  | "TRANSPORT"
  | "ENERGY"
  | "AGRICULTURE"
  | "PHARMACEUTICAL"
  | "MEDIA"
  | "OTHER";
export const INDUSTRY_TYPE_LABELS: Record<IndustryType, string> = {
  IT: "Information Technology",
  FINANCE: "Finance",
  HEALTHCARE: "Healthcare",
  EDUCATION: "Education",
  ECOMMERCE: "E-Commerce",
  MANUFACTURING: "Manufacturing",
  CONSULTING: "Consulting",
  REAL_ESTATE: "Real Estate",
  HOSPITALITY: "Hospitality",
  TRANSPORT: "Transport & Logistics",
  ENERGY: "Energy & Utilities",
  AGRICULTURE: "Agriculture",
  PHARMACEUTICAL: "Pharmaceuticals",
  MEDIA: "Media & Advertising",
  OTHER: "Other",
};

export type LeaveCategoryType = "SICK" | "CASUAL" | "PLANNED" | "UNPLANNED";
export type FinancialType = "PAID" | "UNPAID";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
export type HolidayType =
  | "PUBLIC"
  | "RELIGIOUS"
  | "REGIONAL"
  | "COMPANY_SPECIFIC";
export type RecurrenceRule = "ANNUAL" | "ONE_TIME";
export type EmploymentType = "CONTRACTOR" | "FREELANCER" | "FULLTIME";
export type DocumentType = "OFFER_LETTER" | "CONTRACT" | "TAX_DECLARATION_FORM" | "WORK_PERMIT" | "PAN_CARD" | "AADHAAR_CARD" | "BANK_PASSBOOK" | "TENTH_CERTIFICATE" | "TWELFTH_CERTIFICATE" | "DEGREE_CERTIFICATE" | "POST_GRADUATION_CERTIFICATE" | "OTHER";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY";
export type ProjectStatus = "ACTIVE" | "INACTIVE" | "COMPLETED" | "ON_HOLD";
export type AddressType = "CURRENT" | "PERMANENT" | "OFFICE";
export type PayType = "HOURLY" | "MONTHLY" | "WEEKLY" | "YEARLY" | "NA";
export type WorkingModel = "ONSITE" | "HYBRID" | "REMOTE" | "FLEXIBLE" | "NA";
export type UpdateRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export const WORKING_MODEL_OPTIONS = [
  "ONSITE",
  "HYBRID",
  "REMOTE",
  "FLEXIBLE",
  "NA",
] as const;
export type PayClass = "A1" | "A2" | "B1" | "B2" | "CONTRACT" | "INTERN" | "NA";
export type Domain =
  | "IT_SERVICES"
  | "FINANCE"
  | "HEALTHCARE"
  | "EDUCATION"
  | "ECOMMERCE"
  | "CONSULTING"
  | "MANUFACTURING"
  | "REAL_ESTATE"
  | "MEDIA"
  | "TELECOM"
  | "OTHER";

export type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "CAD"
  | "SGD"
  | "JPY";

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PAID'
  | 'OVERDUE'
  | 'APPROVED'
  | 'REJECTED';
export type Department =
  | 'HR'
  | 'IT'
  | 'DEVELOPMENT'
  | 'DELIVERY_MANAGEMENT'
  | 'QA'
  | 'DEVOPS'
  | 'SALES'
  | 'MARKETING'
  | 'FINANCE'
  | 'BENCH';

export type ShiftTiming =
  | 'MORNING'
  | 'AFTERNOON'
  | 'NIGHT'
  | 'GENERAL'
  | 'FLEXIBLE'
  | 'NA';

export type NoticePeriodDuration =
  | 'FIFTEEN_DAYS'
  | 'ONE_MONTH'
  | 'TWO_MONTHS'
  | 'THREE_MONTHS'
  | 'SIX_MONTHS'
  | 'NA';

export type ProbationDuration =
  | 'ONE_MONTH'
  | 'TWO_MONTHS'
  | 'THREE_MONTHS'
  | 'SIX_MONTHS'
  | 'ONE_YEAR'
  | 'NA';

export type ProbationNoticePeriod =
  | 'SEVEN_DAYS'
  | 'FIFTEEN_DAYS'
  | 'ONE_MONTH'
  | 'TWO_MONTHS'
  | 'NA';

export type BondDuration =
  | 'SIX_MONTHS'
  | 'ONE_YEAR'
  | 'TWO_YEARS'
  | 'THREE_YEARS'
  | 'NA';

export type UpdateRequestType =
  | 'EMPLOYEE_UPDATE'
  | 'ADDRESS_DELETE'
  | 'CALENDAR_UPDATE'
  | 'DOCUMENT_DELETE';

export const PAY_TYPE_OPTIONS = [
  "HOURLY",
  "MONTHLY",
  "WEEKLY",
  "YEARLY",
  "NA",
] as const;
export const PAY_CLASS_OPTIONS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "CONTRACT",
  "INTERN",
  "NA",
] as const;
export const DEPARTMENT_OPTIONS = [
  'HR',
  'IT',
  'DEVELOPMENT',
  'DELIVERY_MANAGEMENT',
  'QA',
  'DEVOPS',
  'SALES',
  'MARKETING',
  'FINANCE',
  'BENCH',
] as const;

export const SHIFT_TIMING_OPTIONS = [
  'MORNING',
  'AFTERNOON',
  'NIGHT',
  'GENERAL',
  'FLEXIBLE',
  'NA',
] as const;

export const NOTICE_PERIOD_OPTIONS = [
  'FIFTEEN_DAYS',
  'ONE_MONTH',
  'TWO_MONTHS',
  'THREE_MONTHS',
  'SIX_MONTHS',
  'NA',
] as const;

export const PROBATION_DURATION_OPTIONS = [
  'ONE_MONTH',
  'TWO_MONTHS',
  'THREE_MONTHS',
  'SIX_MONTHS',
  'ONE_YEAR',
  'NA',
] as const;

export const PROBATION_NOTICE_OPTIONS = [
  'SEVEN_DAYS',
  'FIFTEEN_DAYS',
  'ONE_MONTH',
  'TWO_MONTHS',
  'NA',
] as const;

export const BOND_DURATION_OPTIONS = [
  'SIX_MONTHS',
  'ONE_YEAR',
  'TWO_YEARS',
  'THREE_YEARS',
  'NA',
] as const;
export const DOCUMENT_TYPE_OPTIONS: DocumentType[] = [
  "OFFER_LETTER",
  "CONTRACT",
  "TAX_DECLARATION_FORM",
  "WORK_PERMIT",
  "PAN_CARD",
  "AADHAAR_CARD",
  "BANK_PASSBOOK",
  "TENTH_CERTIFICATE",
  "TWELFTH_CERTIFICATE",
  "DEGREE_CERTIFICATE",
  "POST_GRADUATION_CERTIFICATE",
  "OTHER",
] as const;
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  OFFER_LETTER: "Offer Letter",
  CONTRACT: "Employment Contract",
  TAX_DECLARATION_FORM: "Tax Declaration Form",
  WORK_PERMIT: "Work Permit / Visa",
  PAN_CARD: "PAN Card",
  AADHAAR_CARD: "Aadhaar Card",
  BANK_PASSBOOK: "Bank Passbook / Cancelled Cheque",
  TENTH_CERTIFICATE: "10th Marksheet",
  TWELFTH_CERTIFICATE: "12th Marksheet",
  DEGREE_CERTIFICATE: "Degree Certificate",
  POST_GRADUATION_CERTIFICATE: "Post Graduation Certificate",
  OTHER: "Other Document",
} as const;

export const DOMAIN_LABELS: Record<Domain, string> = {
  IT_SERVICES: "IT Services",
  FINANCE: "Finance",
  HEALTHCARE: "Healthcare",
  EDUCATION: "Education",
  ECOMMERCE: "E-Commerce",
  CONSULTING: "Consulting",
  MANUFACTURING: "Manufacturing",
  REAL_ESTATE: "Real Estate",
  MEDIA: "Media & Entertainment",
  TELECOM: "Telecommunication",
  OTHER: "Other",
} as const;

export const CURRENCY_CODE_LABELS: Record<CurrencyCode, string> = {
  INR: "Indian Rupee (₹)",
  USD: "US Dollar ($)",
  EUR: "Euro (€)",
  GBP: "British Pound (£)",
  AUD: "Australian Dollar (A$)",
  CAD: "Canadian Dollar (C$)",
  SGD: "Singapore Dollar (S$)",
  JPY: "Japanese Yen (¥)",
} as const;

export interface EmployeeDepartmentDTO {
  employeeId: string;
  fullName: string;
  designation: string;
  department: Department;
}

export interface WebResponseDTOEmployeeDepartmentList {
  flag: boolean;
  message: string;
  status: number;
  response: EmployeeDepartmentDTO[];
  totalRecords: number;
  otherInfo: string | null;
}

// Core Models
export interface AddressModel {
  addressId: string | null;   // uuid
  houseNo?: string;
  streetName?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  addressType?: AddressType;
}

export interface DateRangeRequestDTO {
  fromDate: string; // date
  toDate: string; // date
  partialDay?: boolean;
}

export interface WorkdayResponseDTO {
  totalDays: number; // int32
  holidays: number; // int32
  weekends: number; // int32
  totalHolidays: number; // int32
  leaveDuration: number; // double
}


export interface EmployeeUpdateRequestDTO {
  requestId: string;              // UUID
  employeeId: string;             // UUID
  employeeName: string;
  requestType: UpdateRequestType;
  updatedData: any;               // Holds changed fields (key-value pairs)
  status: UpdateRequestStatus;    // "PENDING" | "APPROVED" | "REJECTED"
  adminComment: string | null;
  createdAt: string;              // ISO date-time string
  approvedAt: string | null;      // ISO date-time string
}

export interface LeaveAvailabilityDTO {
  availableLeaves: number; // double
  requestedLeave: number; // double
  message: string;
  available: boolean;
}

export interface User {
  userId: string;
  userName: string;
  companyEmail: string;
  password?: string;

  role: RoleObject;

  createdAt: string;
  updatedAt: string;

  firstLogin: boolean;

  entityId: string;
  hasSubordinates: boolean;
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
  tokenType: string;

  roleName: Role;
  permissions: string[];

  firstLogin: boolean;
}
export interface LoginResponseInner {
  userId: string;
  userName: string;
  companyEmail: string;

  createdAt: string;
  updatedAt: string;

  entityId: string;

  profileName: string;
  hasSubordinates: boolean;

  loginResponseDTO: LoginResponseDTO;
}


export interface RoleObject {
  roleId: string;
  roleName: Role;
  roleDesc: string;
  permissions: string[]; // array of strings
}
export interface LoggedInUser extends User {
  profileName: string;
  permissions: string[];
}

export interface LoginRequest {
  inputKey: string;
  password: string;
}

export interface LoginDTO {
  inputKey: string;
  password: string;
}

export interface TokenResponseData {
  accessToken?: string;
  refreshToken?: string;
  refreshExpiresAt?: string; // date-time
  tokenType?: string;
}

export interface ApiResponseObject<T = unknown> {
  data: T;
  message: string;
}
export interface LeaveCalendarEmployeeDTO {
  employeeId: string;
  employeeName: string;
  leaveType: "FULL_DAY" | "HALF_DAY" | "FIRST_HALF" | "SECOND_HALF";
  status: "APPROVED" | "PENDING" | "REJECTED";
}

export interface LeaveCalendarDTO {
  date: string; // YYYY-MM-DD
  employees: LeaveCalendarEmployeeDTO[];
}

export type WebResponseDTOLeaveCalendarDTO =
  WebResponseDTO<LeaveCalendarDTO[]>;


export interface WebResponseDTO<T> {
  flag: boolean;
  message: string;
  status: number; // int32
  response: T | null;
  totalRecords: number; // int64
  otherInfo: any;
}

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type AuthAction =
  | {
    type: "LOGIN_SUCCESS";
    payload: {
      user: User;
      accessToken: string | null;
      refreshToken: string | null;
    };
  }
  | {
    type: "UPDATE_USER";
    payload: Partial<LoggedInUser>;
  }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean };


export interface PasswordCheckRequestDTO {
  companyEmail: string;
  newPassword: string;
}

export interface WebResponseDTOPasswordCheck {
  flag: boolean;
  message: string;
  status: number;
  response: boolean;
  totalRecords: number;
  otherInfo: string | null;
}
export interface LeaveStatusCountResponseDTO {
  approved: number;
  availed: number;
  availableLeaves: number;
}

export interface WebResponseDTOLeaveStatusCount {
  flag: boolean;
  message: string;
  status: number;
  response: LeaveStatusCountResponseDTO;
  totalRecords: number;
  otherInfo: string | null;
}

// Additional Schemas
export interface EmployeeDocumentDTO {
  documentId: string | null;      // uuid
  docType?: DocumentType;
  file?: File | null;             // 👈 REAL uploaded file (optional)
  fileUrl?: string | null;        // 👈 existing file from backend (read-only)
  uploadedAt?: string;            // optional
  verified?: boolean;
}

export interface AllowanceDTO {
  allowanceId: string | null; // uuid
  allowanceType: string;
  amount: number | null;
}

export interface DeductionDTO {
  deductionId: string | null; // uuid
  deductionType: string;
  amount: number | null;
}

export interface EmployeeAdditionalDetailsDTO {
  // offerLetterUrl?: string;
  // contractUrl?: string;
  // taxDeclarationFormUrl?: string;
  // workPermitUrl?: string;
  backgroundCheckStatus?: string;
  remarks?: string;
}

export interface EmployeeEmploymentDetailsDTO {
  employmentId: string;                     // UUID
  employeeId: string;                       // UUID
  noticePeriodDuration?: NoticePeriodDuration;
  noticePeriodDurationLabel?: string;
  probationApplicable: boolean;
  probationDuration?: ProbationDuration;
  probationDurationLabel?: string;
  probationNoticePeriod?: ProbationNoticePeriod;
  probationNoticePeriodLabel?: string;
  bondApplicable: boolean;
  bondDuration?: BondDuration;
  bondDurationLabel?: string;
  workingModel?: WorkingModel;
  shiftTiming?: ShiftTiming;
  shiftTimingLabel?: string;
  department?: Department;
  dateOfConfirmation?: string;              // ISO date string (YYYY-MM-DD)
  location?: string;
}

export interface EmployeeEquipmentDTO {
  equipmentId: string | null; // uuid
  equipmentType: string; // e.g., "LAPTOP", "MONITOR"
  serialNumber: string;
  issuedDate?: string; // date
  returnedDate?: string; // date
}

export interface EmployeeInsuranceDetailsDTO {
  insuranceId: string; // uuid
  employeeId: string; // uuid
  policyNumber: string;
  providerName: string;
  coverageStart: string; // date
  coverageEnd: string; // date
  nomineeName: string;
  nomineeRelation: string;
  nomineeContact: string;
  groupInsurance: boolean;
  otherBenefits?: { [key: string]: string };
}

export interface EmployeeStatutoryDetailsDTO {
  statutoryId: string; // uuid
  employeeId: string; // uuid
  passportNumber?: string;
  taxRegime?: string;
  pfUanNumber?: string;
  esiNumber?: string;
  ssnNumber?: string;
}

export interface EmployeeSalaryDTO {
  employeeId: string; // UUID
  ctc: number | null;
  payType: PayType;
  standardHours: number | null;
  bankAccountNumber: string;
  ifscCode: string;
  payClass: PayClass;
  allowances?: AllowanceDTO[];
  deductions?: DeductionDTO[];
}
// Salary response models returned by salary endpoints
export interface SalaryAllowanceDTO {
  name: string; // e.g. "HOUSING_ALLOWANCE"
  amount: number;
}

export interface SalaryDeductionDTO {
  name: string; // e.g. "PF", "TAX"
  amount: number;
}

export interface SalarySummaryDTO {
  employeeId: string; // uuid
  employeeName: string;
  clientName?: string;
  salaryMonth: string; // date like "2025-10-01"
  basicPay: number;
  totalAllowances: number;
  allowances: SalaryAllowanceDTO[];
  totalDeductions: number;
  deductions: SalaryDeductionDTO[];
  totalHours?: number;
  grossSalary: number;
  netSalary: number;
  paymentStatus?: string; // e.g., "UNPAID", "PAID"
  payrollStatus?: string; // e.g., "DRAFT", "FINALIZED"
  paidLeaves: number;
  unpaidLeaves: number;
}

export interface ProjectDTO {
  projectId: string; // uuid
  projectName: string;
  clientId: string; // uuid
  startDate: string; // date
  endDate?: string; // date
  status: ProjectStatus;
  description?: string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
}

export interface AttendanceDTO {
  attendanceId: string; // uuid
  employeeId: string; // uuid
  date: string; // date
  status: AttendanceStatus;
  checkInTime?: string; // date-time
  checkOutTime?: string; // date-time
  remarks?: string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
}

export interface PayrollDTO {
  payrollId: string; // uuid
  employeeId: string; // uuid
  payPeriodStart: string; // date
  payPeriodEnd: string; // date
  basicPay: number;
  totalAllowances: number;
  totalDeductions: number;
  netPay: number;
  paymentDate: string; // date
  status: string; // e.g., "PROCESSED", "PENDING"
  createdAt: string; // date-time
  updatedAt: string; // date-time
}

export interface EmployeeModel {
  firstName: string;
  lastName: string;
  personalEmail: string;
  companyEmail: string;
  contactNumber: string;
  alternateContactNumber: string;
  gender: string;
  maritalStatus: string;
  numberOfChildren: number | null;
  employeePhotoUrl: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  remarks: string;
  skillsAndCertification: string;
  clientId: string | null;
  clientSelection: string;
  reportingManagerId: string | null;// UUID
  designation: Designation | null;
  dateOfBirth: string; // ISO Date (YYYY-MM-DD)
  dateOfJoining: string; // ISO Date (YYYY-MM-DD)
  dateOfOnboardingToClient: string;
  dateOfOffboardingToClient: string;
  clientBillingStartDate: string;
  clientBillingStopDate: string;
  rateCard: number | null;
  employmentType: EmploymentType;
  panNumber: string;
  aadharNumber: string;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  addresses: AddressModel[];
  documents: EmployeeDocumentDTO[];
  employeeSalaryDTO?: EmployeeSalaryDTO;
  employeeAdditionalDetailsDTO?: EmployeeAdditionalDetailsDTO;
  employeeEmploymentDetailsDTO?: EmployeeEmploymentDetailsDTO;
  employeeInsuranceDetailsDTO?: EmployeeInsuranceDetailsDTO;
  employeeStatutoryDetailsDTO?: EmployeeStatutoryDetailsDTO;
  employeeEquipmentDTO?: EmployeeEquipmentDTO[];
}


// export type WebResponseDTOEmployee = WebResponseDTO<EmployeeDTO>;
export type WebResponseDTOEmployeeList = WebResponseDTO<EmployeeDTO[]>;

export interface ClientModel {
  companyName: string;
  contactNumber: string;
  email: string | null; 
  gst: string;
  currency: string;
  netTerms: number | null;
  panNumber: string;
  tanNumber?: string;
  addresses?: AddressModel[];
  clientPocs?: ClientPocModel[];
  clientTaxDetails: ClientTaxDetail[]; // Array of tax detail objects
}
export interface ClientTaxDetail {
  taxId: string | null;       // UUID
  taxName: string;
  taxPercentage: number;
  // createdAt: string;     // ISO Date-Time format
  // updatedAt: string;     // ISO Date-Time format
}
export interface ClientPocModel {
  pocId: string | null;  // uuid
  name: string;
  email: string;
  contactNumber: string;
  designation: string;
}

export interface BankDetails {
  bankAccountId: string; // uuid
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
}

export interface HolidaySchemeDTO {
  holidaySchemeId: string;          // <- ID from backend
  schemeName: string;
  schemeDescription: string;
  createdByAdminId: string;
  city: string;
  state: string;
  schemeCountryCode: string;
  schemeCreatedAt: string;
  schemeUpdatedAt: string;
  holidayCalendarId: string[];      // <- Array of UUIDs
  schemeActive: boolean;
}

export interface ClientPoc {
  pocId: string; // uuid
  name: string;
  email: string;
  contactNumber: string;
  designation: string;
  status: string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
}

export interface Client {
  clientId: string; // uuid
  user: User;
  companyName: string;
  contactNumber: string;
  email: string;
  gst: string;
  tanNumber: string;
  currency: string;
  panNumber: string;
  status: string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
  pocs?: ClientPoc[];
}

export interface Employee {
  employeeId: string; // UUID
  user?: User;
  client?: Client;
  companyId?: string;
  bankDetails?: BankDetails;
  reportingManager?: Employee;
  firstName: string;
  lastName: string;
  personalEmail: string;
  companyEmail: string;
  contactNumber: string;
  alternateContactNumber: string;
  gender: string;
  maritalStatus: string;
  numberOfChildren: number;
  dateOfBirth: string; // ISO date
  dateOfJoining: string; // ISO date
  designation: Designation;
  employmentType: EmploymentType;
  rateCard: number;
  panNumber: string;
  availableLeaves: number;
  aadharNumber: string;
  employeePhotoUrl: string;
  documents: EmployeeDocumentDTO[];
  status: string;
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
}
export interface EmployeeDTO {
  employeeId: string;               // UUID
  firstName: string;
  lastName: string;
  personalEmail: string;
  companyEmail: string;
  contactNumber: string;
  alternateContactNumber: string;
  gender: string;
  maritalStatus: string;
  numberOfChildren: number;
  dateOfBirth: string;              // date
  employeePhotoUrl: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  remarks: string;
  skillsAndCertification: string;
  designation: Designation;
  dateOfJoining: string;
  dateOfOnboardingToClient: string;
  dateOfOffboardingToClient: string;
  clientBillingStartDate: string;
  clientBillingStopDate: string;           // date
  rateCard: number;
  availableLeaves: number;
  employmentType: EmploymentType;
  companyId: string;
  bankAccountId: string;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  panNumber: string;
  aadharNumber: string;
  clientId: string | null;          // uuid
  clientName: string;
  clientStatus: string;
  reportingManagerId: string;       // uuid
  reportingManagerName: string;
  documents: EmployeeDocumentDTO[];
  addresses: AddressModel[];
  employeeSalaryDTO?: EmployeeSalaryDTO;
  employeeAdditionalDetailsDTO?: EmployeeAdditionalDetailsDTO;
  employeeEmploymentDetailsDTO?: EmployeeEmploymentDetailsDTO;
  employeeInsuranceDetailsDTO?: EmployeeInsuranceDetailsDTO;
  employeeEquipmentDTO?: EmployeeEquipmentDTO[];
  employeeStatutoryDetailsDTO?: EmployeeStatutoryDetailsDTO;
  status: string;
  createdAt: string;                // date-time
  updatedAt: string;                // date-time
}



export interface ClientDTO {
  clientId: string;          // UUID
  userId: string;            // UUID
  companyName: string;
  contactNumber: string;
  email: string;
  gst: string;
  currency: string;
  panNumber: string;
  tanNumber: string;
  status: string;
  netTerms: number | null;
  clientTaxDetails: ClientTaxDetail[];
  createdAt: string;         // ISO Date-Time string
  updatedAt: string;         // ISO Date-Time string
  addresses: AddressModel[];
  pocs: ClientPoc;

}


export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string; // date-time
  tokenType: string;
}

export interface LeaveRequestDTO {
  leaveId?: string; // uuid
  categoryType: LeaveCategoryType;
  financialType: FinancialType;
  partialDay: boolean;
  leaveDuration: number; // double
  fromDate?: string; // date
  toDate?: string; // date
  context?: string;
  attachmentFile?: string; // binary
}

export interface LeaveResponseDTO {
  leaveId?: string; // uuid
  approverName?: string;
  employeeName?: string;
  fromDate?: string; // date
  toDate?: string; // date
  financialType?: FinancialType;
  leaveCategoryType?: LeaveCategoryType;
  subject?: string;
  context?: string;
  status?: LeaveStatus;
  approverComment?: string;
  holidays?: number; // int32
  leaveDuration?: number; // double
  attachmentUrl?: string;
}

export interface PendingLeavesResponseDTO {
  leaveId: string; // uuid
  employeeName: string;
  leaveCategoryType: LeaveCategoryType;
  financialType: FinancialType;
  fromDate: string; // date
  toDate: string; // date
  leaveDuration: number; // double
  attachmentUrl: string;
  remainingLeaves: number; // double
  context: string;
  status: LeaveStatus;
}

export interface EmployeeLeaveDayDTO {
  date: string; // date
  leaveCategory: LeaveCategoryType;
  duration: number; // double
}

export interface TimeSheetModel {
  timesheetId?: string; // optional, needed for updates
  workDate: string; // date
  hoursWorked: number;
  taskName: string;
  taskDescription: string;
  clientId: string; // uuid
  projectId?: string; // uuid
}

export interface TimeSheet {
  timesheetId: string; // uuid
  workDate: string;
  hoursWorked: number;
  taskName: string;
  taskDescription: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSheetResponseDto {
  timesheetId: string; // uuid
  clientId: string; // uuid
  clientName: string;
  employeeId: string; // uuid
  employeeName: string;
  workedHours: number;
  workDate: string; // date
  managerComment: string;
  taskName: string;
  projectName?: string;
  projectStartedAt?: string; // date
  projectEndedAt?: string; // date 
  status: string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
}
export interface NotificationDTO {
  id: string; // UUID
  employeeId: string; // UUID
  employeeFullName: string;
  message: string;
  referenceId: string; // UUID
  read: boolean;
  createdAt: string; // Date-time
  updatedAt: string; // Date-time
  notificationType: 'TIMESHEET' | 'LEAVE';
}

export interface SortObject {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

export interface PageableObject {
  paged: boolean;
  unpaged: boolean;
  pageNumber: number; // int32
  pageSize: number; // int32
  offset: number; // int64
  sort?: SortObject;
}

export interface PageLeaveResponseDTO {
  totalElements: number; // int64
  totalPages: number; // int32
  first: boolean;
  last: boolean;
  numberOfElements: number; // int32
  pageable: PageableObject;
  size: number; // int32
  content: LeaveResponseDTO[];
  number: number; // int32
  sort?: SortObject;
  empty: boolean;
}
export interface IfscResponseDTO {
  BANK: string;
  IFSC: string;
  BRANCH: string;
  ADDRESS: string;
  CITY: string;
  STATE: string;
  NEFT: boolean;
  IMPS: boolean;
  RTGS: boolean;
  UPI: boolean;
}

export interface BankMaster {
  bankCode: string;
  bankName: string;
}

// Request body for creating or updating holiday
export interface HolidaysModel {
  holidayDate: string; // yyyy-MM-dd
  holidayName: string;
  comments: string;
}

// Response DTO when fetching one holiday or listing all
export interface HolidaysDTO {
  holidayId: string; // UUID
  holidayDate: string;
  holidayName: string;
  comments: string;
  updateAt: string; // ISO DateTime
  createdAt: string; // ISO DateTime
}

// Single object response
export interface WebResponseDTOHolidaysDTO {
  flag: boolean;
  message: string;
  status?: number;
  response: HolidaysDTO;
  otherInfo?: any;
}

// List response
export interface WebResponseDTOListHolidaysDTO {
  flag: boolean;
  message: string;
  status?: number;
  response: HolidaysDTO[];
  totalRecords: number;
  otherInfo?: any;
}
export interface WebResponseDTOIfsc extends WebResponseDTO<IfscResponseDTO> { }

export interface WebResponseDTOListBankMaster
  extends WebResponseDTO<BankMaster[]> { }
// WebResponse Wrappers
export interface WebResponseDTOString {
  flag: boolean;
  message: string;
  status: number; // int32
  response: string;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}
export interface AdminDTO {
  adminId: string;
  fullName: string;
  email: string;
  contactNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUpdatePayload {
  fullName?: string;
  email?: string;
  contactNumber?: string;
}
export type TokenInfo = {
  token: string;
  expiry: string; // ISO date-time string
};

export type DeviceSessionDTO = {
  deviceId: string;                    // UUID as string (e.g., "a1b2c3d4-...")
  deviceName: string;                  // e.g., "Chrome-Win" or "Unknown Device"
  ipAddress: string;                   // e.g., "192.168.1.1" or "Unknown IP"
  userAgent: string;                   // full UA string
  loginTime: string;                   // ISO string: "2025-04-05T10:30:45"
  logoutTime: string | null;           // null if active
  status: "Active" | "De-Activate";    // exactly as in your DTO
  token: TokenInfo | null;             // currently null from backend
};

export type MySessionsResponseDTO = {
  activeSessions: DeviceSessionDTO[];
  loggedOutSessions: DeviceSessionDTO[];
};
export interface WebResponseDTOVoid {
  flag: boolean;
  message: string;
  status: number; // int32
  response: null;
  totalRecords: number; // int64
  otherInfo: any;
}

export interface OrganizationRequestDTO {
  organizationName: string;
  organizationLegalName: string;
  registrationNumber: string;

  gstNumber: string;
  panNumber: string;
  cinNumber: string;

  website: string;
  email: string;
  contactNumber: string;

  logo: File | null; // binary

  industryType: IndustryType;

  domain: Domain;


  establishedDate: string; // yyyy-mm-dd

  timezone: string;

  currencyCode: CurrencyCode;

  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  branchName: string;

  digitalSignature: File | null; // binary

  addresses: AddressModel[];

  prefix?: string;
  sequenceNumber?: number;
  companyType?: string;
}


export interface OrganizationResponseDTO {
  organizationId: string;
  organizationName: string;
  organizationLegalName: string;
  registrationNumber: string;
  gstNumber: string;
  panNumber: string;
  cinNumber: string;
  website: string;
  email: string;
  contactNumber: string;
  logoUrl: string;
  industryType: IndustryType;
  domain: Domain;
  establishedDate: string;
  timezone: string;
  currencyCode: CurrencyCode;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  digitalSignatureUrl: string;
  addresses: AddressModel[];
  prefix?: string;
  sequenceNumber?: number;
  companyType?: string;
  createdAt: string;
  updatedAt: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface WebResponseDTOListOrganizationResponseDTO {
  flag: boolean;
  message: string;
  status: number;
  response: OrganizationResponseDTO[];
  totalRecords: number;
  otherInfo: any;
}


export interface WebResponseDTOEmployeeDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: EmployeeDTO;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOListEmployeeDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: EmployeeDTO[];
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOClientDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: ClientDTO;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOListClientDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: ClientDTO[];
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOClient {
  flag: boolean;
  message: string;
  status: number; // int32
  response: Client;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOEmployee {
  flag: boolean;
  message: string;
  status: number; // int32
  response: Employee;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOListString {
  flag: boolean;
  message: string;
  status: number; // int32
  response: string[];
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOWorkdayResponseDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: WorkdayResponseDTO;
  totalRecords: number; // int64
  otherInfo: any;
}

export interface WebResponseDTOLeaveAvailabilityDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: LeaveAvailabilityDTO;
  totalRecords: number; // int64
  otherInfo: any;
}

export interface WebResponseDTOListEmployeeUpdateRequestDTO {
  flag: boolean;
  message: string;
  status: number;
  response: EmployeeUpdateRequestDTO[];
  totalRecords: number;
  otherInfo: any;
}

export interface WebResponseDTOApiResponseObject {
  flag: boolean;
  message: string;
  status: number; // int32
  response: ApiResponseObject;
  totalRecords: number; // int64
  otherInfo: any;
}
export interface WebResponseDTOListNotificationDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: NotificationDTO[];
  totalRecords: number; // int64
  otherInfo: any;
}

export interface WebResponseDTOListTimeSheetResponseDto {
  flag: boolean;
  message: string;
  status: number; // int32
  response: TimeSheetResponseDto[];
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOTimeSheetResponseDto {
  flag: boolean;
  message: string;
  status: number; // int32
  response: TimeSheetResponseDto;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOLeaveResponseDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: LeaveResponseDTO;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOPageLeaveResponseDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: PageLeaveResponseDTO;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOListPendingLeavesResponseDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: PendingLeavesResponseDTO[];
  totalRecords: number; // int64
  otherInfo: any;
}

export interface WebResponseDTOListEmployeeLeaveDayDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: EmployeeLeaveDayDTO[];
  totalRecords: number; // int64
  otherInfo: any;
}

export interface WebResponseDTOTimeSheet {
  flag: boolean;
  message: string;
  status: number; // int32
  response: TimeSheet;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOMapStringString {
  flag?: boolean;
  message?: string;
  status?: number; // int32
  response?: { [key: string]: string };
  totalRecords: number; // int64
  otherInfo?: any;
}

export interface RefreshInnerResponse {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string; // date-time
  tokenType: string;
  data: any;
}

export interface WebResponseDTOProjectDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: ProjectDTO;
  totalRecords: number; // int64
  otherInfo: any;
}

export interface WebResponseDTOListProjectDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: ProjectDTO[];
  totalRecords: number; // int64
  otherInfo: any;
}

export interface WebResponseDTOAttendanceDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: AttendanceDTO;
  totalRecords: number; // int64
  otherInfo: any;
}

export interface WebResponseDTOListAttendanceDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: AttendanceDTO[];
  totalRecords: number; // int64
  otherInfo: any;
}

export interface WebResponseDTOPayrollDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: PayrollDTO;
  totalRecords: number; // int64
  otherInfo: any;
}

export interface WebResponseDTOListPayrollDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: PayrollDTO[];
  totalRecords: number; // int64
  otherInfo: any;
}
export interface LoginInnerResponse {
  data: LoginResponseInner;
  message?: string;
}
// Password Types
export interface UpdatePasswordRequestDTO {
  oldPassword: string;
  newPassword: string;
}

export interface PasswordResponseDTO {
  identifier: string;
  status: 'OTP_SENT' | 'OTP_VERIFIED' | 'OTP_INVALID' | 'OTP_EXPIRED' | 'PASSWORD_RESET' | 'RESET_FAILED' | 'USER_NOT_FOUND' | 'MAX_ATTEMPTS_EXCEEDED';
  timestamp: string;
  expiry?: string;
  verified: boolean;
  message: string;
}

export interface WebResponseDTOPasswordResponseDTO {
  flag: boolean;
  message: string;
  status: number;
  response: PasswordResponseDTO;
  totalRecords: number;
  otherInfo?: any;
}

export interface WebResponseDTOObject {
  flag: boolean;
  message: string;
  status: number;
  response: any;
  totalRecords: number;
  otherInfo?: any;
}
// Invoice Types
export interface InvoiceDTO {
  invoiceId: string;       // UUID
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  totalHours: number;
  status: InvoiceStatus;   // Enum type
  invoiceDate: string;     // ISO Date (YYYY-MM-DD)
  dueDate: string;         // ISO Date (YYYY-MM-DD)
  fromDate: string;        // ISO Date (YYYY-MM-DD)
  toDate: string;          // ISO Date (YYYY-MM-DD)
  locked: boolean;
}

// For list responses
export interface WebResponseDTOListInvoiceDTO {
  flag: boolean;
  message: string;
  status: number;
  response: InvoiceDTO[];
  totalRecords: number;
  otherInfo: any;
}
export interface WebResponseDTOInvoiceDTO {
  flag: boolean;
  message: string;
  status: number;
  response: InvoiceDTO;
  totalRecords: number;
  otherInfo: any;
}
// EmployeeWorkSummaryDTO
export interface EmployeeWorkSummaryDTO {
  employeeName: string;
  companyId: string;
  rateCard: number;
  totalHours: number;
  totalAmount: number;
}
export interface ClientInvoiceSummaryDTO {
  invoiceId: string;
  clientId: string;
  invoiceStatus: InvoiceStatus;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  fromDate: string;
  toDate: string;
  employeeWorkSummaries: EmployeeWorkSummaryDTO[];
}


// WebResponseDTOListClientInvoiceSummaryDTO
export interface WebResponseDTOListClientInvoiceSummaryDTO {
  flag: boolean;
  message: string;
  status: number;
  response: ClientInvoiceSummaryDTO[];
  totalRecords: number;
  otherInfo?: any;
}
// export const enumNamesFromMap = <T extends string>(map: Record<T, any>): T[] =>
//   Object.keys(map) as T[];

// ---------------- Holiday DTOs ----------------
// Request body for creating or updating holiday
export interface HolidaysModel {
  holidayDate: string; // yyyy-MM-dd
  holidayName: string;
  comments: string;
}

// Response DTO when fetching one holiday or listing all
export interface HolidaysDTO {
  holidayId: string; // UUID
  holidayDate: string;
  holidayName: string;
  comments: string;
  updateAt: string; // ISO DateTime
  createdAt: string; // ISO DateTime
}

// Single object response
export interface WebResponseDTOHolidaysDTO {
  flag: boolean;
  message: string;
  status?: number;
  response: HolidaysDTO;
  otherInfo?: any;
}

// List response
export interface WebResponseDTOListHolidaysDTO {
  flag: boolean;
  message: string;
  status?: number;
  response: HolidaysDTO[];
  totalRecords: number;
  otherInfo?: any;
}

export interface RevertTimesheetRequest {
  employeeId: string;   // UUID
  startDate: string;    // yyyy-MM-dd
  endDate: string;      // yyyy-MM-dd
  workRequest: string;
}

// types.ts

export type WorkRequest =
  | "DRAFTED"
  | "SUBMITTED"
  | "APPROVED"
  | "PENDING"
  | "REJECTED";

export const workRequestLabels: Record<WorkRequest, string> = {
  DRAFTED: "Drafted",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  PENDING: "Pending",
  REJECTED: "Rejected",
};

export type HolidayUpdateType = "ADD_HOLIDAY" | "REMOVE_HOLIDAY";

export interface HolidayUpdateRequestDTO {
  holidayDate: string;
  holidayName: string;
  updateType: HolidayUpdateType;
  clientID: string;
}

export interface ClientMinDTO {
  clientId: string;
  companyName: string;
}

export type ClientEmployeeMinResponseDTO = {
  currency: 'INR' | 'USD';
  employees: EmployeeMinDTO[];
};

export interface EmployeeMinDTO {
  employeeId: string;
  employeeName: string;
  companyId: string;
  rateCard: number | null;
  dateOfJoining: string;
}
export interface ManualInvoiceItemRequestDTO {
  employeeId: string;
  hoursWorked: number;      // decimal allowed
  ratePerHour: number;      // decimal allowed
  description?: string;
}
export interface ManualInvoiceRequestDTO {
  clientId: string;
  year: number;
  month: number;

  invoiceNumber: string;
  invoiceDate?: string; // yyyy-MM-dd
  dueDate?: string;     // yyyy-MM-dd

  items: ManualInvoiceItemRequestDTO[];
}

export interface LeaveAdjustmentRequestDTO {
  employeeId: string;   // UUID as string
  adjustment: number;   // +ve or -ve
}

export type LeaveAdjustmentResponse = Record<string, number>;

export interface SuperHrHolidayRequestDTO {
  holidayDate: string;        // yyyy-MM-dd
  holidayName: string;
  employeeIds: string[];      // UUIDs
}

export interface DeleteEmployeeHolidayRequestDTO {
  holidayId: string;          // UUID
  employeeId: string;         // UUID
}

export type EmployeePasswordState = {
  selected: boolean;
  password: string;
};

// ClientEmployeeHistoryDTO
export interface ClientEmployeeHistoryDTO {
  employeeId: string;
  firstName: string;
  lastName: string;
  onboardDate: string;
  billingStartDate: string;
  offboardDate: string;
  billingEndDate: string;
  active: boolean;
}

// EmployeeClientHistoryDTO
export interface EmployeeClientHistoryDTO {
  clientId: string;
  clientName: string;
  onboardDate: string;
  billingStartDate: string;
  offboardDate: string;
  billingEndDate: string;
  active: boolean;
}

export interface HolidayDTO {
  holidayId: string;
  holidayName: string;
  holidayDate: string; // ISO date string (YYYY-MM-DD)
  comments: string | null;
}
