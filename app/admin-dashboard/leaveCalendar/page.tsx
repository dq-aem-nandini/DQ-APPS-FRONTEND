'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';

import { LeaveCalendarDTO } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LeaveCalendarService } from '@/lib/api/leaveCalendarService';
import { holidayService } from '@/lib/api/holidayService';
import { HolidaysDTO } from '@/lib/api/types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function LeaveCalendarPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState<LeaveCalendarDTO[]>([]);
  const [selectedDay, setSelectedDay] = useState<LeaveCalendarDTO | null>(null);
  const [exporting, setExporting] = useState(false);
  const [holidays, setHolidays] = useState<HolidaysDTO[]>([]);


  // -------------------------------
  // Fetch calendar data
  // -------------------------------
  useEffect(() => {
    LeaveCalendarService
      .getLeaveCalendar(month, year)
      .then(setData)
      .catch(console.error);
  }, [month, year]);

  // -------------------------------
  // Fetch all holidays
  // -------------------------------

  useEffect(() => {
    holidayService.getAllHolidays()
      .then(res => {
        if (res.flag && res.response) {
          setHolidays(res.response);
        }
      })
      .catch(console.error);
  }, []);
  

  // -------------------------------
  // Map data by date
  // -------------------------------
  const leaveMap = useMemo(() => {
    const map: Record<string, LeaveCalendarDTO> = {};
    data.forEach(d => (map[d.date] = d));
    return map;
  }, [data]);

  const holidayMap = useMemo(() => {
    const map: Record<string, HolidaysDTO> = {};
    holidays.forEach(h => {
      map[h.holidayDate] = h;
    });
    return map;
  }, [holidays]);
  

  // -------------------------------
  // Calendar grid dates
  // -------------------------------
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = gridStart;
  while (day <= gridEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // -------------------------------
  // Navigation
  // -------------------------------
  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  // -------------------------------
  // Export handler
  // -------------------------------
  const handleExport = async () => {
    try {
      setExporting(true);
  
      const result =
        await LeaveCalendarService.exportLeaveCalendar(month, year);
  
      // CASE 1: backend returns a URL
      if (typeof result === "string" && result.startsWith("http")) {
        window.open(result, "_blank");
        return;
      }
  
      // CASE 2: backend returns CSV / text
      const blob = new Blob([result], {
        type: "text/csv;charset=utf-8;",
      });
  
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Leave_Calendar_${MONTHS[month - 1]}_${year}.csv`;
      document.body.appendChild(link);
      link.click();
  
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export error:", err);
      alert(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };
  
  

  return (
    <div className="space-y-6">
      {/* ================= Header ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-9 h-9 text-indigo-600" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Leave Calendar
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ChevronLeft className="cursor-pointer" onClick={prevMonth} />

          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="border rounded px-3 py-1 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border rounded px-3 py-1 text-sm"
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const y = today.getFullYear() - 2 + i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>

          <ChevronRight className="cursor-pointer" onClick={nextMonth} />

          {/* ===== Export ===== */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="
              ml-2 flex items-center gap-1
              px-3 py-1.5 rounded-md
              bg-indigo-600 text-white text-sm
              hover:bg-indigo-700 disabled:opacity-60
            "
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* ================= Calendar ================= */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-7 text-center font-semibold mb-3 text-sm">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const leaveDay = leaveMap[dateStr];
            const holiday = holidayMap[dateStr];
            const employees = leaveDay?.employees || [];

            const approved = employees.filter(e => e.status === 'APPROVED');
            const pending = employees.filter(e => e.status === 'PENDING');

            const fullDay = employees.filter(e => e.leaveType === 'FULL_DAY');
            const halfDay = employees.filter(e => e.leaveType === 'HALF_DAY');

            return (
              <div
                key={i}
                onClick={() => employees.length && setSelectedDay(leaveDay)}
                className={`
                  min-h-[100px] p-2 border rounded-md relative flex flex-col
                  ${!isSameMonth(d, monthStart) ? 'bg-gray-50 text-gray-400' : ''}
                  ${employees.length ? 'cursor-pointer hover:bg-indigo-50' : ''}
                  ${isSameDay(d, today) ? 'border-indigo-500' : ''}
                `}
              >
                {/* Date */}
                <div className="text-sm font-medium">
                  {format(d, 'd')}
                </div>

                {/* Holiday */}
                  {holiday && (
                    <div className="mt-1">
                      <span className="bg-red-200 text-red-800 text-[10px] px-2 py-0.5 rounded-full">
                        HOLIDAY
                      </span>
                      <div className="text-[11px] text-red-700 font-medium truncate">
                        {holiday.holidayName}
                      </div>
                    </div>
                  )}


                {/* Badges */}
                {employees.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {fullDay.length > 0 && (
                      <span className="bg-green-200 text-green-700 text-[9px] sm:text-[11px] px-2 py-0.5 rounded-full">
                        {fullDay.length} FULL
                      </span>
                    )}
                    {halfDay.length > 0 && (
                      <span className="bg-violet-200 text-violet-800 text-[9px] sm:text-[11px] px-2 py-0.5 rounded-full">
                        {halfDay.length} HALF
                      </span>
                    )}
                    {pending.length > 0 && (
                      <span className="bg-yellow-200 text-yellow-800 text-[9px] sm:text-[11px] px-2 py-0.5 rounded-full">
                        {pending.length} PENDING
                      </span>
                    )}
                  </div>
                )}

                {/* Names */}
                <div className="mt-1 text-indigo-800 text-xs space-y-0.5 max-h-24 overflow-y-auto">
                  {employees.slice(0, 3).map(emp => (
                    <div key={emp.employeeId} className={`truncate ${emp.status === 'PENDING' ? 'text-gray-400 italic' : ''}`}>
                      • {emp.employeeName} {emp.status === 'PENDING' && `(${emp.status})`}
                    </div>
                  ))}
                  {employees.length > 3 && (
                    <div className="text-gray-500 italic">
                      + {employees.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ================= Dialog ================= */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Leaves on {selectedDay?.date}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {selectedDay?.employees.map((emp, index) => {
              const isFullDay = emp.leaveType === 'FULL_DAY';
              const isPending = emp.status === 'PENDING';
              return (
                <div
                  key={`${emp.employeeId}-${index}`}
                  className={`
                    flex justify-between items-center p-3 rounded
                    ${isPending ? 'bg-yellow-100' : isFullDay ? 'bg-indigo-100' : 'bg-red-100'}
                  `}
                >
                  <span className="text-xs text-gray-600 ml-2">
                    ({emp.status})
                  </span>

                  <span className="font-medium text-gray-800">
                    {emp.employeeName}
                  </span>
                  <span
                    className={`
                      text-sm font-semibold
                      ${isFullDay ? 'text-indigo-700' : 'text-red-600'}
                    `}
                  >
                    {isFullDay ? 'Full Day' : 'Half Day'}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
