'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Clock,
  User,
  Settings,
  Gift,
  FileCheck,
  Bell,
  Users,
} from 'lucide-react';
import Image from 'next/image';

const navSections = [
  {
    title: 'Main',
    items: [
      { href: '/manager', label: 'Dashboard', icon: <Home size={18} /> },
      { href: '/manager/timesheets', label: 'Timesheet', icon: <Clock size={18} /> },
      { href: '/manager/employees', label: 'Employees', icon: <Users size={18} /> },
      { href: '/manager/leaves', label: 'Leaves', icon: <FileCheck size={18} /> },
      { href: '/manager/holiday', label: 'Holidays', icon: <Gift size={18} /> },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/manager/profile', label: 'Profile', icon: <User size={18} /> },
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
        <div className="flex items-center justify-center space-x-4 mb-8">
          <Image
            src="/digiquad logo.jpeg"
            alt="DigiQuad Logo"
            width={50}
            height={50}
            className="rounded-full shadow-sm"
          />
          <div className="text-2xl font-bold text-indigo-600">DigiQuad</div>
        </div>
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
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-150 ${isActive
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
    </aside>
  );
}
