'use client';
 
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { employeeService } from '@/lib/api/employeeService';
import { holidayService } from '@/lib/api/holidayService';
import type { EmployeeDTO, HolidaysDTO } from '@/lib/api/types';
export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [upcomingHolidays, setUpcomingHolidays] = useState<HolidaysDTO[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, holidaysRes] = await Promise.all([
          employeeService.getEmployeeById(),
          holidayService.getAllHolidays(),
        ]);

        setEmployee(empRes);

        if (holidaysRes.flag && Array.isArray(holidaysRes.response)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const upcoming = holidaysRes.response
            .filter(h => {
              if (!h.holidayDate) return false;
              const hDate = new Date(h.holidayDate);
              hDate.setHours(0, 0, 0, 0);
              return hDate > today; // Only future holidays
            })
            .sort((a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime())
            .slice(0, 5);
          setUpcomingHolidays(upcoming);
        }
      } catch (err) {
        console.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const availableLeaves = employee?.availableLeaves || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-0 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Responsive & Beautiful Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
            <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome back,  {employee ? `${employee.firstName} ${employee.lastName}` : 'Employee'}!
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 font-medium">
            Here’s your quick overview for today
          </p>
        </div>
        {/* Compact Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Clock className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
              <p className="text-gray-600 text-base font-medium">Available Leaves</p>
              <p className="text-5xl font-bold text-indigo-600 mt-2">{availableLeaves}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Calendar className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <p className="text-gray-600 text-base font-medium">Upcoming Holidays</p>
              <p className="text-5xl font-bold text-purple-600 mt-2">{upcomingHolidays.length}</p>
            </CardContent>
          </Card>
        </div>
        {/* Upcoming Holidays List */}
        {upcomingHolidays.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Upcoming Holidays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingHolidays.map(holiday => (
                  <div
                    key={holiday.holidayId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-lg">{holiday.holidayName}</p>
                      <p className="text-sm text-gray-600">
                        {holiday.holidayDate ? format(new Date(holiday.holidayDate), 'EEEE, d MMMM yyyy') : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-800">
                        {holiday.holidayDate ? format(new Date(holiday.holidayDate), 'dd') : '--'}
                      </div>
                      <div className="text-lg text-gray-600">
                        {holiday.holidayDate ? format(new Date(holiday.holidayDate), 'MMM') : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p>
            Have a great day at work!
          </p>
        </div>
      </div>
    </div>
  );
}