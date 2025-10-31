// Enums
export type Role = "ADMIN" | "EMPLOYEE" | "CLIENT" | "MANAGER";

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
export type DocumentType = "OFFER_LETTER" | "CONTRACT" | "TAX_DECLARATION_FORM" | "WORK_PERMIT" | "PAN_CARD" | "AADHAR_CARD" | "BANK_PASSBOOK" | "TENTH_CERTIFICATE" | "INTERMEDIATE_CERTIFICATE" | "DEGREE_CERTIFICATE" | "POST_GRADUATION_CERTIFICATE" | "OTHER";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY";
export type ProjectStatus = "ACTIVE" | "INACTIVE" | "COMPLETED" | "ON_HOLD";
export type AddressType = "CURRENT" | "PERMANENT" | "OFFICE";
export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'GENERATED';
// Core Models
export interface AddressModel {
  addressId?: string; // uuid
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

export interface LeaveAvailabilityDTO {
  availableLeaves: number; // double
  requestedLeave: number; // double
  message: string;
  available: boolean;
}

export interface User {
  userId: string; // uuid
  userName: string;
  companyEmail: string;
  password?: string;
  role: Role;
  createdAt: string; // date-time
  updatedAt: string; // date-time
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
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean };

// Additional Schemas
export interface EmployeeDocumentDTO {
  documentId: string; // uuid
  docType: DocumentType;
  fileUrl: string;
  uploadedAt: string; // date-time
  verified: boolean;
}

export interface AllowanceDTO {
  allowanceId: string; // uuid
  allowanceType: string;
  amount: number;
  effectiveDate: string; // date
}

export interface DeductionDTO {
  deductionId: string; // uuid
  deductionType: string;
  amount: number;
  effectiveDate: string; // date
}

export interface EmployeeAdditionalDetailsDTO {
  offerLetterUrl?: string;
  contractUrl?: string;
  taxDeclarationFormUrl?: string;
  workPermitUrl?: string;
  backgroundCheckStatus?: string;
  remarks?: string;
}

export interface EmployeeEmploymentDetailsDTO {
  employmentId: string; // uuid
  employeeId: string; // uuid
  noticePeriodDuration?: string;
  probationApplicable?: boolean;
  probationDuration?: string;
  probationNoticePeriod?: string;
  bondApplicable?: boolean;
  bondDuration?: string;
  workingModel?: string; // e.g., "REMOTE", "HYBRID", "ONSITE"
  shiftTiming?: string;
  department?: string;
  dateOfConfirmation?: string; // date
  location?: string;
}

export interface EmployeeEquipmentDTO {
  equipmentId: string; // uuid
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
  employeeId: string; // uuid
  basicPay: number;
  payType: string; // e.g., "MONTHLY", "HOURLY"
  standardHours: number;
  bankAccountNumber: string;
  ifscCode: string;
  payClass: string;
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
    numberOfChildren: number;
    employeePhotoUrl: string;
    nationality: string;
    emergencyContactName: string;
    emergencyContactNumber: string;
    remarks: string;
    skillsAndCertification: string;
    clientId: string; // UUID
    reportingManagerId: string; // UUID
    designation: Designation;
    dateOfBirth: string; // ISO Date (YYYY-MM-DD)
    dateOfJoining: string; // ISO Date (YYYY-MM-DD)
    rateCard: number;
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


export interface ClientModel {
  companyName: string;
  contactNumber: string;
  email: string;
  gst: string;
  currency: string;
  panNumber: string;
  tanNumber?: string;
  addresses?: AddressModel[];
  clientPocs?: ClientPocModel[];
  clientTaxDetails: ClientTaxDetail[]; // Array of tax detail objects
}
export interface ClientTaxDetail {
  taxId: string;         // UUID
  taxName: string;
  taxPercentage: number;
  createdAt: string;     // ISO Date-Time format
  updatedAt: string;     // ISO Date-Time format
}
export interface ClientPocModel {
  pocId: string; // uuid
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

export interface HolidaySchemeModel {
  holidayCalendarId?: string; // UUID
  schemeName?: string;
  schemeDescription?: string;
  city?: string;
  state?: string;
  schemeCountryCode?: string;
  activeStatus?: boolean;
}

export interface HolidayCalendarModel {
  holidayName?: string;
  calendarDescription?: string;
  holidayDate?: string; // Date format (YYYY-MM-DD)
  locationRegion?: string;
  holidayType?: HolidayType;
  recurrenceRule?: RecurrenceRule;
  calendarCountryCode?: string;
  activeStatus?: boolean;
}

export interface HolidayCalendarDTO {
  holidayCalendarId: string; // uuid
  holidayName: string;
  calendarDescription: string;
  holidayDate: string; // date
  locationRegion: string;
  holidayType: HolidayType;
  recurrenceRule: RecurrenceRule;
  calendarCountryCode: string | null;
  createdByAdminId: string; // uuid
  holidayActive: boolean;
}

export interface NotificationDTO {
  id: string; // UUID
  message: string;
  referenceId: string; // UUID
  read: boolean;
  createdAt: string; // Date-time
  updatedAt: string; // Date-time
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
  employeeId: string; // UUID
  firstName: string;
  lastName: string;
  personalEmail: string;
  companyEmail: string;
  contactNumber: string;
  alternateContactNumber: string;
  gender: string;
  maritalStatus: string;
  numberOfChildren: number;
  dateOfBirth: string; // ISO Date (YYYY-MM-DD)
  employeePhotoUrl: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  remarks: string;
  skillsAndCertification: string;
  designation: Designation;
  dateOfJoining: string; // ISO Date (YYYY-MM-DD)
  rateCard: number;
  availableLeaves: number;
  employmentType: EmploymentType;
  companyId: string;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  panNumber: string;
  aadharNumber: string;
  clientId: string; // UUID
  clientName: string;
  reportingManagerId: string; // UUID
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
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
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
  partialDay?: boolean;
  leaveDuration?: number; // double
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
  managerComment:string;
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
  message: string;
  referenceId: string; // UUID
  read: boolean;
  createdAt: string; // Date-time
  updatedAt: string; // Date-time
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

// WebResponse Wrappers
export interface WebResponseDTOString {
  flag: boolean;
  message: string;
  status: number; // int32
  response: string;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

export interface WebResponseDTOVoid {
  flag: boolean;
  message: string;
  status: number; // int32
  response: null;
  totalRecords: number; // int64
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

export interface WebResponseDTOHolidayCalendarDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: HolidayCalendarDTO;
  totalRecords: number; // int64
  otherInfo?: Record<string, unknown>;
}

export interface WebResponseDTOListHolidayCalendarDTO {
  flag: boolean;
  message: string;
  status: number; // int32
  response: HolidayCalendarDTO[];
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
export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string; // date-time
  tokenType: string;
  role: Role;
}
export interface LoginResponseInner {
  loginResponseDTO: LoginResponseDTO;
  userId: string; // uuid
  employeeId?: string; // uuid, for EMPLOYEE or MANAGER roles
  clientId?: string; // uuid, for CLIENT role
  userName: string;
  companyEmail: string;
  email?: string; // fallback for companyEmail
  firstName?: string; // for EMPLOYEE, MANAGER, or CLIENT
  lastName?: string; // for EMPLOYEE, MANAGER, or CLIENT
  personalEmail?: string; // for EMPLOYEE or MANAGER
  contactNumber?: string; // for EMPLOYEE or MANAGER
  alternateContactNumber?: string; // for EMPLOYEE or MANAGER
  gender?: string; // for EMPLOYEE or MANAGER
  maritalStatus?: string; // for EMPLOYEE or MANAGER
  numberOfChildren?: number; // for EMPLOYEE or MANAGER
  employeePhotoUrl?: string; // for EMPLOYEE or MANAGER
  designation?: Designation; // for EMPLOYEE or MANAGER
  dateOfBirth?: string; // date, for EMPLOYEE or MANAGER
  dateOfJoining?: string; // date, for EMPLOYEE or MANAGER
  currency?: string; // for EMPLOYEE or MANAGER
  rateCard?: number; // for EMPLOYEE or MANAGER
  panNumber?: string; // for EMPLOYEE or MANAGER
  aadharNumber?: string; // for EMPLOYEE or MANAGER
  reportingManagerId?: string; // uuid, for EMPLOYEE or MANAGER
  createdAt: string; // date-time
  updatedAt: string; // date-time
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