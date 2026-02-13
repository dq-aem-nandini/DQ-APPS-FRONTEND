'use client';
 
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { employeeService } from '@/lib/api/employeeService';
import { holidayService } from '@/lib/api/holidayService';
import type { EmployeeDTO, HolidaysDTO } from '@/lib/api/types';
import type { AttendanceStatusDTO } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import { employeePunchService } from '@/lib/api/EmployeePunchService';

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [upcomingHolidays, setUpcomingHolidays] = useState<HolidaysDTO[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatusDTO | null>(null);
  const [punchLoading, setPunchLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  const handlePunch = async () => {
    try {
      setPunchLoading(true);
  
      const res = await employeePunchService.punch();
  
      if (res.flag) {
        Swal.fire({
          icon: 'success',
          title: res.response ?? 'Success', // "Punched IN" / "Punched OUT"
          timer: 1500,
          showConfirmButton: false
        });
  
        // Refresh status
        if (employee?.employeeId) {
          const statusRes = await employeePunchService.getPunchStatus(employee.employeeId);
          if (statusRes.flag) {
            setAttendanceStatus(statusRes.response);
          }
        }
      }
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setPunchLoading(false);
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, holidaysRes] = await Promise.all([
          employeeService.getEmployeeById(),
          holidayService.getAllHolidays(),
        ]);

        if (empRes?.employeeId) {
          const statusRes = await employeePunchService.getPunchStatus(empRes.employeeId);
        
          if (statusRes.flag) {
            setAttendanceStatus(statusRes.response);
          }
        }        

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
      <div className="max-w-6xl mx-auto">

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
        
        {/* Clock In / Clock Out Section */}
        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

        {/* LEFT SIDE – Clock Card (2 columns wide) */}
        <div className="lg:col-span-2">
        <Card className="h-full border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl">
          <CardContent className="p-10">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

              {/* LEFT SIDE – Time + Date + Status */}
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {format(new Date(), 'hh:mm a')}
                </div>

                <div className="text-gray-500 mb-6">
                  {format(new Date(), 'EEEE, dd MMMM yyyy')}
                </div>

                <span
                  className={`inline-block px-6 py-2 text-sm font-semibold rounded-full tracking-wide ${
                    attendanceStatus?.nextAction === "OUT"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {attendanceStatus?.nextAction === "OUT"
                    ? "Currently Clocked In"
                    : "Currently Clocked Out"}
                </span>
              </div>

              {/* RIGHT SIDE – Punch Button */}
              <div className="flex justify-center md:justify-end">
                <Button
                  onClick={handlePunch}
                  disabled={punchLoading || !attendanceStatus}
                  className={`w-full md:w-64 py-7 text-xl font-semibold rounded-2xl transition-all duration-300 shadow-lg ${
                    attendanceStatus?.nextAction === "OUT"
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:scale-105"
                      : "bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-105"
                  }`}
                >
                  {punchLoading
                    ? "Processing..."
                    : attendanceStatus?.nextAction === "OUT"
                    ? "Clock Out"
                    : "Clock In"}
                </Button>
              </div>

            </div>

            {/* Punch Details */}
            {(attendanceStatus?.firstClockIn || attendanceStatus?.lastClockOut) && (
              <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-gray-600">
                {attendanceStatus?.firstClockIn && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="font-medium text-gray-800">First Clock In</p>
                    <p>
                      {format(new Date(attendanceStatus.firstClockIn), 'hh:mm a')}
                    </p>
                  </div>
                )}

                {attendanceStatus?.lastClockOut && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="font-medium text-gray-800">Last Clock Out</p>
                    <p>
                      {format(new Date(attendanceStatus.lastClockOut), 'hh:mm a')}
                    </p>
                  </div>
                )}
              </div>
            )}

          </CardContent>
        </Card>

        </div>

        {/* RIGHT SIDE – Stats Cards stacked */}
        <div className="flex flex-col gap-6">

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Clock className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
              <p className="text-gray-600 text-base font-medium">Available Leaves</p>
              <p className="text-4xl font-bold text-indigo-600 mt-2">
                {availableLeaves}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Calendar className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <p className="text-gray-600 text-base font-medium">Upcoming Holidays</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">
                {upcomingHolidays.length}
              </p>
            </CardContent>
          </Card>

        </div>
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