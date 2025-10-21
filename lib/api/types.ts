// lib/api/types.ts (updated based on backend OpenAPI schema)
export type Role = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export type Designation = 
  | 'INTERN'
  | 'TRAINEE'
  | 'ASSOCIATE_ENGINEER'
  | 'SOFTWARE_ENGINEER'
  | 'SENIOR_SOFTWARE_ENGINEER'
  | 'LEAD_ENGINEER'
  | 'TEAM_LEAD'
  | 'TECHNICAL_ARCHITECT'
  | 'REPORTING_MANAGER'
  | 'DELIVERY_MANAGER'
  | 'DIRECTOR'
  | 'VP_ENGINEERING'
  | 'CTO'
  | 'HR'
  | 'FINANCE'
  | 'OPERATIONS';

export type LeaveType = 'PAID' | 'UNPAID' | 'SICK' | 'CASUAL';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  userId: string;
  userName: string;
  companyEmail: string;
  password?: string; // Optional, as it's not always included
  role: Role;
  createdAt: string;
  updatedAt: string;
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
  refreshExpiresAt?: string;
  tokenType?: string;
}
 
export interface ApiResponseObject<T = unknown> {
  data: T;
  message: string;
}

export interface WebResponseDTO<T> {
  flag: boolean;
  message: string;
  status: number;
  response: T;
  totalRecords: number;
  otherInfo?: Record<string, unknown>;
}

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string | null; refreshToken: string | null } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

// EmployeeModel (for add/update)

export interface EmployeeModel {
  firstName: string;
  lastName: string;
  personalEmail: string;
  companyEmail: string;
  contactNumber: string;
  alternateContactNumber: string;
  gender: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  employeePhotoUrl?: string;
  clientId?: string;
  reportingManagerId?: string;
  designation: Designation;
  dateOfBirth: string;
  dateOfJoining: string;
  currency: string;
  rateCard: number;
  panNumber: string;
  aadharNumber: string;
  accountNumber?: string;
  accountHolderName?: string;
  bankName?: string;
  ifscCode?: string;
  branchName?: string;
  houseNo?: string;
  streetName?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  addressType?: string;
  panCardUrl?: string;
  aadharCardUrl?: string;
  bankPassbookUrl?: string;
  tenthCftUrl?: string;
  interCftUrl?: string;
  degreeCftUrl?: string;
  postGraduationCftUrl?: string;
}

// Client Model (for add/update)
export interface ClientModel {
  companyName: string;
  contactNumber: string;
  email: string;
  gst: string;
  currency: string;
  panNumber: string;
  addressModel: AddressModel;
}

// AddressModel
export interface AddressModel {
  addressId?: string;
  houseNo: string;
  streetName: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  addressType: string;
}

// BankDetails
export interface BankDetails {
  bankAccountId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  createdAt: string;
  updatedAt: string;
}

// ClientPoc
export interface ClientPoc {
  pocId: string;
  name: string;
  email: string;
  contactNumber: string;
  designation: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Client
export interface Client {
  clientId: string;
  user: User;
  companyName: string;
  contactNumber: string;
  email: string;
  gst: string;
  tanNumber?: string;
  currency: string;
  panNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  pocs?: ClientPoc[];
}

// Employee
export interface Employee {
  employeeId: string;
  user: User;
  client: Client;
  bankDetails?: BankDetails;
  reportingManager?: Employee; // Recursive reference
  firstName: string;
  lastName: string;
  personalEmail: string;
  companyEmail: string;
  contactNumber: string;
  alternateContactNumber: string;
  gender: string;
  maritalStatus: string;
  numberOfChildren: number;
  employeePhotoUrl?: string;
  dateOfBirth: string;
  dateOfJoining: string;
  designation: Designation;
  rateCard: number;
  panNumber: string;
  availableLeaves: number;
  aadharNumber: string;
  panCardUrl: string;
  aadharCardUrl: string;
  bankPassbookUrl: string;
  tenthCftUrl: string;
  interCftUrl: string;
  degreeCftUrl: string;
  postGraduationCftUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// EmployeeDTO (for list/get) - extended with optional fields for view page compatibility
export interface EmployeeDTO {
  employeeId: string;
  firstName: string;
  lastName: string;
  personalEmail: string;
  companyEmail: string;
  contactNumber: string;
  alternateContactNumber?: string;
  dateOfBirth: string;
  designation: Designation;
  dateOfJoining: string;
  gender?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  currency: string;
  rateCard: number;
  availableLeaves: number;
  panNumber: string;
  aadharNumber: string;
  accountNumber?: string;
  accountHolderName?: string;
  bankName?: string;
  ifscCode?: string;
  branchName?: string;
  houseNo?: string;
  streetName?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  addressType?: string;
  photoUrl?: string;
  panCardUrl: string;
  aadharCardUrl: string;
  bankPassbookUrl: string;
  tenthCftUrl: string;
  interCftUrl: string;
  degreeCftUrl: string;
  postGraduationCftUrl: string;
  reportingManagerId?: string;
  clientId: string;
  clientName: string;
  status: string;
}

// ClientDTO (for list/get)
export type ClientDTO = {
  clientId: string;
  userId: string;
  addressId: string;
  companyName: string;
  contactNumber: string;
  email: string;
  gst: string;
  currency: string;
  panNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;

  // Nested address object
  addressModel: AddressModel;
};

// RefreshTokenRequestDTO
export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

// RefreshTokenResponseDTO
export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
  tokenType: string;
}

// LeaveRequestDTO
export interface LeaveRequestDTO {
  leaveId?: string;
  approvalName: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  subject: string;
  context: string;
}
 

 
// export interface TimeSheet {
//   timesheetId: string; // uuid
//   workDate: string; // date
//   hoursWorked: number;
//   taskName: string;
//   taskDescription: string;
//   status: string;
//   createdAt: string; // date-time
//   updatedAt: string; // date-time
// }
 

 
// Inner shape returned by the login endpoint under response.data
export interface LoginResponseInner {
  userId?: string;
  employeeId?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt?: string;
  dateOfJoining?: string;
  status?: string;
  loginResponseDTO?: {
    role?: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface LoginInnerResponse {
  data: LoginResponseInner;
  message?: string;
}

// Inner shape returned by refresh token endpoint
export interface RefreshInnerResponse {
  data: {
    user?: User;
    accessToken?: string;
    refreshToken?: string;
    refreshExpiresAt?: string;
    tokenType?: string;
  };
}
 

//-----------------------------------------------------
// 🧩 TIMESHEET TYPES
//-----------------------------------------------------

// Used when creating or updating a timesheet
// export interface TimeSheetModel {
//   timesheetId?: string; // optional for update
//   workDate: string; // date (ISO)
//   hoursWorked: number;
//   taskName: string;
//   taskDescription: string;
//   status: 'Pending' | 'Approved' | 'Rejected';
//   employeeId?: string;
// }

// export interface TimeSheetModel {
//   workDate: string;
//   hoursWorked: number;
//   taskName: string;
//   taskDescription: string;
//   status: string;
// }

// export interface TimeSheetModel {
//   workDate: string; // date
//   hoursWorked: number;
//   taskName: string;
//   taskDescription: string;
//   status: string;
// }


export interface TimeSheetModel {
  timesheetId?: string; // optional, needed for updates
  workDate: string;     // ISO date string
  hoursWorked: number;
  taskName: string;
  taskDescription: string;
  status: string; // backend uses free-form string values (e.g. Draft, Submitted, Pending)
  employeeId?: string;  // optional
}

// Used when fetching timesheet details (single record returned by some endpoints)
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

// Backend DTO returned by the employee view timesheet list
export interface TimeSheetResponseDto {
  timesheetId?: string;
  clientId?: string;
  clientName?: string;
  employeeId?: string;
  employeeName?: string;
  workedHours?: number; // backend field name
  workDate?: string;
  taskName?: string;
  taskDescription?: string;
  projectName?: string;
  projectStartedAt?: string;
  projectEndedAt?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Frontend simplified timesheet response used in the UI (mapped from TimeSheetResponseDto)
export interface TimeSheetResponse {
  timesheetId: string;
  workDate: string;
  hoursWorked: number;
  taskName: string;
  taskDescription: string;
  status: string;
}

// Used specifically when backend returns a list of timesheets
export interface WebResponseDTOListTimesheet {
  flag: boolean;                        // API success/failure flag
  message: string;                      // Response message
  status: number;                       // HTTP status
  response: TimeSheetResponseDto[];     // backend list DTO
  totalRecords: number;                 // For pagination
  otherInfo: Record<string, unknown>;       // Any additional metadata
}
