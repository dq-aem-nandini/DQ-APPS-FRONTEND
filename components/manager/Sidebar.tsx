'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Users, Clock, Calendar, BarChart2 } from 'lucide-react';
import Image from 'next/image';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/manager', icon: Home },
    { name: 'Employees', path: '/manager/employees', icon: Users },
    { name: 'Timesheets', path: '/manager/timesheets', icon: Clock },
    { name: 'Leaves', path: '/manager/leaves', icon: Calendar },
    { name: 'Reports', path: '/manager/reports', icon: BarChart2 },
    { name: 'Holidays', path: '/manager/holiday', icon: Calendar },
  ];

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-20 p-2 bg-indigo-600 text-white rounded-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <aside
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static w-64 bg-white shadow-sm border-r border-gray-200 h-full lg:h-auto transition-transform duration-300 z-10`}
      >
        <div className="p-6">
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
          <nav>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      pathname === item.path
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;