"use client";

import React, { useEffect, useState } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,   
  endOfMonth,
  isAfter 
} from "date-fns";
import { employeePunchService } from "@/lib/api/EmployeePunchService";
import { employeeService } from "@/lib/api/employeeService";
import { holidayService } from '@/lib/api/holidayService';
function AttendancePage() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [holidays, setHolidays] = useState<any[]>([]);
  const weekStart = currentWeekStart;
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const systemWeekStart = startOfWeek(new Date(), {
    weekStartsOn: 1,
  });
  const nextWeekStart = addWeeks(currentWeekStart, 1);
  const isNextDisabled = isAfter(nextWeekStart, systemWeekStart);
  // =========================
  // Fetch Employee First
  // =========================
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const empRes = await employeeService.getEmployeeById();

        if (empRes?.employeeId) {
          setEmployeeId(empRes.employeeId);
        }
      } catch (error) {
        console.error("Failed to fetch employee");
      }
    };

    fetchEmployee();
  }, []);


  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await holidayService.getAllHolidays();
  
        if (res.flag && Array.isArray(res.response)) {
          setHolidays(res.response);
        }
      } catch (error) {
        console.error("Failed to fetch holidays");
      }
    };
  
    fetchHolidays();
  }, []);
  

  // =========================
  //  Fetch Attendance when employeeId OR week changes
  // =========================
  useEffect(() => {
    if (!employeeId) return;

    fetchAttendance();
  }, [employeeId, currentWeekStart, viewMode]);

  async function fetchAttendance() {
    try {
      setLoading(true);
  
      let fromDate;
      let toDate;
  
      if (viewMode === "week") {
        fromDate = format(weekStart, "yyyy-MM-dd");
        toDate = format(weekEnd, "yyyy-MM-dd");
      } else {
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());
  
        fromDate = format(monthStart, "yyyy-MM-dd");
        toDate = format(monthEnd, "yyyy-MM-dd");
      }
  
      const res = await employeePunchService.getMonthlyAttendance(
        employeeId!,
        fromDate,
        toDate
      );
  
      setData(res.response?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  }
  

  // =========================
  // Timeline Utilities
  // =========================

  function buildTimeSegments(logs: any[], dateStr: string) {
    if (!logs || logs.length === 0) return [];
  
    const sorted = [...logs].sort(
      (a, b) =>
        new Date(a.punchTime).getTime() -
        new Date(b.punchTime).getTime()
    );
  
    const segments = [];
    let lastIn: Date | null = null;
  
    for (const log of sorted) {
      if (log.punchType === "IN") {
        lastIn = new Date(log.punchTime);
      }
  
      if (log.punchType === "OUT" && lastIn) {
        segments.push({
          start: lastIn,
          end: new Date(log.punchTime),
        });
        lastIn = null;
      }
    }
  
    // If last punch was IN and no OUT exists
    if (lastIn) {
      const today = format(new Date(), "yyyy-MM-dd");
  
      // Only extend till current time if it's today
      if (dateStr === today) {
        segments.push({
          start: lastIn,
          end: new Date(),
        });
      }
    }
  
    return segments;
  }
  

  function getPositionPercent(date: Date) {
    const minutes = date.getHours() * 60 + date.getMinutes();
    return (minutes / (24 * 60)) * 100;
  }

  function getWidthPercent(start: Date, end: Date) {
    const diff =
      (end.getTime() - start.getTime()) / 1000 / 60;
    return (diff / (24 * 60)) * 100;
  }

  const Spinner = () => (
    <div className="flex justify-center items-center py-10">
      <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
  
  return (
    <div className="p-8 space-y-6">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* LEFT SIDE */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {viewMode === "week"
              ? "Weekly Attendance"
              : "Monthly Attendance"}
          </h1>
        </div>

        {/* CENTER – Week Navigation */}
        {viewMode === "week" && (
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm">
            <button
              disabled={loading}
              onClick={() =>
                setCurrentWeekStart(subWeeks(currentWeekStart, 1))
              }
              className={`px-3 py-1 rounded-lg text-sm ${
                loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              ←
            </button>


            <p className="text-sm font-medium">
              {format(currentWeekStart, "dd MMM")} –{" "}
              {format(
                endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
                "dd MMM yyyy"
              )}
            </p>

            <button
              disabled={isNextDisabled || loading}
              onClick={() => {
                if (!isNextDisabled) {
                  setCurrentWeekStart(nextWeekStart);
                }
              }}
              className={`px-3 py-1 rounded-lg text-sm ${
                isNextDisabled || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              →
            </button>
          </div>
        )}

        {/* RIGHT – Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
          <button
            disabled={loading}
            onClick={() => setViewMode("week")}
            className={`px-4 py-1 rounded-md text-sm font-medium transition ${
              viewMode === "week"
                ? "bg-white shadow text-black"
                : "text-gray-500"
            }`}
          >
            Weekly
          </button>
          <button
            disabled={loading}
            onClick={() => setViewMode("month")}
            className={`px-4 py-1 rounded-md text-sm font-medium transition ${
              viewMode === "month"
                ? "bg-white shadow text-black"
                : "text-gray-500"
            }`}
          >
            Monthly
          </button>
        </div>

        </div>


      {/* ================= BODY ================= */}
      {loading && <Spinner />}

      {!loading &&
        data.map((day) => {
          // const segments = buildTimeSegments(day.logs);
          const segments = buildTimeSegments(day.logs, day.date);
          const dateObj = new Date(day.date);

          const isWeekend =
            dateObj.getDay() === 0 ;
            // || dateObj.getDay() === 6;  // Assuming Sunday is the only weekend day for this context

          const isHoliday = holidays.some(
            (h) =>
              h.holidayDate === format(dateObj, "yyyy-MM-dd")
          );
          return (
            <div
                key={day.date}
                className="grid grid-cols-12 items-center gap-4 p-4 rounded-xl shadow-sm bg-white"
              >
                {/* LEFT */}
                <div className="col-span-3 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {format(dateObj, "EEEE")}
                    </p>

                    {isWeekend && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                        Weekend
                      </span>
                    )}

                    {isHoliday && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                        {
                          holidays.find(
                            (h) =>
                              h.holidayDate === format(dateObj, "yyyy-MM-dd")
                          )?.holidayName
                        }
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500">
                    {format(dateObj, "dd MMM yyyy")}
                  </p>
                </div>

                {/* TIMELINE */}
                <div className="col-span-6 sm:col-span-8 relative h-10 bg-gray-100 rounded-xl overflow-visible">

                  {/* Hour Grid */}
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 border-r border-gray-200"
                      style={{
                        left: `${(hour / 24) * 100}%`,
                      }}
                    />
                  ))}

                  {/* Work Segments */}
                  {segments.map((seg: any, index: number) => {
                    const left = getPositionPercent(seg.start);
                    const width = getWidthPercent(seg.start, seg.end);

                    return (
                      <div
                        key={index}
                        className="absolute top-1 h-8 group"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                      >
                        {/* Green Bar */}
                        <div className="h-8 bg-green-400 rounded-xl" />

                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 
                                        hidden group-hover:block
                                        bg-black text-white text-xs px-3 py-1 
                                        rounded-md whitespace-nowrap shadow-lg z-50">
                          {format(seg.start, "hh:mm a")} – {format(seg.end, "hh:mm a")}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT */}
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                      isHoliday
                        ? "bg-yellow-100 text-yellow-700"
                        : isWeekend
                        ? "bg-blue-100 text-blue-700"
                        : day.status === "PRESENT"
                        ? "bg-green-100 text-green-700"
                        : day.status === "HALF_DAY"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {isHoliday
                      ? "H"
                      : isWeekend
                      ? "W"
                      : day.status === "PRESENT"
                      ? "P"
                      : day.status === "HALF_DAY"
                      ? "HD"
                      : "A"}
                  </span>

                  <p className="text-sm text-gray-600 min-w-[40px] text-right">
                    {day.workHours ?? 0}h {day.workMinutes ?? 0}m
                  </p>
                </div>
              </div>

             );
        })}
      </div>
  );
}

export default AttendancePage;
