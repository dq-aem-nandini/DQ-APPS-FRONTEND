// /components/sidebar.config.tsx

export const sidebarConfig = {
  common: [
    { label: "Dashboard", href: "/dashboard", },
    { label: "Profile", href: "/dashboard/profile" },
    { label: "payslip", href: '/dashboard/salary' },
    { label: 'Leaves', href: '/dashboard/leaves', },
    { label: "Holidays", href: '/dashboard/holiday' },
    { label: 'Update Request', href: '/dashboard/updaterequest', },
    { label: 'Timesheet', href: '/dashboard/TimeSheetRegister', },
    { label: "Settings", href: "/dashboard/settings" },
  ],
  HR_COMMON: [
    { label: "Employees", href: "/admin-dashboard/employees" },
    { label: "Clients", href: "/admin-dashboard/clients" },
    // { label: "Organization", href: "/admin-dashboard/organization" },
    { label: "Leave Calendar", href: "/admin-dashboard/leaveCalendar" },
    { label: "Employee Leaves", href: "/admin-dashboard/leaves" },
    { label: "Add Holiday", href: "/admin-dashboard/holiday" },
  ],
  
  
  SUPER_HR: [
    { label: "Dashboard", href: "/dashboard"},
    { permission: "ADD_HOLIDAY", label: "Add Holiday", href: "/superhr/addHoliday",},
    { label: "View Holidays", href: "/superhr/viewHolidays",},
    { label: 'Leaves', href: '/superhr/leaves', },
    { permission: "SUBMIT_TIMESHEET", label: "Timesheet", href: "/manager/SHR-Timesheet",},
  ],


  MANAGER: [
    { permission: "MANAGE_TEAM", label: "Team", href: '/manager/employees' },
    { permission: "APPROVE_LEAVE", label: "Approve Leave", href: '/manager/leaves' },
    { permission: "MANAGE_TIMESHEET", label: "Review Timesheets", href: '/manager/timesheets' },
    { permission: "LEAVE_CALENDAR", label: "Leave Calendar", href: '/manager/leaveCalendar' },
  ],

  // HR: [
  //   { permission: "VIEW_EMP_DASHBOARD", label: "Employee Records", href: "/hr/employees" },
  //   { permission: "VIEW_PAYROLL", label: "Payroll", href: "/hr/payroll" },
  //   { permission: "VIEW_INVOICE", label: "Invoices", href: "/hr/invoices" },
  //   { permission: "LEAVE_CALENDAR", label: "Leave Calendar", href: '/hr/leaveCalendar' },
  // ],

  FINANCE: [
    { permission: "VIEW_PAYROLL", label: "Payroll", href: "/finance/payroll" },
    { permission: "MANAGE_PAYROLL", label: "Manage Payroll", href: "/finance/payroll/manage" },
    { permission: "VIEW_INVOICE", label: "Invoices", href: "/finance/invoices" },
    { permission: "GENERATE_INVOICE", label: "Generate Invoice", href: "/finance/invoices/create" },
  ],
};
