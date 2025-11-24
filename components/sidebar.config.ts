// /components/sidebar.config.tsx

export const sidebarConfig = {
    common: [
      { label: "Dashboard", href: "/dashboard", },
      { label: "Profile", href: "/dashboard/profile" },
      { label: "payslip", href: '/dashboard/salary' },
      { label: 'Leaves',href: '/dashboard/leaves', },
      { label: "Holidays", href: '/dashboard/holiday' },
      { label: 'Update Request',  href: '/dashboard/updaterequest', },
      { label: 'Timesheet',href: '/dashboard/TimeSheetRegister',},
      { label: "Settings", href: "/dashboard/settings" },
      { label: 'Notifications',href: '/dashboard/notifications', },
    ],
  
    EMPLOYEE: [
      { permission: "VIEW_TIMESHEET", label: "Timesheet", href: '/dashboard/TimeSheetRegister' },
    ],
  
    MANAGER: [
      { permission: "MANAGE_TEAM", label: "Team", href: '/manager/employees' },
      { permission: "APPROVE_LEAVE", label: "Approve Leave", href: '/manager/leaves' },
      { permission: "MANAGE_TIMESHEET", label: "Review Timesheets", href: '/manager/timesheets' },
    ],
  
    HR: [
      { permission: "VIEW_EMP_DASHBOARD", label: "Employee Records", href: "/hr/employees" },
      { permission: "VIEW_PAYROLL", label: "Payroll", href: "/hr/payroll" },
      { permission: "VIEW_INVOICE", label: "Invoices", href: "/hr/invoices" },
    ],
  
    FINANCE: [
      { permission: "VIEW_PAYROLL", label: "Payroll", href: "/finance/payroll" },
      { permission: "MANAGE_PAYROLL", label: "Manage Payroll", href: "/finance/payroll/manage" },
      { permission: "VIEW_INVOICE", label: "Invoices", href: "/finance/invoices" },
      { permission: "GENERATE_INVOICE", label: "Generate Invoice", href: "/finance/invoices/create" },
    ],
  };
  