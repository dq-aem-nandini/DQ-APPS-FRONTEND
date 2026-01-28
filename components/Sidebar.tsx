'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sidebarConfig } from "./sidebar.config";

// TYPES
export type Role =
  | "ADMIN"
  | "EMPLOYEE"
  | "MANAGER"
  | "HR"
  | "FINANCE";

interface SidebarItem {
  label: string;
  href: string;
  permission?: string;
}

// ICONS
import {
  Home,
  User,
  Settings,
  Gift,
  FileText,
  FileCheck,
  Clock,
  Bell,
  Users,
  CheckCircle,
  ClipboardList,
  BarChart2,
  Receipt,
  CalendarDays,
} from "lucide-react";

// ICON MAP
const ICON_MAP: Record<string, React.ReactNode> = {
  Dashboard: <Home size={18} />,
  Profile: <User size={18} />,
  Settings: <Settings size={18} />,
  payslip: <FileText size={18} />,
  Holidays: <Gift size={18} />,
  Leaves: <FileCheck size={18} />,
  Timesheet: <Clock size={18} />,
  Notifications: <Bell size={18} />,
  Team: <Users size={18} />,
  "Approve Leave": <CheckCircle size={18} />,
  "Review Timesheets": <ClipboardList size={18} />,
  "Leave Calendar": <CalendarDays size={18} />,
  Payroll: <BarChart2 size={18} />,
  Invoices: <Receipt size={18} />,
  Employees: <Users size={18} />,
  Clients: <Users size={18} />,
  Organization: <Users size={18} />,
};

// TYPE GUARD – only roles that exist in sidebarConfig
type SidebarRole = "MANAGER" | "FINANCE";

const isSidebarRole = (role: Role): role is SidebarRole =>
  role === "MANAGER" || role === "FINANCE";

export default function Sidebar() {
  const { state } = useAuth();
  const pathname = usePathname();

  const user = state.user;
  if (!user) return null;

  const role = user.role.roleName as Role;
  const permissions: string[] = user.role.permissions ?? [];

  const getIcon = (label: string) =>
    ICON_MAP[label] ?? <Home size={18} />;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">

        {/* LOGO */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <Image
            src="/digiquad logo.jpeg"
            alt="DigiQuad Logo"
            width={50}
            height={50}
            className="rounded-full shadow-sm"
          />
          <div className="text-2xl font-bold text-indigo-600">
            DigiQuad
          </div>
        </div>

        {/* 🔹 COMMON (ALL ROLES) */}
        <SidebarSection title="Main">
          {sidebarConfig.common.map((item: SidebarItem) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              active={pathname === item.href}
              icon={getIcon(item.label)}
            >
              {item.label}
            </SidebarLink>
          ))}
        </SidebarSection>

        {/* 🔥 HR ADMIN LINKS (NO PERMISSION CHECK) */}
        {role === "HR" && sidebarConfig.HR_COMMON && (
          <SidebarSection title="Admin Access">
            {sidebarConfig.HR_COMMON.map((item: SidebarItem) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                active={pathname === item.href}
                icon={getIcon(item.label)}
              >
                {item.label}
              </SidebarLink>
            ))}
          </SidebarSection>
        )}

        {/* 🔹 ROLE-SPECIFIC (PERMISSION BASED) */}
{isSidebarRole(role) && (
  <SidebarSection title={role}>
    {sidebarConfig[role]
      .filter(
        (item: SidebarItem) =>
          !item.permission ||
          permissions.includes(item.permission)
      )
      .map((item: SidebarItem) => (
        <SidebarLink
          key={item.href}
          href={item.href}
          active={pathname === item.href}
          icon={getIcon(item.label)}
        >
          {item.label}
        </SidebarLink>
      ))}
  </SidebarSection>
)}


      </div>
    </aside>
  );
}

/* ---------------- SUB COMPONENTS ---------------- */

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs uppercase text-gray-500 font-semibold mb-2 px-3">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarLink({
  href,
  children,
  active,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-150 ${
        active
          ? "bg-indigo-100 text-indigo-700 font-medium"
          : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
