// /components/Sidebar.tsx
'use client';

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { sidebarConfig } from "./sidebar.config";
import React from "react";

// VALID Lucide Icons only
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

// icon mapping
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
};

const sidebarRoles = ["MANAGER", "HR", "FINANCE"] as const;
type SidebarRole = typeof sidebarRoles[number];

const isSidebarRole = (r: string): r is SidebarRole =>
  (sidebarRoles as readonly string[]).includes(r);

export default function Sidebar() {
  const { state } = useAuth();
  const pathname = usePathname();

  const user = state.user;
  if (!user) return null;

  const role = user.role.roleName;
  const permissions = user.role.permissions;

  const getIcon = (label: string) => ICON_MAP[label] ?? <Home size={18} />;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-5 shadow-sm flex flex-col justify-between">
      
      {/* Logo */}
      <div>
        <div className="flex items-center justify-center space-x-4 mb-8">
          <Image
            src="/digiquad logo.jpeg"
            alt="DigiQuad Logo"
            width={50}
            height={50}
            style={{ width: 'auto', height: 'auto' }}
            className="rounded-full shadow-sm"
          />
          <div className="text-2xl font-bold text-indigo-600">DigiQuad</div>
        </div>

        {/* COMMON SECTION */}
        <SidebarSection title="Main">
          {sidebarConfig.common.map(item => {
            const isActive = pathname === item.href;
            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                active={isActive}
                icon={getIcon(item.label)}
              >
                {item.label}
              </SidebarLink>
            );
          })}
        </SidebarSection>

        {/* ROLE-SPECIFIC SECTION */}
        {isSidebarRole(role) && (
          <SidebarSection title={role.replace("_", " ")}>
            {sidebarConfig[role]
              .filter(item => permissions.includes(item.permission))
              .map(item => {
                const isActive = pathname === item.href;
                return (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    active={isActive}
                    icon={getIcon(item.label)}
                  >
                    {item.label}
                  </SidebarLink>
                );
              })}
          </SidebarSection>
        )}
      </div>

    </aside>
  );
}

function SidebarSection({ title, children }: any) {
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
