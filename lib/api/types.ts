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

export interface ApiResponseObject<T = any> {
  data: T;
  message: string;
}

export interface WebResponseDTO<T> {
  flag: boolean;
  message: string;
  status: number;
  response: T;
  totalRecords: number;
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

// LeaveResponseDTO
export interface LeaveResponseDTO {
  leaveId: string;
  approverName: string;
  employeeName: string;
  fromDate: string;
  toDate: string;
  type: LeaveType;
  subject: string;
  context: string;
  status: LeaveStatus;
  adminComment?: string;
  holidays: number;
  workingdays: number;
}

// SortObject
export interface SortObject {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

// PageableObject
export interface PageableObject {
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
  offset: number;
  sort?: SortObject;
}

// PageLeaveResponseDTO
export interface PageLeaveResponseDTO {
  totalElements: number;
  totalPages: number;
  pageable: PageableObject;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: LeaveResponseDTO[];
  number: number;
  sort?: SortObject;
  empty: boolean;
}

// TimeSheetModel
export interface TimeSheetModel {
  workDate: string; // date
  hoursWorked: number;
  taskName: string;
  taskDescription: string;
  status: string;
}

// TimeSheet
export interface TimeSheet {
  timesheetId: string; // uuid
  employee?: Employee; // Optional for some responses
  workDate: string; // date
  hoursWorked: number;
  taskName: string;
  taskDescription: string;
  status: string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
}

// TimeSheetResponseDto
export interface TimeSheetResponseDto {
  timesheetId: string;
  clientId: string;
  clientName: string;
  employeeId: string;
  employeeName: string;
  workedHours: number;
  workDate: string;
  taskName: string;
  taskDescription: string;
  projectName?: string;
  projectStartedAt?: string;
  projectEndedAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// WebResponseDTOTimeSheet (specific for TimeSheet)
export interface WebResponseDTOTimeSheet {
  flag: boolean;
  message: string;
  status: number; // int32
  response: TimeSheet;
  totalRecords: number; // int64
  otherInfo: Record<string, any>;
}

// WebResponseDTOListTimeSheetResponseDto
export interface WebResponseDTOListTimeSheetResponseDto {
  flag: boolean;
  message: string;
  status: number;
  response: TimeSheetResponseDto[];
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOTimeSheetResponseDto
export interface WebResponseDTOTimeSheetResponseDto {
  flag: boolean;
  message: string;
  status: number;
  response: TimeSheetResponseDto;
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOLeaveResponseDTO
export interface WebResponseDTOLeaveResponseDTO {
  flag: boolean;
  message: string;
  status: number;
  response: LeaveResponseDTO;
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOPageLeaveResponseDTO
export interface WebResponseDTOPageLeaveResponseDTO {
  flag: boolean;
  message: string;
  status: number;
  response: PageLeaveResponseDTO;
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOListString
export interface WebResponseDTOListString {
  flag: boolean;
  message: string;
  status: number;
  response: string[];
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOEmployeeDTO
export interface WebResponseDTOEmployeeDTO {
  flag: boolean;
  message: string;
  status: number;
  response: EmployeeDTO;
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOListEmployeeDTO
export interface WebResponseDTOListEmployeeDTO {
  flag: boolean;
  message: string;
  status: number;
  response: EmployeeDTO[];
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOClientDTO
export interface WebResponseDTOClientDTO {
  flag: boolean;
  message: string;
  status: number;
  response: ClientDTO;
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOListClientDTO
export interface WebResponseDTOListClientDTO {
  flag: boolean;
  message: string;
  status: number;
  response: ClientDTO[];
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOEmployee
export interface WebResponseDTOEmployee {
  flag: boolean;
  message: string;
  status: number;
  response: Employee;
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOClient
export interface WebResponseDTOClient {
  flag: boolean;
  message: string;
  status: number;
  response: Client;
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOAddressModel
export interface WebResponseDTOAddressModel {
  flag: boolean;
  message: string;
  status: number;
  response: AddressModel;
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// WebResponseDTOString
export interface WebResponseDTOString {
  flag: boolean;
  message: string;
  status: number;
  response: string;
  totalRecords: number;
  otherInfo: Record<string, any>;
}

// Refresh Inner Response
export interface RefreshInnerResponse {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string; // ISO date string
  tokenType: string;
  data: any;
}

// Login Inner Response
export interface LoginInnerResponse {
  data: any; // Can replace `any` with a more specific login response if known
  message: string;
}