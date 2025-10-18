'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { employeeService } from "@/lib/api/employeeService";
import { TimeSheetModel, TimeSheetResponse } from "@/lib/api/types";
import dayjs from "dayjs";

const TimeSheetRegister: React.FC<{ userId?: string }> = ({ userId: propUserId }) => {
  const joiningDate = dayjs("2024-04-10");
  const today = dayjs();
  
  const { state: authState } = useAuth();
  const userId = propUserId ?? authState.user?.userId ?? null;
  
  const [weekStart, setWeekStart] = useState(dayjs().startOf("week"));
  const [weekEnd, setWeekEnd] = useState(dayjs().endOf("week"));
  const [timeSheets, setTimeSheets] = useState<TimeSheetResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!userId) {
      console.warn('No userId provided to TimeSheetRegister; skipping fetch.');
      return;
    }
    try {
      setLoading(true);
      const res = await employeeService.viewTimeSheet(userId);
      setTimeSheets(res.response || []);
    } catch (e) {
      console.error('Error fetching timesheets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.isLoading) return;        // wait until auth init done
    if (!userId) {
      console.warn('No userId provided to TimeSheetRegister; skipping fetch.');
      return;
    }

    fetchData();
  }, [userId, weekStart, weekEnd, authState.isLoading]);

  const handlePrevWeek = () => {
    const newStart = weekStart.subtract(1, "week");
    const newEnd = weekEnd.subtract(1, "week");
    if (newStart.isBefore(joiningDate)) return;
    setWeekStart(newStart);
    setWeekEnd(newEnd);
  };

  const handleNextWeek = () => {
    const newStart = weekStart.add(1, "week");
    const newEnd = weekEnd.add(1, "week");
    if (newEnd.isAfter(today)) return;
    setWeekStart(newStart);
    setWeekEnd(newEnd);
  };

  // Create empty rows for all 7 days of the week (Sat & Sun included)
  const allDays = Array.from({ length: 7 }).map((_, i) => {
    const date = weekStart.add(i, "day");
    const existing = timeSheets.find(ts => dayjs(ts.workDate).isSame(date, "day"));
    return (
      existing || {
        timesheetId: "",
        workDate: date.format("YYYY-MM-DD"),
        taskName: "",
        taskDescription: "",
        hoursWorked: 0,
        status: "Draft",
      }
    );
  });

// const handleChange = (index: number, field: string, value: string | number) => {
  //   const updated = [...allDays];
    
  //   updated[index][field] = value;
  //   setTimeSheets(updated);
  // };


  const handleChange = (index: number, field: keyof TimeSheetResponse, value: string | number) => {
    const updated = [...allDays] as TimeSheetResponse[];
    const item = { ...updated[index], [field]: value } as TimeSheetResponse;
    updated[index] = item;
    setTimeSheets(updated);
  };

 
  const handleSave = async (entry: TimeSheetResponse | TimeSheetModel) => {
    try {
      if ((entry.taskName ?? "").trim() === "") {
        alert("Task name cannot be empty");
        return;
      }
      setLoading(true);
      // employeeService does not expose updateTimeSheet; use registerTimeSheet for create/update
      // cast to TimeSheetModel to satisfy the API typing (status in TimeSheetResponse is a plain string)
      await employeeService.registerTimeSheet(entry as TimeSheetModel);
      await fetchData();
      setEditingId(null);
    } catch (err) {
      console.error("Error saving timesheet:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Weekly Timesheet Register</h2>

      <div className="flex items-center gap-3 mb-3">
        <button onClick={handlePrevWeek} className="px-3 py-1 bg-gray-200 rounded">←</button>
        <span>
          {weekStart.format("MMM DD")} - {weekEnd.format("MMM DD, YYYY")}
        </span>
        <button onClick={handleNextWeek} className="px-3 py-1 bg-gray-200 rounded">→</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full border-collapse border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Task</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Hours</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {allDays.map((entry, i) => (
              <tr key={entry.workDate}>
                <td className="border p-2">{dayjs(entry.workDate).format("ddd, DD MMM")}</td>
                <td className="border p-2">
                  <input
                    type="text"
                    value={entry.taskName}
                    disabled={entry.status === "Submitted"}
                    onChange={(e) => handleChange(i, "taskName", e.target.value)}
                    className="border p-1 rounded w-full"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    value={entry.taskDescription}
                    disabled={entry.status === "Submitted"}
                    onChange={(e) => handleChange(i, "taskDescription", e.target.value)}
                    className="border p-1 rounded w-full"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    value={entry.hoursWorked}
                    disabled={entry.status === "Submitted"}
                    onChange={(e) => handleChange(i, "hoursWorked", Number(e.target.value))}
                    className="border p-1 rounded w-20"
                  />
                </td>
                <td className="border p-2">{entry.status}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleSave(entry)}
                    disabled={entry.status === "Submitted"}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    {entry.timesheetId ? "Update" : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TimeSheetRegister;
