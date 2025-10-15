// components/admin/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  UserIcon,
  BuildingOfficeIcon,
  PlusIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  CogIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { Search } from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const menuItems = [
    {
      href: "/admin-dashboard",
      label: "Dashboard",
      icon: HomeIcon,
      match: /^\/admin-dashboard$/,
    },
    {
      href: "/admin-dashboard/employees",
      label: "Employees",
      icon: UserIcon,
      match: /^\/admin-dashboard\/employees/,
    },

    {
      href: "/admin-dashboard/clients",
      label: "Clients",
      icon: BuildingOfficeIcon,
      match: /^\/admin-dashboard\/clients/,
    },

    {
      href: "/admin-dashboard/profile",
      label: "Profile",
      icon: UserIcon,
      match: /^\/admin-dashboard\/profile/,
    },
    {
      href: "/admin-dashboard/apply-leave",
      label: "Apply Leave",
      icon: CalendarIcon,
      match: /^\/admin-dashboard\/apply-leave/,
    },
    {
      href: "/admin-dashboard/apply-special-requests",
      label: "Special Requests",
      icon: DocumentTextIcon,
      match: /^\/admin-dashboard\/apply-special/,
    },
    {
      href: "/admin-dashboard/apply-overtime",
      label: "Overtime",
      icon: ClockIcon,
      match: /^\/admin-dashboard\/apply-overtime/,
    },
    {
      href: "/admin-dashboard/settings",
      label: "Settings",
      icon: CogIcon,
      match: /^\/admin-dashboard\/settings/,
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isActive = (item: any) => {
    if (typeof item.match === "string") {
      return pathname === item.match;
    }
    return item.match.test(pathname);
  };

  return (
    // <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-5 shadow-sm">
      <div className="text-2xl font-bold text-indigo-600 mb-8 text-center">DigiQuad</div>
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive(item)
                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
