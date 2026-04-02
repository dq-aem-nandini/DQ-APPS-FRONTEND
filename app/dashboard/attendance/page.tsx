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
  isAfter,
  addMonths, 
  subMonths
} from "date-fns";
import { employeePunchService } from "@/lib/api/EmployeePunchService";
import { employeeService } from "@/lib/api/employeeService";
import { holidayService } from '@/lib/api/holidayService';
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { AttendanceStatus } from "@/lib/api/types";
const ATTENDANCE_STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  PRESENT: {
    label: "P",
    className: "bg-green-100 text-green-700",
  },
  ABSENT: {
    label: "A",
    className: "bg-red-100 text-red-600",
  },
  HALF_DAY: {
    label: "HD",
    className: "bg-orange-100 text-orange-700",
  },
  INCOMPLETE: {
    label: "INC",
    className: "bg-yellow-100 text-yellow-700",
  },
};
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
  const [submitting, setSubmitting] = useState(false);
  const [showRegularizationModal, setShowRegularizationModal] = useState(false);

  const [form, setForm] = useState({
    date: "",
    clockIn: "",
    clockOut: "",
    reason: "",
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const isNextMonthDisabled = isAfter( addMonths(currentMonth, 1),new Date());


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
  }, [employeeId, currentWeekStart, viewMode, currentMonth]);

  async function fetchAttendance() {
    try {
      setLoading(true);

      let fromDate;
      let toDate;

      if (viewMode === "week") {
        fromDate = format(weekStart, "yyyy-MM-dd");
        toDate = format(weekEnd, "yyyy-MM-dd");
      } else {
        
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

      segments.push({
        start: lastIn,
        end: dateStr === today ? new Date() : new Date(`${dateStr}T23:59:59`),
      });
    }

    return segments;
  }

  async function handleSubmitRegularization() {

    if (!form.date) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Date is required",
      });
      return;
    }
    if (!form.clockIn && !form.clockOut) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Either Clock In or Clock Out must be provided",
      });
      return;
    }
    if (!form.reason.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Comments are required",
      });
      return;
    }



    try {

      setSubmitting(true);

      const correctedIn = form.clockIn
        ? `${form.date}T${form.clockIn}:00`
        : null;

      const correctedOut = form.clockOut
        ? `${form.date}T${form.clockOut}:00`
        : null;

      const res = await employeePunchService.addRegularization({
        date: form.date,
        correctedIn,
        correctedOut,
        reason: form.reason,
      });

      if (res.flag) {

        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.message || "Regularization submitted successfully",
          timer: 2000,
          showConfirmButton: false,
        });

        setShowRegularizationModal(false);

        setForm({
          date: "",
          clockIn: "",
          clockOut: "",
          reason: "",
        });

        fetchAttendance();

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res.message || "Something went wrong",
        });

      }

    } catch (error: any) {

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to submit regularization",
      });

    } finally {
      setSubmitting(false);
    }
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


  function getOrdinalSuffix(day: number) {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }


  if (loading || !employeeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-gray-500 text-sm">Loading attendance...</p>
      </div>
    );
  }
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
              className={`px-3 py-1 rounded-lg text-sm ${loading
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
              className={`px-3 py-1 rounded-lg text-sm ${isNextDisabled || loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 hover:bg-gray-200"
                }`}
            >
              →
                </button>
              </div>
            )}

            {/* CENTER – Month Navigation */}
        {viewMode === "month" && (
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm">
            
            <button
              disabled={loading}
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className={`px-3 py-1 rounded-lg text-sm ${
                loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              ←
            </button>

            <p className="text-sm font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </p>

            <button
              disabled={isNextMonthDisabled || loading}
              onClick={() => {
                if (!isNextMonthDisabled) {
                setCurrentMonth(addMonths(currentMonth, 1))
                }
              }}
              className={`px-3 py-1 rounded-lg text-sm ${
                isNextMonthDisabled || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              →
            </button>
          </div>
        )}

            <button
              onClick={() => {
                setForm({
                  date: "",
                  clockIn: "",
                  clockOut: "",
                  reason: "",
                });
                setShowRegularizationModal(true);
              }}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800"
            >
              Add Regularisation
            </button>

        {/* RIGHT – Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
          <button
            disabled={loading}
            onClick={() => setViewMode("week")}
            className={`px-4 py-1 rounded-md text-sm font-medium transition ${viewMode === "week"
              ? "bg-white shadow text-black"
              : "text-gray-500"
              }`}
          >
            Weekly
          </button>
          <button
            disabled={loading}
            onClick={() => setViewMode("month")}
            className={`px-4 py-1 rounded-md text-sm font-medium transition ${viewMode === "month"
              ? "bg-white shadow text-black"
              : "text-gray-500"
              }`}
          >
            Monthly
          </button>
        </div>

      </div>


      {/* ================= BODY ================= */}
      {!loading &&
        data.map((day) => {
          // const segments = buildTimeSegments(day.logs);
          const statusConfig =
            ATTENDANCE_STATUS_CONFIG[day.status as AttendanceStatus];
          const segments = buildTimeSegments(day.logs, day.date);
          const dateObj = new Date(day.date);

          const isWeekend =
            dateObj.getDay() === 0;
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

                   {/* Show day , e.g., "Monday" */}
                  {/* <p className="font-medium">
                    {format(dateObj, "EEEE")}
                  </p> */}

                    {/* Show date with ordinal suffix, e.g., "21st Jan" */}
                    <p className="font-medium">
                      {dateObj.getDate()}
                      {getOrdinalSuffix(dateObj.getDate())}{" "}
                      {format(dateObj, "MMMM yyyy")}
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
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${isHoliday
                      ? "bg-yellow-100 text-yellow-700"
                      : isWeekend
                        ? "bg-blue-100 text-blue-700"
                        : statusConfig?.className
                    }`}
                >
                  {isHoliday
                    ? "H"
                    : isWeekend
                      ? "W"
                      : statusConfig?.label}
                </span>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm text-gray-600 min-w-[40px] text-right">
                    {day.workHours ?? 0}h {day.workMinutes ?? 0}m
                  </p>
                </div>
              </div>
            </div>

          );
        })}
      {showRegularizationModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[520px] rounded-xl shadow-lg p-6 space-y-4">

            {/* HEADER */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Create Regularization Request
              </h2>

              <button
                onClick={() => setShowRegularizationModal(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* DATE */}
            <div>
              <label className="text-sm font-medium">
                Choose Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                max={format(new Date(), "yyyy-MM-dd")}
                className="w-full mt-1 border rounded-lg px-3 py-2"
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
              />
            </div>

            {/* CLOCK IN */}
            <div>
              <label className="text-sm font-medium">
                Clock In <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.clockIn}
                className="w-full mt-1 border rounded-lg px-3 py-2"
                onChange={(e) =>
                  setForm({ ...form, clockIn: e.target.value })
                }
              />
            </div>

            {/* CLOCK OUT */}
            <div>
              <label className="text-sm font-medium">
                Clock Out <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="time"
                value={form.clockOut}
                className="w-full mt-1 border rounded-lg px-3 py-2"
                onChange={(e) =>
                  setForm({ ...form, clockOut: e.target.value })
                }
              />
            </div>

            {/* COMMENTS */}
            <div>
              <label className="text-sm font-medium">
                Comments <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full mt-1 border rounded-lg px-3 py-2 h-24"
                placeholder="Select comments"
                onChange={(e) =>
                  setForm({ ...form, reason: e.target.value })
                }
              />
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 pt-3">

              <button
                onClick={() => setShowRegularizationModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitRegularization}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-white ${submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-gray-800"
                  }`}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default AttendancePage;