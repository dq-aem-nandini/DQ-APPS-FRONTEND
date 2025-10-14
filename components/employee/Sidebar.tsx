// components/employee/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, FileText, User, MessageSquare } from 'lucide-react';

const navItems = [
  { href: '/employee-dashboard', label: 'Dashboard', icon: <Home size={18} /> },
  { href: '/employee-dashboard/timesheet', label: 'Timesheet', icon: <Clock size={18} /> },
  { href: '/employee-dashboard/projects', label: 'Projects', icon: <FileText size={18} /> },
  { href: '/employee-dashboard/profile', label: 'Profile', icon: <User size={18} /> },
  { href: '/employee-dashboard/support', label: 'Support', icon: <MessageSquare size={18} /> },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-5 shadow-sm">
      <div className="text-2xl font-bold text-indigo-600 mb-8 text-center">DigiQuad</div>
      <nav className="space-y-2">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 ${
              pathname === href ? 'bg-indigo-100 text-indigo-700 font-medium' : ''
            }`}
          >
            {icon}
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
