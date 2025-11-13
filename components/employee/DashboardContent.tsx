'use client';

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { motion } from 'framer-motion'; // Assuming framer-motion is installed for animations

import { employeeService } from '@/lib/api/employeeService';
import { holidaysService } from '@/lib/api/holidayService';
import { EmployeeDTO, HolidayCalendarDTO } from '@/lib/api/types';
import Spinner from '../ui/Spinner';

interface DashboardStats {
  upcomingHolidays: number;
  availableLeaves: number;
}

export default function DashboardContent() {
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [holidays, setHolidays] = useState<HolidayCalendarDTO[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    upcomingHolidays: 0,
    availableLeaves: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch employee details
        const empData = await employeeService.getEmployeeById();
        setEmployee(empData);

        // Fetch holidays
        const holidayResponse = await holidaysService.getAllCalendars();
        const allHolidays = holidayResponse.response || [];
        setHolidays(allHolidays);

        // Filter upcoming holidays (next 30 days)
        const upcoming = allHolidays.filter((h: HolidayCalendarDTO) =>
          dayjs(h.holidayDate).isAfter(dayjs(), 'day') && dayjs(h.holidayDate).isBefore(dayjs().add(30, 'day'))
        ).length;

        setStats({
          upcomingHolidays: upcoming,
          availableLeaves: empData.availableLeaves || 0,
        });
      } catch (err: any) {
        console.error('❌ Error fetching dashboard data:', err);
        const backendMessage =
          err?.response?.data?.message || err?.message ||'';                           
        setError(backendMessage);
      }finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Spinner />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center p-8">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-600 mb-4"
          >
            {error}
          </motion.p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
          >
            Retry
          </motion.button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10"
      >
        {/* Welcome Header */}
        {employee && (
          <motion.div variants={itemVariants} className="mb-8 text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
            >
              Welcome back, {employee.firstName} {employee.lastName}!
            </motion.h1>
          </motion.div>
        )}

        {/* Overview Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8"
        >
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white/80 backdrop-blur-sm p-6 lg:p-8 rounded-3xl shadow-xl border border-white/20 flex items-center space-x-6 group"
          >
            <div className="p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg group-hover:shadow-green-500/25 transition-shadow">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide group-hover:text-green-600 transition-colors">Upcoming Holidays</p>
              <p className="text-4xl lg:text-4xl font-bold text-gray-900 mt-1">{stats.upcomingHolidays}</p>
              <p className="text-sm text-green-600 font-medium mt-1">Relax and recharge</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white/80 backdrop-blur-sm p-6 lg:p-8 rounded-3xl shadow-xl border border-white/20 flex items-center space-x-6 group"
          >
            <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl shadow-lg group-hover:shadow-blue-500/25 transition-shadow">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide group-hover:text-blue-600 transition-colors">Available Leaves</p>
              <p className="text-4xl lg:text-4xl font-bold text-gray-900 mt-1">{stats.availableLeaves}</p>
              <p className="text-sm text-blue-600 font-medium mt-1">Days to unwind</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Upcoming Holidays + Quick Actions */}
          <div className="space-y-6">
            {/* Upcoming Holidays */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 lg:p-8">
                <motion.h2
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="text-2xl lg:text-3xl font-bold mb-6 flex items-center text-gray-900"
                >
                  <svg className="w-7 h-7 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Upcoming Holidays
                </motion.h2>
                {holidays.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <svg className="mx-auto h-20 w-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 text-xl font-medium">No upcoming holidays yet. More fun ahead!</p>
                  </motion.div>
                ) : (
                  <ul className="space-y-4">
                    {holidays
                      .filter((h: HolidayCalendarDTO) =>
                        dayjs(h.holidayDate).isAfter(dayjs(), 'day') && dayjs(h.holidayDate).isBefore(dayjs().add(30, 'day'))
                      )
                      .slice(0, 5)
                      .map((holiday: HolidayCalendarDTO, index: number) => (
                        <motion.li
                          key={holiday.holidayCalendarId}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex justify-between items-center p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl hover:from-indigo-100 hover:to-purple-100 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-4 group-hover:scale-125 transition-transform"></div>
                            <span className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{holiday.holidayName}</span>
                          </div>
                          <span className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full shadow-sm">
                            {dayjs(holiday.holidayDate).format('MMM DD')}
                          </span>
                        </motion.li>
                      ))}
                  </ul>
                )}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="mt-6 pt-6 border-t border-gray-200"
                >
                  <a href="/dashboard/holiday" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-bold text-lg transition-all">
                    View Full Calendar
                    <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </motion.div>
              </div>
            </motion.div>

            {/* Quick Actions below Holidays */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {[
                { label: 'Apply for Leave', icon: '🌴', href: '/dashboard/leaves/applyleave', color: 'from-green-500 to-emerald-600' },
                { label: 'Update Profile', icon: '👤', href: '/dashboard/profile', color: 'from-blue-500 to-cyan-600' },
              ].map((action, index) => (
                <motion.a
                  key={action.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  href={action.href}
                  className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all flex flex-col items-center justify-center text-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <motion.span
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    className={`text-6xl mb-4 ${action.color} bg-gradient-to-r bg-clip-text text-transparent z-10`}
                  >
                    {action.icon}
                  </motion.span>
                  <span className="text-xl font-bold text-gray-900 mb-2 z-10 relative">{action.label}</span>
                  <span className="text-sm text-gray-500 z-10 relative">Ready to dive in?</span>
                </motion.a>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Profile Snapshot */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 lg:p-8 h-full">
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-2xl lg:text-3xl font-bold mb-6 text-gray-900"
              >
                Your Profile Glow-Up
              </motion.h2>
              {employee ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-4 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl">
                    {employee.employeePhotoUrl ? (
                      <img
                        src={employee.employeePhotoUrl}
                        alt={`${employee.firstName} ${employee.lastName}`}
                        className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-white">{employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-semibold text-gray-900">{employee.firstName} {employee.lastName}</p>
                      <p className="text-sm text-gray-600 truncate">{employee.companyEmail}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl"
                    >
                      <p className="text-xl font-semibold text-gray-900">{employee.designation || '—'}</p>
                      <p className="text-sm text-gray-600">Designation</p>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl"
                    >
                      <p className="text-xl font-semibold text-gray-900">{employee.employmentType || '—'}</p>
                      <p className="text-sm text-gray-600">Employment Type</p>
                    </motion.div>
                    {employee.clientName && (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="col-span-2 text-center p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl"
                      >
                        <p className="text-xl font-semibold text-gray-900">{employee.clientName}</p>
                        <p className="text-sm text-gray-600">Client Partner</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-gray-500 text-xl font-medium">Profile details loading... Stay tuned!</p>
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <a href="/dashboard/profile" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold text-lg transition-all">
                  Update Profile
                  <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}