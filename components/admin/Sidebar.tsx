'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  PlusIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { FileTextIcon, LogOut } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navSections = [
    {
      title: 'Main',
      items: [
        { href: '/admin-dashboard', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
        { href: '/admin-dashboard/employees', label: 'Employees', icon: <UserIcon className="h-5 w-5" /> },
        { href: '/admin-dashboard/clients', label: 'Clients', icon: <BuildingOfficeIcon className="h-5 w-5" /> },
        { href: '/admin-dashboard/salaries', label: 'Salaries', icon: <UserIcon className="h-5 w-5" /> },
      ],
    },
    {
      title: 'Operations',
      items: [
        { href: '/admin-dashboard/leaves', label: 'Leaves', icon: <CalendarIcon className="h-5 w-5" /> },
        { href: '/admin-dashboard/holiday', label: 'Holiday', icon: <PlusIcon className="h-5 w-5" /> },
        { href: '/admin-dashboard/invoice', label: 'Invoices', icon: <FileTextIcon className="h-5 w-5" /> },
      ],
    },
    {
      title: 'Account',
      items: [
        { href: '/admin-dashboard/profile', label: 'Profile', icon: <UserIcon className="h-5 w-5" /> },
        { href: '/admin-dashboard/settings', label: 'Settings', icon: <CogIcon className="h-5 w-5" /> },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-5 shadow-sm flex flex-col justify-between">
      {/* Logo */}
      <div>
        <div className="text-2xl font-bold text-indigo-600 mb-8 text-center">DigiQuad</div>

        {/* Navigation Sections */}
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2 px-3">
              {section.title}
            </h4>
            <nav className="space-y-1">
              {section.items.map(({ href, label, icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {icon}
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div className="border-t border-gray-100 pt-4">
        <Link
          href="/logout"
          className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-150"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
