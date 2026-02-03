"use client";
import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, X, Edit2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { holidayService } from "@/lib/api/holidayService";
import type { DeleteEmployeeHolidayRequestDTO, HolidaysDTO } from "@/lib/api/types";
import { employeeService } from "@/lib/api/employeeService";
import dayjs from "dayjs";
import { EmployeeMinDTO } from "@/lib/api/types";
import ClientEmployeeSelector from '@/components/ClientEmployeeSelector/ClientEmployeeSelector';


import Swal from "sweetalert2";
import { superHrHolidayService } from "@/lib/api/superHrHolidayService";
const ViewHolidaysPage: React.FC = () =>{
  const [holidays, setHolidays] = useState<HolidaysDTO[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showAllHolidays, setShowAllHolidays] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [upcomingPage, setUpcomingPage] = useState(1);
  

  const [newHoliday, setNewHoliday] = useState({
    holidayDate: "",
    holidayName: "",
  });
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeMinDTO | null>(null);
    const [joiningDate, setJoiningDate] = useState<dayjs.Dayjs | null>(null);
    const [clientId, setClientId] = useState<string | null>(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const ITEMS_PER_PAGE = 3;
  
  useEffect(() => {
    if (!selectedEmployeeId) return;

    const fetchHolidays = async () => {
      try {
        setLoading(true);

        const year = currentMonth.getFullYear(); // 👈 IMPORTANT

        const res = await holidayService.getAllHolidays(year, selectedEmployeeId); // 2

        if (res.flag && Array.isArray(res.response)) {
          setHolidays(
            res.response.sort((a, b) =>
              a.holidayDate.localeCompare(b.holidayDate)
            )
          );
        }
      } catch (err) {
        console.error("Failed to load holidays", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [currentMonth.getFullYear(), selectedEmployeeId]);

  const refreshHolidays = async () => {
    if (!selectedEmployeeId) return;
  
    const year = currentMonth.getFullYear();
    const res = await holidayService.getAllHolidays(
      year,
      selectedEmployeeId
    );
  
    if (res.flag && Array.isArray(res.response)) {
      setHolidays(
        res.response.sort((a, b) =>
          a.holidayDate.localeCompare(b.holidayDate)
        )
      );
    }
  };
  

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getHolidaysForDate = (date: Date) => {
    const year = currentMonth.getFullYear();
    return holidays.filter((h) => {
      if (!h.holidayDate) return false;
      const holidayDate = new Date(h.holidayDate);
      return isSameDay(holidayDate, date) && holidayDate.getFullYear() === year;
    });
  };

  // filtering the Upcoming Holidays Pagination
  const allUpcomingHolidays = holidays
    .filter((h) => {
      if (!h.holidayDate) return false;
      const hDate = new Date(h.holidayDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      hDate.setHours(0, 0, 0, 0);
      return hDate > today;
    });

  const totalUpcomingPages = Math.ceil(
    allUpcomingHolidays.length / ITEMS_PER_PAGE,
  );

  const uppcomingHolidays = allUpcomingHolidays.slice(
    (upcomingPage - 1) * ITEMS_PER_PAGE,
    upcomingPage * ITEMS_PER_PAGE,
  );

  // Reset Page When Data Changes (Important)
  // If holidays are deleted or loaded again
  useEffect(() => {
    setUpcomingPage(1);
  }, [holidays]);

  const filteredAllHolidays = holidays
    .filter(
      (h) =>
        h.holidayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.holidayDate ?? "").includes(searchTerm),
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
       
          
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Holiday Calendar
          </h1>
          <p className="text-gray-600 mt-1">Your upcoming company holidays</p>
        </div>
        <ClientEmployeeSelector
            clientId={clientId ?? ""}
            employeeId={selectedEmployeeId}
            onClientChange={(id) => {
                setClientId(id);
                setSelectedEmployeeId(null);
                setSelectedEmployee(null);
            }}
            onEmployeeChange={(empId, emp, doj) => {
                setSelectedEmployeeId(empId);
                setSelectedEmployee(emp);
                setJoiningDate(doj);
            }}
            />
        {/* Upcoming Holidays */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Holidays ({allUpcomingHolidays.length})
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {editMode && (
                  <Button
                  size="icon"
                  variant="outline"
                  disabled={!selectedEmployeeId}
                  className="text-green-600 border-green-600"
                  onClick={() => setShowAddDialog(true)}
                >
                  +
                </Button>
                
                )}

                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setEditMode((prev) => !prev)}
                  className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                  aria-label="Toggle edit mode"
                >
                  {editMode ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Edit2 className="w-4 h-4" />
                  )}
                </Button>

                {holidays.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllHolidays(true)}
                    className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                  >
                    View All ({holidays.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : allUpcomingHolidays.length === 0 ? (
              <p className="text-center text-gray-500 py-6">
                No upcoming holidays
              </p>
            ) : (
              <div className="space-y-3">
                {uppcomingHolidays.map((holiday) => (
                  <div
                    key={holiday.holidayId}
                    className="group flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition"
                  >
                    {/* Left: Holiday name + full date */}
                    <div>
                      <p className="font-medium text-gray-900">
                        {holiday.holidayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {holiday.holidayDate
                          ? format(
                            new Date(holiday.holidayDate),
                            "EEE, d MMM yyyy",
                          )
                          : "—"}
                      </p>
                    </div>

                    {/* Right: Date badge */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">
                          {holiday.holidayDate
                            ? format(new Date(holiday.holidayDate), "dd")
                            : "--"}
                        </div>
                        <div className="text-xs text-gray-600 uppercase">
                          {holiday.holidayDate
                            ? format(new Date(holiday.holidayDate), "MMM")
                            : ""}
                        </div>
                      </div>

                      {/* Delete icon (edit mode only) */}
                      {editMode && (
  <button
    onClick={async () => {
      if (!selectedEmployeeId|| !holiday.holidayId) return;

      const confirm = await Swal.fire({
        title: "Delete Holiday?",
        text: "This holiday will be removed for the selected employee.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Delete",
      });

      if (!confirm.isConfirmed) return;

      try {
        const payload: DeleteEmployeeHolidayRequestDTO = {
          holidayId: holiday.holidayId,
          employeeId: selectedEmployeeId,
        };

        const res =
          await superHrHolidayService.deleteEmployeeHoliday(payload);

        if (res.flag) {
          Swal.fire("Deleted!", res.message, "success");
          await refreshHolidays();
        } else {
          Swal.fire("Error", res.message || "Delete failed", "error");
        }
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to delete holiday", "error");
      }
    }}
    className="text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition"
  >
    <X className="w-5 h-5" />
  </button>
)}

                    </div>
                  </div>
                ))}

                {totalUpcomingPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={upcomingPage === 1}
                      onClick={() => setUpcomingPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>

                    <span className="text-sm text-gray-600">
                      Page {upcomingPage} of {totalUpcomingPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={upcomingPage === totalUpcomingPages}
                      onClick={() =>
                        setUpcomingPage((p) =>
                          Math.min(totalUpcomingPages, p + 1),
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1),
                  )
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-lg">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1),
                  )
                }
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={index} className="font-bold text-gray-700 py-2">
                  {day}
                </div>
              ))}

              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {monthDays.map((day) => {
                const dayHolidays = getHolidaysForDate(day);
                const today = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      min-h-16 p-1 border rounded text-xs leading-tight
                      ${today ? "bg-blue-100 border-blue-400 font-bold" : "border-gray-200"}
                      ${dayHolidays.length > 0 ? "bg-red-50" : "bg-white"}
                    `}
                  >
                    <div className="font-medium">{format(day, "d")}</div>
                    {dayHolidays.length > 0 && (
                      <div className="mt-1 space-y-0.5 max-h-12 overflow-y-auto scrollbar-thin">
                        {dayHolidays.slice(0, 2).map((h) => (
                          <div
                            key={h.holidayId}
                            className="text-[10px] bg-red-600 text-white px-1 py-0.5 rounded truncate font-medium"
                            title={h.holidayName}
                          >
                            {h.holidayName}
                          </div>
                        ))}
                        {dayHolidays.length > 2 && (
                          <div className="text-[9px] text-red-700 font-bold text-center">
                            +{dayHolidays.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        {/* Total Holidays */}
        <div className="text-center mt-10">
          <p className="text-lg font-medium text-gray-700">
            Total Holidays in{" "}
            <span className="font-bold text-indigo-600">
              {format(currentMonth, "yyyy")}
            </span>
            :
            <span className="ml-2 font-bold text-indigo-600">
              {
                holidays.filter(
                  (h) =>
                    h.holidayDate &&
                    new Date(h.holidayDate).getFullYear() ===
                    currentMonth.getFullYear(),
                ).length
              }
            </span>
          </p>
        </div>
      </div>
      {/* View All Holidays Modal - FIXED & BEAUTIFUL */}
      <Dialog open={showAllHolidays} onOpenChange={setShowAllHolidays}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              All Holidays ({holidays.length})
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete list of company holidays for all years
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by holiday name or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            {/* Table */}
            <div className="border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">
                      Date
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">
                      Holiday Name
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAllHolidays.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-16 text-gray-500"
                      >
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No holidays found</p>
                        {searchTerm && (
                          <p className="text-sm mt-2">
                            Try adjusting your search
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredAllHolidays.map((holiday) => (
                      <tr
                        key={holiday.holidayId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4 text-sm font-medium text-gray-900">
                          {holiday.holidayDate
                            ? format(
                              new Date(holiday.holidayDate),
                              "dd MMM yyyy",
                            )
                            : "—"}
                        </td>
                        <td className="p-4 font-medium text-gray-900">
                          {holiday.holidayName}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {holiday.comments || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Holiday Name */}
            <Input
              type="text"
              placeholder="Holiday Name"
              value={newHoliday.holidayName}
              onChange={(e) =>
                setNewHoliday((prev) => ({
                  ...prev,
                  holidayName: e.target.value,
                }))
              }
            />

            {/* Holiday Date */}
            <Input
              type="date"
              value={newHoliday.holidayDate}
              onChange={(e) =>
                setNewHoliday((prev) => ({
                  ...prev,
                  holidayDate: e.target.value,
                }))
              }
            />

<Button
  className="w-full"
  onClick={async () => {
    if (
      !newHoliday.holidayName ||
      !newHoliday.holidayDate ||
      !selectedEmployeeId
    ) {
      Swal.fire("Missing data", "Please fill all fields", "warning");
      return;
    }

    try {
      const payload = {
        holidayName: newHoliday.holidayName.trim(),
        holidayDate: newHoliday.holidayDate,
        employeeIds: [selectedEmployeeId], // 👈 IMPORTANT
      };

      const res =
        await superHrHolidayService.addEmployeeHoliday(payload);

      if (res.flag) {
        Swal.fire("Success!", res.message, "success");
        await refreshHolidays();
        setShowAddDialog(false);
        setNewHoliday({ holidayName: "", holidayDate: "" });
      } else {
        Swal.fire("Error", res.message || "Add failed", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message || "Failed to add holiday", "error");
    }
  }}
>
  Save
</Button>

          </div>
        </DialogContent>
      </Dialog>



    </div>
  );
}

export default ViewHolidaysPage;