// lib/api/types.ts (updated to make email optional in User)
export interface User {
  userId: string;
  userName: string;
  email?: string; // Made optional to handle null values from backend
  password?: string; // Optional, as it's not always included
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
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
 
// Employee Model (for add/update)
export interface EmployeeModel {
  firstName: string;
  lastName: string;
  personalEmail: string;
  companyEmail: string;
  contactNumber: string;
  clientId: string;
  designation: string;
  dateOfBirth: string;
  dateOfJoining: string;
  currency: string;
  rateCard: number;
  panNumber: string;
  aadharNumber: string;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  houseNo: string;
  streetName: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  panCardUrl: string;
  aadharCardUrl: string;
  bankPassbookUrl: string;
  tenthCftUrl: string;
  interCftUrl: string;
  degreeCftUrl: string;
  postGraduationCftUrl: string;
}
 
// Client Model (for add/update)
export interface ClientModel {
  companyName: string;
  contactNumber: string;
  email: string;
  gst: string;
  currency: string;
  panNumber: string;
  houseNo: string;
  streetName: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}
 
// Address
export interface Address {
  addressId: string;
  houseNo: string;
  streetName: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
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
 
// Client
export interface Client {
  clientId: string;
  user: User;
  address: Address;
  companyName: string;
  contactNumber: string;
  email: string;
  gst: string;
  currency: string;
  panNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
 
// Employee
export interface Employee {
  employeeId: string;
  user: User;
  client: Client;
  address: Address;
  bankDetails: BankDetails;
  firstName: string;
  lastName: string;
  personalEmail: string;
  companyEmail: string;
  contactNumber: string;
  currency: string;
  dateOfBirth: string;
  dateOfJoining: string;
  designation: string;
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
 
// EmployeeDTO (for list/get)
export interface EmployeeDTO {
  employeeId: string;
  firstName: string;
  lastName: string;
  personalEmail: string;
  companyEmail: string;
  contactNumber: string;
  dateOfBirth: string;
  designation: string;
  dateOfJoining: string;
  currency: string;
  rateCard: number;
  availableLeaves: number;
  panNumber: string;
  aadharNumber: string;
  clientId: string;
  clientName: string;
  panCardUrl: string;
  aadharCardUrl: string;
  bankPassbookUrl: string;
  tenthCftUrl: string;
  interCftUrl: string;
  degreeCftUrl: string;
  postGraduationCftUrl: string;
  status: string;
}
 
// ClientDTO (for list/get)
export interface ClientDTO {
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
  houseNo: string;
  streetName: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}
 
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
 
// LoginDTO
export interface LoginDTO {
  inputKey: string;
  password: string;
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
 

 
// Refresh Token Inner Response
export interface RefreshInnerResponse {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string; // ISO date string
  tokenType: string;
  data: unknown;
}
 
export interface LoginInnerResponse {
  data: unknown; // Can replace `unknown` with a more specific login response if known
  message: string;
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
  status: 'Pending' | 'Approved' | 'Rejected' | "Draft" | "Submitted"; // strictly typed
  employeeId?: string;  // optional
}


// Used when fetching timesheet details
export interface TimeSheet {
  timesheetId: string; // uuid
  workDate: string;
  hoursWorked: number;
  taskName: string;
  taskDescription: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt: string;
}

// // Generic WebResponse for a single or list of timesheets
// export interface WebResponseDTOTimeSheet {
//   flag: boolean;
//   message: string;
//   status: number;
//   response: TimeSheet | TimeSheet[]; // ✅ can handle single or list
//   totalRecords: number;
//   otherInfo: Record<string, any>;
// }

// export interface WebResponseDTOTimeSheet {
//   flag: boolean;
//   message: string;
//   status: number; // int32
//   response: TimeSheet;
//   totalRecords: number; // int64
//   otherInfo: Record<string, any>;
// }

// export interface WebResponseDTOTimeSheet {
//   flag: boolean;
//   message: string;
//   status: number;
//   response: TimeSheetModel;
// }
 
export interface WebResponseDTOTimeSheet<T = TimeSheetModel | TimeSheet> {
  flag: boolean;
  message: string;
  status: number;
  response: T | T[];
  totalRecords?: number;
  otherInfo?: Record<string, unknown>;
}




// Used specifically when backend returns a list of timesheets
export interface WebResponseDTOListTimesheet {
  flag: boolean;                        // API success/failure flag
  message: string;                      // Response message
  status: number;                       // HTTP status
  response: TimeSheet[];                // ✅ Always an array
  totalRecords: number;                 // For pagination
  otherInfo: Record<string, unknown>;       // Any additional metadata
}






export interface TimeSheetResponse {
  timesheetId: string;
  workDate: string;
  hoursWorked: number;
  taskName: string;
  taskDescription: string;
  status: string;
}

export interface TimeSheetListResponse {
  flag: boolean;
  message: string;
  status: number;
  response: TimeSheetResponse[];
  totalRecords: number;
}
