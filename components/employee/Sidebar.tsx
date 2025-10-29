//components/employee/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Clock,
  FileText,
  User,
  MessageSquare,
  Settings,
  LogOut,
  Briefcase,
  Calendar,
  Gift,
  FileCheck,
  Bell,
  Users,
} from 'lucide-react';

const navSections = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: <Home size={18} /> },
      { href: '/dashboard/TimeSheetRegister', label: 'Timesheet', icon: <Clock size={18} /> },
      { href: '/dashboard/projects', label: 'Projects', icon: <Briefcase size={18} /> },
    ],
  },
  {
    title: 'HR & Leaves',
    items: [
      { href: '/dashboard/leaves', label: 'Leaves', icon: <FileCheck size={18} /> },
      { href: '/dashboard/holiday', label: 'Holidays', icon: <Gift size={18} /> },
      { href: '/dashboard/calendar', label: 'Calendar', icon: <Calendar size={18} /> },
      { href: '/dashboard/payroll', label: 'Payroll', icon: <FileText size={18} /> },
      { href: '/dashboard/team', label: 'Team', icon: <Users size={18} /> },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/dashboard/profile', label: 'Profile', icon: <User size={18} /> },
      { href: '/dashboard/support', label: 'Support', icon: <MessageSquare size={18} /> },
      { href: '/dashboard/notifications', label: 'Notifications', icon: <Bell size={18} /> },
      { href: '/dashboard/settings', label: 'Settings', icon: <Settings size={18} /> },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

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
          <LogOut size={18} />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
