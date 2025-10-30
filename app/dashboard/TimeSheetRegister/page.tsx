// components/employee/TimeSheetRegister.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

import { leaveService } from '@/lib/api/leaveService';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);
import { Plus, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { HolidayCalendarDTO, EmployeeLeaveDayDTO, TimeSheetResponseDto, TimeSheetModel } from '@/lib/api/types';
import { holidaysService } from '@/lib/api/holidayService';
import { timesheetService } from '@/lib/api/timeSheetService';
import Spinner from '@/components/ui/Spinner';


interface TaskRow {
  id: string;
  taskName: string;
  hours: Record<string, number>;
  timesheetIds?: Record<string, string>;
  _dirty?: boolean;
}

const TimeSheetRegister: React.FC = () => {
  const { state } = useAuth();
  const userId = state.user?.userId ?? null;

  // Week selection state
  const [weekStart, setWeekStart] = useState(() =>
    dayjs().startOf('week').add(1, 'day')
  ); // Monday
  const [selectedDate, setSelectedDate] = useState(weekStart.format('YYYY-MM-DD'));
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [holidayMap, setHolidayMap] = useState<Record<string, HolidayCalendarDTO>>({});
  const [leaveMap, setLeaveMap] = useState<Record<string, { leaveCategory: string; duration: number }>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  // Inline message panel (replaces alert())
  const [messages, setMessages] = useState<{ id: string; type: 'success' | 'error' | 'info'; text: string }[]>([]);
  const pushMessage = (type: 'success' | 'error' | 'info', text: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setMessages(prev => [...prev, { id, type, text }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 6000);
  };

  // Confirm modal state
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; rowIndex: number | null }>({ open: false, rowIndex: null });
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null); // For loading state on delete

  const currentYear = weekStart.format('YYYY');
  const weekDates = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => weekStart.add(i, 'day')),
    [weekStart]
  );

  // Handle date selection and snap to week Monday
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = dayjs(e.target.value);
    if (date.isValid()) {
      const monday = date.startOf('week').add(1, 'day'); // Monday
      setWeekStart(monday);
      setSelectedDate(monday.format('YYYY-MM-DD'));
    }
  };

  // 🔹 Fetch holidays
  const fetchHolidays = useCallback(async () => {
    try {
      const response = await holidaysService.getAllCalendars();
      if (!response.flag || !response.response) {
        throw new Error(response.message || 'Failed to fetch holidays');
      }
      const holidays: HolidayCalendarDTO[] = response.response;
      const map: Record<string, HolidayCalendarDTO> = {};
      holidays.forEach((h: HolidayCalendarDTO) => {
        if (h.holidayActive)
          map[dayjs(h.holidayDate).format('YYYY-MM-DD')] = h;
      });
      setHolidayMap(map);
    } catch (err) {
      console.error('Error fetching holidays', err);
      pushMessage('error', 'Failed to fetch holidays');
    }
  }, []);

  // 🔹 Fetch approved leaves for the year
  const fetchLeaves = useCallback(async (year: string) => {
    try {
      const leaves: EmployeeLeaveDayDTO[] = await leaveService.getApprovedLeaves(year);
      const map: Record<string, { leaveCategory: string; duration: number }> = {};

      leaves.forEach((l: EmployeeLeaveDayDTO) => {
        map[dayjs(l.date).format('YYYY-MM-DD')] = {
          leaveCategory: l.leaveCategory,
          duration: l.duration ?? 1,
        };
      });

      setLeaveMap(map);
    } catch (err) {
      console.error('Error fetching leaves', err);
      pushMessage('error', 'Failed to fetch leaves');
    }
  }, []);

  // 🔹 Fetch weekly timesheets
  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      // Format dates with explicit year, month, day for accurate filtering
      const params = {
        startDate: weekStart.format('YYYY-MM-DD'),
        endDate: weekStart.clone().add(6, 'day').format('YYYY-MM-DD'),
      };
      console.debug('[TimeSheetRegister] Fetching timesheets for week:', {
        startDate: params.startDate,
        endDate: params.endDate,
        weekStartYear: weekStart.year(),
        weekStartMonth: weekStart.month() + 1,
      });

      const response = await timesheetService.getAllTimesheets({
        startDate: params.startDate,
        endDate: params.endDate,
      });

      if (!response.flag || !response.response) {
        throw new Error(response.message || 'Failed to fetch timesheets');
      }

      // Filter entries to ensure they match the exact year and month we're looking for
      const list: TimeSheetResponseDto[] = response.response.filter(entry => {
        const entryDate = dayjs(entry.workDate);
        const isInRange = entryDate.isBetween(weekStart, weekStart.clone().add(6, 'day'), 'day', '[]');
        const matchesYearMonth = (
          entryDate.year() === weekStart.year() &&
          entryDate.month() === weekStart.month()
        );

        console.debug('[TimeSheetRegister] Entry date check:', {
          entryId: entry.timesheetId,
          date: entry.workDate,
          isInRange,
          matchesYearMonth,
          entryYear: entryDate.year(),
          entryMonth: entryDate.month() + 1,
          weekStartYear: weekStart.year(),
          weekStartMonth: weekStart.month() + 1,
        });

        return isInRange && matchesYearMonth;
      });

      console.debug('[TimeSheetRegister] Filtered timesheets:', {
        total: response.response.length,
        filtered: list.length,
        dates: list.map(x => ({ id: x.timesheetId, date: x.workDate })),
      });

      // Set locked state based on statuses
      const hasSubmittedEntries = list.some(item => item.status === 'Submitted');
      console.debug('[TimeSheetRegister] Any submitted entries:', hasSubmittedEntries);

      setIsLocked(hasSubmittedEntries); // Lock if any entries are submitted

      // Map backend TimeSheetResponseDto => frontend TimeSheetModel with date validation
      const mappedList: TimeSheetModel[] = list.map((item: TimeSheetResponseDto) => {
        const entryDate = dayjs(item.workDate);
        console.debug('[TimeSheetRegister] Mapping timesheet entry:', {
          id: item.timesheetId,
          date: item.workDate,
          year: entryDate.year(),
          month: entryDate.month() + 1,
          day: entryDate.date(),
          hours: item.workedHours,
          task: item.taskName,
        });

        return {
          timesheetId: item.timesheetId ?? '',
          workDate: item.workDate ?? '',
          hoursWorked: item.workedHours ?? 0,
          taskName: item.taskName ?? '',
          taskDescription: '',
          clientId: item.clientId ?? '',
        };
      });
      console.debug('[TimeSheetRegister] fetchData - mappedList:', JSON.stringify(mappedList, null, 2));

      const grouped: Record<string, TaskRow> = {};
      mappedList.forEach(item => {
        const date = dayjs(item.workDate).format('YYYY-MM-DD');
        const task = item.taskName || 'Untitled';
        if (!grouped[task]) {
          grouped[task] = {
            id: task + Math.random().toString(16).slice(2, 6),
            taskName: task,
            hours: {},
            timesheetIds: {},
          };
        }
        grouped[task].hours[date] = Number(item.hoursWorked || 0);
        if (item.timesheetId)
          grouped[task].timesheetIds![date] = item.timesheetId;
      });

      const finalRows = Object.values(grouped);
      if (finalRows.length === 0) {
        finalRows.push({
          id: 'row0',
          taskName: '',
          hours: Object.fromEntries(weekDates.map(d => [d.format('YYYY-MM-DD'), 0])),
        });
      }
      setRows(finalRows);
      return finalRows;
    } catch (err) {
      console.error('Failed to fetch timesheet', err);
      pushMessage('error', 'Failed to fetch timesheets');
      setIsLocked(false);
    } finally {
      setLoading(false);
    }
  }, [userId, weekStart, weekDates]);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchData(),
          fetchHolidays(),
          fetchLeaves(currentYear),
        ]);
      } catch (err) {
        console.error('Error loading data', err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [fetchData, fetchHolidays, fetchLeaves, currentYear]);

  // 🔹 Validation for save operation: only checks modified or existing entries
  const validateForSave = (): { ok: boolean; messages: string[] } => {
    const msgs: string[] = [];
    const dateHours: Record<string, number> = {}; // Track total hours per date for modified entries

    // First pass: validate only modified rows or rows with existing timesheet IDs
    rows.forEach((r, ri) => {
      const anyHours = Object.values(r.hours).some(h => Number(h) > 0);
      const isDirty = r._dirty;
      const hasTimesheetIds = r.timesheetIds && Object.keys(r.timesheetIds).length > 0;

      // Only validate rows that are modified or have existing timesheet entries
      if (isDirty || hasTimesheetIds) {
        // Validate task name if hours present
        if (anyHours && (!r.taskName || r.taskName.trim() === '')) {
          msgs.push(`Row ${ri + 1}: Task name is required when hours are entered`);
        }

        // Check each date's entries in the row
        Object.entries(r.hours).forEach(([date, hours]) => {
          const h = Number(hours);
          const isDateModified = isDirty && r.hours[date] !== undefined;
          const hasTimesheetId = r.timesheetIds?.[date];

          // Only validate dates that are modified or have existing timesheet IDs
          if (isDateModified || hasTimesheetId) {
            dateHours[date] = (dateHours[date] || 0) + h;

            // Validate hour bounds
            if (h < 0) {
              msgs.push(`Row ${ri + 1}: Hours cannot be negative for ${date}`);
            }
            if (h > 24) {
              msgs.push(`Row ${ri + 1}: Hours cannot exceed 24 for ${date}`);
            }

            // Check holiday conflicts
            if (holidayMap[date] && h > 0) {
              msgs.push(`Row ${ri + 1}: Time entered on holiday (${holidayMap[date].holidayName}) for ${date}`);
            }

            // Check leave conflicts: only block entries for full-day leaves
            const leaveInfo = leaveMap[date];
            if (leaveInfo && leaveInfo.duration === 1 && h > 0) {
              msgs.push(`Row ${ri + 1}: Time entered on approved full-day leave (${leaveInfo.leaveCategory}) for ${date}`);
            }
          }
        });
      }
    });

    // Second pass: check total hours for modified dates (per-day cap 8)
    Object.entries(dateHours).forEach(([date, totalHours]) => {
      const dayDate = dayjs(date);

      // Validate total hours for modified dates
      if (totalHours > 8) {
        msgs.push(`Total hours for ${date} (${dayDate.format('dddd')}) exceed 8 (${totalHours} hours)`);
      }
    });

    console.debug('[TimeSheetRegister] validateForSave results:', {
      messages: msgs,
      dateHours,
      hasErrors: msgs.length > 0,
    });

    return { ok: msgs.length === 0, messages: msgs };
  };

  // 🔹 Validation for submission: checks all workdays
  const runValidation = (): { ok: boolean; messages: string[] } => {
    const msgs: string[] = [];
    const dateHours: Record<string, number> = {}; // Track total hours per date

    // First pass: validate individual rows and collect total hours per date
    rows.forEach((r, ri) => {
      const anyHours = Object.values(r.hours).some(h => Number(h) > 0);

      // Validate task name if hours present
      if (anyHours && (!r.taskName || r.taskName.trim() === '')) {
        msgs.push(`Row ${ri + 1}: Task name is required when hours are entered`);
      }

      // Check each date's entries
      Object.entries(r.hours).forEach(([date, hours]) => {
        const h = Number(hours);
        dateHours[date] = (dateHours[date] || 0) + h;

        // Validate hour bounds
        if (h < 0) {
          msgs.push(`Row ${ri + 1}: Hours cannot be negative for ${date}`);
        }
        if (h > 24) {
          msgs.push(`Row ${ri + 1}: Hours cannot exceed 24 for ${date}`);
        }

        // Check holiday conflicts
        if (holidayMap[date] && h > 0) {
          msgs.push(`Row ${ri + 1}: Time entered on holiday (${holidayMap[date].holidayName}) for ${date}`);
        }

        // Check leave conflicts: only block entries for full-day leaves
        const leaveInfo = leaveMap[date];
        if (leaveInfo && leaveInfo.duration === 1 && h > 0) {
          msgs.push(`Row ${ri + 1}: Time entered on approved full-day leave (${leaveInfo.leaveCategory}) for ${date}`);
        }
      });
    });

    // Second pass: check total hours for all days in the week
  weekDates.forEach((d) => {
      const date = d.format('YYYY-MM-DD');
      const totalHours = dateHours[date] || 0;
      const dayDate = dayjs(date);
      const weekday = dayDate.day();
      const isWeekend = weekday === 0 || weekday === 6;
      const isHoliday = holidayMap[date];
      const leaveInfo = leaveMap[date];

      // Validate workdays (Monday to Friday, not holidays or full-day leave days)
      if (!isWeekend && !isHoliday && !leaveInfo) {
        if (totalHours === 0) {
          msgs.push(`No hours entered for workday ${date} (${dayDate.format('dddd')})`);
        }
      }

      // Validate holidays must have 0 hours
      if (isHoliday && totalHours > 0) {
        msgs.push(`Hours entered for holiday (${holidayMap[date].holidayName}) on ${date} (${dayDate.format('dddd')})`);
      }

      // Validate leave days: full-day leaves must have 0 hours; half-day leaves limited to 4 hours
      if (leaveInfo) {
        if (leaveInfo.duration === 1 && totalHours > 0) {
          msgs.push(`Hours entered for full-day leave (${leaveInfo.leaveCategory}) on ${date} (${dayDate.format('dddd')})`);
        }
        if (leaveInfo.duration === 0.5 && totalHours > 4) {
          msgs.push(`Hours entered for half-day leave (${leaveInfo.leaveCategory}) on ${date} exceed 4 hours`);
        }
      }

      // Enforce per-day maximum hours (8)
      if (totalHours > 8) {
        msgs.push(`Total hours for ${date} (${dayDate.format('dddd')}) exceed 8 (${totalHours} hours)`);
      }
    });

    console.debug('[TimeSheetRegister] Validation results:', {
      messages: msgs,
      dateHours,
      hasErrors: msgs.length > 0,
    });

    return { ok: msgs.length === 0, messages: msgs };
  };

  // 🔹 Row operations
  const addRow = () => {
    if (isLocked || loading) return;
    const id = 'r' + Date.now();
    const hours = Object.fromEntries(weekDates.map(d => [d.format('YYYY-MM-DD'), 0]));
    setRows(prev => [...prev, { id, taskName: '', hours }]);
  };

  const deleteRow = (index: number) => {
    if (isLocked || loading) {
      pushMessage('info', 'Timesheet is locked');
      return;
    }
    setConfirmDelete({ open: true, rowIndex: index });
  };

  const handleChange = (rowIndex: number, date: string, value: number) => {
    if (isLocked || loading) return;

    // Determine leave info for the date
    const leaveInfo = leaveMap[date];

    // If full-day leave, disallow any hours
    if (leaveInfo?.duration === 1) {
      pushMessage('error', `Cannot enter hours on a full-day leave (${leaveInfo.leaveCategory})`);
      value = 0;
    }

    // Compute current total for the date excluding this row to enforce per-day max of 8
    const currentTotalOtherRows = rows.reduce((sum, r, idx) => {
      if (idx === rowIndex) return sum;
      return sum + (r.hours[date] ? Number(r.hours[date]) : 0);
    }, 0);

    // Allowed remaining hours for the day (per-day cap 8)
    let allowedForDay = 8 - currentTotalOtherRows;
    // If half-day leave, also cap allowed to 4
    if (leaveInfo?.duration === 0.5) {
      allowedForDay = Math.min(allowedForDay, 4);
    }
    if (allowedForDay < 0) allowedForDay = 0;

    if (value > allowedForDay) {
      if (allowedForDay === 0) {
        pushMessage('error', `No available hours can be entered for ${date}`);
      } else {
        pushMessage('error', `Total hours for ${date} cannot exceed 8. Only ${allowedForDay} hour(s) available`);
      }
      value = allowedForDay;
    }

    // Final clamp for safety: non-negative and max 8 per single cell
    if (value < 0) value = 0;
    if (value > 8) value = 8;

    setRows(prev => {
      const copy = [...prev];
      copy[rowIndex].hours[date] = Number(value);
      copy[rowIndex]._dirty = true;
      return copy;
    });
  };

  const handleTaskNameChange = (rowIndex: number, name: string) => {
    if (isLocked || loading) return;
    setRows(prev => {
      const copy = [...prev];
      copy[rowIndex].taskName = name;
      copy[rowIndex]._dirty = true;
      return copy;
    });
  };

  // 🔹 Total hours per day
  const dayTotals = useMemo(() => {
    const keys = weekDates.map(d => d.format('YYYY-MM-DD'));
    return keys.map(k =>
      rows.reduce((sum, r) => sum + (r.hours[k] ? Number(r.hours[k]) : 0), 0)
    );
  }, [rows, weekDates]);

  // 🔹 Save logic (update existing or create new)
  const saveAll = async () => {
    if (isLocked) {
      pushMessage('error', 'Cannot modify timesheet - it has already been submitted for approval');
      return;
    }
    if (loading) {
      pushMessage('info', 'Please wait while current operation completes');
      return;
    }

    try {
      setLoading(true);
      // Run validation for modified entries only
      const validation = validateForSave();
      if (!validation.ok) {
        validation.messages.forEach(m => pushMessage('error', m));
        setLoading(false);
        return;
      }

      console.debug('[TimeSheetRegister] saveAll - rows before save:', JSON.stringify(rows, null, 2));
      const toCreate: TimeSheetModel[] = [];
      const toUpdate: Record<string, TimeSheetModel> = {}; // Key by timesheetId to avoid duplicates

      // Process only modified rows or rows with existing timesheet IDs
      rows.forEach(r => {
        const isDirty = r._dirty;
        const hasTimesheetIds = r.timesheetIds && Object.keys(r.timesheetIds).length > 0;
        if (isDirty || hasTimesheetIds) {
          Object.entries(r.hours).forEach(([date, hours]) => {
            const tsId = r.timesheetIds?.[date];
            const isDateModified = isDirty && r.hours[date] !== undefined;

            // Only process modified dates or existing timesheet entries
            if ((isDateModified || tsId) && hours >= 0 && r.taskName) {
              const base: TimeSheetModel = {
                workDate: date,
                hoursWorked: hours,
                taskName: r.taskName,
                taskDescription: '',
                clientId: '',
                ...(tsId && { timesheetId: tsId }),
              };

              if (!tsId) {
                toCreate.push(base);
              } else if (isDirty) {
                toUpdate[tsId] = base;
              }
            }
          });
        }
      });

      // Check if there's anything to save
      if (toCreate.length === 0 && Object.keys(toUpdate).length === 0) {
        pushMessage('info', 'No changes to save');
        setLoading(false);
        return;
      }

      // 🟢 Create new
      if (toCreate.length > 0) {
        console.debug('[TimeSheetRegister] Creating timesheets payload:', JSON.stringify(toCreate, null, 2));
        const response = await timesheetService.createTimesheets(toCreate);
        console.debug('[TimeSheetRegister] createTimesheets response:', response);
        if (!response.flag) {
          throw new Error(response.message || 'Failed to create timesheets');
        }
        // Assume response.response is array of { timesheetId, workDate, ... }
        const created = response.response as { timesheetId: string; workDate: string; taskName: string }[];
        if (created && Array.isArray(created)) {
          created.forEach((item) => {
            if (!item.timesheetId || !item.workDate) return;
            const dateKey = item.workDate;
            const tsId = item.timesheetId;
            setRows(prev =>
              prev.map((r: TaskRow) => {
                if (r.taskName === item.taskName) {
                  return { ...r, timesheetIds: { ...(r.timesheetIds || {}), [dateKey]: tsId } };
                }
                return r;
              })
            );
          });
        }
      }

      // 🟢 Update existing
      for (const [tsId, upd] of Object.entries(toUpdate)) {
        try {
          const updateResponse = await timesheetService.updateTimesheet(tsId, upd);
          if (!updateResponse.flag) {
            console.error('Update failed for', upd, updateResponse.message);
          }
        } catch (err) {
          console.error('Update failed for', upd, err);
        }
      }

      // Clear dirty flags after successful save
      setRows(prev => prev.map(r => ({ ...r, _dirty: false })));

      // Refresh data
      await fetchData();
      console.debug('[TimeSheetRegister] rows after fetch (fresh):', JSON.stringify(rows, null, 2));
      pushMessage('success', 'Save successful');
    } catch (err) {
      console.error(err);
      pushMessage('error', 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Submit for approval (opens confirmation after validation)
  const submitForApproval = async () => {
    if (isLocked) {
      pushMessage('info', 'Timesheet already submitted for this week');
      return;
    }
    if (loading) {
      pushMessage('info', 'Please wait while current operation completes');
      return;
    }

    // Run validation before showing confirmation
    const validation = runValidation();
    if (!validation.ok) {
      validation.messages.forEach(m => pushMessage('error', m));
      return;
    }

    // All validation passed, show confirmation dialog
    setConfirmSubmitOpen(true);
  };

  const confirmSubmitYes = async () => {
    setConfirmSubmitOpen(false);
    const validation = runValidation();
    if (!validation.ok) {
      validation.messages.forEach(m => pushMessage('error', m));
      return;
    }

    try {
      setLoading(true);
      // First save all pending changes
      await saveAll();

      // Wait a moment for backend to process saves
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Re-fetch fresh data and collect IDs
      await fetchData(); // Update the UI state first

      const ids: string[] = [];
      rows.forEach(r => {
        Object.entries(r.timesheetIds || {}).forEach(([date, id]) => {
          if (id && r.hours[date] > 0) {
            console.debug(`[TimeSheetRegister] Processing row for submit - date: ${date}, hours: ${r.hours[date]}, id: ${id}`);
            ids.push(id);
          }
        });
      });
      console.debug('[TimeSheetRegister] IDs collected for submit:', ids);

      if (ids.length === 0) {
        pushMessage('error', 'No valid timesheet entries to submit. Ensure all workdays have hours.');
        return;
      }

      // Submit all timesheets for approval
      const submitResponse = await timesheetService.submitForApproval(ids);
      if (!submitResponse.flag) {
        throw new Error(submitResponse.message || 'Failed to submit for approval');
      }

      // Lock the timesheet and update UI
      setIsLocked(true);
      pushMessage('success', `Timesheet submitted for approval. Week of ${weekStart.format('MMM D, YYYY')} is now locked.`);

      // Refresh data to get updated status
      await fetchData();

      // Re-validate lock state from fresh data
      const refreshedData = await timesheetService.getAllTimesheets({
        startDate: weekStart.format('YYYY-MM-DD'),
        endDate: weekStart.clone().add(6, 'day').format('YYYY-MM-DD'),
      });

      if (refreshedData.response?.some(item => item.status === 'Submitted')) {
        setIsLocked(true);
      }
    } catch (err) {
      console.error('submit failed', err);
      pushMessage('error', 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  const confirmSubmitNo = () => setConfirmSubmitOpen(false);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Spinner className="h-8 w-8 text-blue-600" />
          <div className="text-sm text-gray-600">Loading timesheet data...</div>
        </div>
      </div>
    );
  }

  // (removed) helper merged into other checks

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Calendar/Date Picker Section */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Select Week</h2>
          <div className="flex items-center space-x-2">
            <ChevronLeft
              className="cursor-pointer text-gray-600 hover:text-gray-800"
              size={24}
              onClick={() => setWeekStart(prev => prev.subtract(1, 'week'))}
            />
            <ChevronRight
              className="cursor-pointer text-gray-600 hover:text-gray-800"
              size={24}
              onClick={() => setWeekStart(prev => prev.add(1, 'week'))}
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar size={20} className="text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            Week: {weekStart.format('MMM D')} - {weekStart.clone().add(6, 'day').format('MMM D, YYYY')}
          </div>
        </div>
      </div>

      {/* Messages Panel */}
      <div className="mb-4 space-y-2">
        {messages.map(m => (
          <div key={m.id} className={`p-3 rounded-lg shadow-sm ${
            m.type === 'success' ? 'bg-green-50 border-l-4 border-green-400 text-green-800' :
            m.type === 'error' ? 'bg-red-50 border-l-4 border-red-400 text-red-800' :
            'bg-blue-50 border-l-4 border-blue-400 text-blue-800'
          }`}>
            {m.text}
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Task
                  <button onClick={addRow} disabled={isLocked || loading} className="ml-2 p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50">
                    <Plus size={14} />
                  </button>
                </th>
                {weekDates.map(d => {
                  const key = d.format('YYYY-MM-DD');
                  const isHoliday = holidayMap[key];
                  const isLeave = leaveMap[key];
                  const weekday = d.day();
                  const isWeekend = weekday === 0 || weekday === 6;
                  let statusText = '';
                  let statusClass = '';
                  if (isHoliday) {
                    statusText = isHoliday.holidayName;
                    statusClass = 'text-amber-600 bg-amber-50';
                  } else if (isLeave) {
                    statusText = isLeave.leaveCategory;
                    statusClass = 'text-blue-600 bg-blue-50';
                  } else if (isWeekend) {
                    statusText = 'Weekend';
                    statusClass = 'text-gray-600 bg-gray-100';
                  }
                  return (
                    <th key={key} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      <div className="font-semibold text-gray-900">{d.format('DD ddd')}</div>
                      {statusText && (
                        <div className={`mt-1 px-2 py-1 rounded-full text-xs ${statusClass}`}>
                          {statusText}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, rowIndex) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => deleteRow(rowIndex)}
                        disabled={isLocked || deletingRowIndex !== null || loading}
                        className="p-1 rounded-full text-red-500 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        value={row.taskName}
                        placeholder="Task name"
                        onChange={e => {
                          if (isLocked || loading) {
                            pushMessage('info', 'Cannot modify timesheet - it has been submitted for approval');
                            return;
                          }
                          handleTaskNameChange(rowIndex, e.target.value);
                        }}
                        disabled={isLocked || loading}
                      />
                    </div>
                  </td>
                  {weekDates.map(d => {
                    const key = d.format('YYYY-MM-DD');
                    const isHoliday = holidayMap[key];
                    const isLeave = leaveMap[key];
                    
                    // Allow weekend entries, only disable for holidays, full-day leaves, or when locked
                    const disabled = isLocked || loading || !!isHoliday || (isLeave?.duration === 1);
                    // Per-day cap is 8 hours; half-day leaves cap to 4
                    const maxHours = Math.min(isLeave?.duration === 0.5 ? 4 : 24, 8);
                    return (
                      <td key={key} className="px-3 py-4 whitespace-nowrap text-center border-r border-gray-200">
                        <input
                          type="number"
                          min="0"
                          max={String(maxHours)}
                          step="0.5"
                          className="w-16 px-2 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={row.hours[key] ?? 0}
                          disabled={disabled}
                          onChange={e => {
                            if (isLocked || loading) {
                              pushMessage('info', 'Cannot modify timesheet - it has been submitted for approval');
                              return;
                            }
                            const newValue = Number(e.target.value);
                            // Delegate full validation/clamping to handleChange
                            handleChange(rowIndex, key, newValue);
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900 border-r border-gray-200">
                  Total Hours
                </td>
                {dayTotals.map((t, i) => (
                  <td key={i} className="px-3 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-200">
                    {t.toFixed(1)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Fixed Bottom Right Buttons */}
      <div className="fixed bottom-6 right-6 space-x-3 z-40">
        <button
          onClick={saveAll}
          disabled={loading || isLocked}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
        <button
          onClick={submitForApproval}
          disabled={loading || isLocked}
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit for Approval
        </button>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete.open && confirmDelete.rowIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Trash2 className="text-red-500 mr-2" size={20} />
              Confirm Delete
            </div>
            <div className="text-gray-600 mb-6">Are you sure you want to delete this row? This will remove all associated timesheet entries from the server.</div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setConfirmDelete({ open: false, rowIndex: null })}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={deletingRowIndex !== null}
                onClick={async () => {
                  const idx = confirmDelete.rowIndex!;
                  const row = rows[idx];
                  if (!row) {
                    setConfirmDelete({ open: false, rowIndex: null });
                    return;
                  }
                  setDeletingRowIndex(idx); // Show loading
                  try {
                    // Optimistic local delete first
                    setRows(prev => prev.filter((_, i) => i !== idx));

                    const ids = Object.values(row.timesheetIds || {}).filter(Boolean) as string[];
                    let hadBackendData = false;
                    for (const id of ids) {
                      const deleteResponse = await timesheetService.deleteTimesheet(id);
                      if (!deleteResponse.flag) {
                        console.error('Delete failed for', id, deleteResponse.message);
                      } else {
                        hadBackendData = true;
                      }
                    }

                    if (hadBackendData) {
                      // Only refetch if we deleted backend data (preserves unsaved rows)
                      await fetchData();
                    }

                    const message = ids.length > 0 ? 'Row and entries deleted successfully' : 'Unsaved row deleted';
                    pushMessage('success', message);
                  } catch (err) {
                    console.error('delete failed', err);
                    // Rollback optimistic delete on error
                    setRows(prev => [...prev, row]);
                    pushMessage('error', 'Delete failed - changes rolled back');
                  } finally {
                    setDeletingRowIndex(null);
                    setConfirmDelete({ open: false, rowIndex: null });
                  }
                }}
              >
                {deletingRowIndex !== null ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Submit Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-xl font-semibold text-gray-900 mb-4">Submit for Approval</div>
            <div className="text-gray-600 mb-6">Are you sure you want to submit this timesheet for manager approval? This action cannot be undone until approved or rejected.</div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={confirmSubmitNo}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                onClick={confirmSubmitYes}
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSheetRegister;