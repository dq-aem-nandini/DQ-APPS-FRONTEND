'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { leaveService } from '@/lib/api/leaveService';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
import { Plus, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmployeeLeaveDayDTO, TimeSheetResponseDto, TimeSheetModel, HolidaysDTO } from '@/lib/api/types';
import { holidayService } from '@/lib/api/holidayService';
import { timesheetService } from '@/lib/api/timeSheetService';
import Spinner from '@/components/ui/Spinner';
import { employeeService } from '@/lib/api/employeeService';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekday);
dayjs.extend(isoWeek);

// Add this line — makes Monday the first day of week globally
dayjs.Ls.en.weekStart = 1;

interface TaskRow {
id: string;
taskName: string;
hours: Record<string, number>;
timesheetIds?: Record<string, string>;
statuses?: Record<string, 'DRAFTED' | 'PENDING' | 'APPROVED' | 'REJECTED'>;
_dirty?: boolean;
order?: number;
}

  const TimeSheetRegister: React.FC = () => {
    // TESTING: Remove in production
  // const TEST_TODAY = '2025-10-3'; 
  // const now = TEST_TODAY ? dayjs(TEST_TODAY) : dayjs();
  // const todayKey = now.format('YYYY-MM-DD');

  const todayKey = dayjs().format('YYYY-MM-DD');
  const now = dayjs();
  const currentMonday = now.startOf('isoWeek');
  const { state } = useAuth();
  const [joiningDate, setJoiningDate] = useState<dayjs.Dayjs | null>(null);
  const [dojLoading, setDojLoading] = useState(true);

  const [weekStart, setWeekStart] = useState(() => dayjs().startOf('isoWeek')); // Monday
  const [weekStatus, setWeekStatus] = useState<'DRAFTED' | 'APPROVED' | 'PENDING' | 'REJECTED' | ''>('');
  // const [selectedDate, setSelectedDate] = useState(weekStart.format('YYYY-MM-DD'));
  const [selectedSubmitDate, setSelectedSubmitDate] = useState<string | null>(null);

  const [rows, setRows] = useState<TaskRow[]>([]);
  const [holidayMap, setHolidayMap] = useState<Record<string, HolidaysDTO>>({});
  const [leaveMap, setLeaveMap] = useState<Record<string, { leaveCategory: string; duration: number }>>({});
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<{ id: string; type: 'success' | 'error' | 'info'; text: string }[]>([]);
  const pushMessage = (type: 'success' | 'error' | 'info', text: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setMessages(prev => [...prev, { id, type, text }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 6000);
  };

  const [employeeDetails, setEmployeeDetails] = useState<{
    clientName?: string;
    reportingManagerName?: string;
    designation?: string;
  } | null>(null);
  const [managerComment, setManagerComment] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; rowIndex: number | null }>({ open: false, rowIndex: null });
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);

  const currentYear = weekStart.format('YYYY');
  const weekDates = useMemo(() => Array.from({ length: 7 }).map((_, i) => weekStart.add(i, 'day')), [weekStart]);

  const isSplitWeek = useMemo(() => {
    const months = new Set(weekDates.map(d => d.format('YYYY-MM')));
    return months.size > 1;
  }, [weekDates]);

 // Allow any date >= actual Date of Joining
  const minSelectableDate = joiningDate; // ← This is correct!

  // Still keep this for week navigation logic (to block previous full weeks)
 const firstAllowedMonday = useMemo(() => {
    if (!joiningDate) return null;
    return joiningDate.startOf('isoWeek'); // ← CORRECT: Monday of DOJ week
  }, [joiningDate]);

  // PER-DAY LOCKING LOGIC
  const isDayLocked = useCallback((dateKey: string) => {
    return rows.some(row => {
      const status = row.statuses?.[dateKey];
      return status === 'PENDING' || status === 'APPROVED';
    });
  }, [rows]);

  const isRowLocked = useCallback((row: TaskRow) => {
    return Object.values(row.statuses || {}).some(
      status => status === 'PENDING' || status === 'APPROVED'
    );
  }, []);

  const hasEditableDay = useMemo(() => {
    return weekDates.some(d => {
      const key = d.format('YYYY-MM-DD');
      const isHoliday = !!holidayMap[key];
      const isLeave = leaveMap[key];
      const isPreDOJ = joiningDate && d.isBefore(joiningDate, 'day');
      return !isDayLocked(key) && !isHoliday && !(isLeave?.duration === 1) && !isPreDOJ;
    });
  }, [weekDates, holidayMap, leaveMap, joiningDate, isDayLocked]);

  const hasUnsubmittedChanges = useMemo(() => {
    return rows.some(row => {
      const hasTask = !!row.taskName?.trim();
      const hasHours = Object.values(row.hours).some(h => Number(h) > 0);
      return row._dirty || (hasTask && hasHours);
    });
  }, [rows]);

  // Keep displayDate in sync with weekStart (always show Monday in input)
  useEffect(() => {
    if (weekStart) {
      setDisplayDate(weekStart.format('YYYY-MM-DD'));
    }
  }, [weekStart]);

  const [displayDate, setDisplayDate] = useState<string>(''); // New state for input display

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
  
    const date = dayjs(value);
    if (!date.isValid()) return;
  
    // Block dates before actual joining date
    if (joiningDate && date.isBefore(joiningDate, 'day')) {
      pushMessage('info', 'Cannot select date before your joining date');
      return;
    }
  
    // Block future weeks
    const selectedMonday = date.startOf('isoWeek');
    if (selectedMonday.isAfter(currentMonday, 'week')) {
      pushMessage('info', 'Cannot select future weeks');
      return;
    }
  
    // If selected date is in a previous week but after DOJ → still allow
    setWeekStart(selectedMonday);
    setDisplayDate(value);
    // setSelectedDate(selectedMonday.format('YYYY-MM-DD'));
    setSelectedSubmitDate(null);
  };

  useEffect(() => {
    const fetchDOJ = async () => {
      try {
        setDojLoading(true);
        const employee = await employeeService.getEmployeeById();
        if (employee.dateOfJoining) setJoiningDate(dayjs(employee.dateOfJoining));
        setEmployeeDetails({
          clientName: employee.clientName,
          reportingManagerName: employee.reportingManagerName,
          designation: employee.designation,
        });
      } catch (err) {
        pushMessage('error', 'Could not load joining date');
      } finally {
        setDojLoading(false);
      }
    };
    fetchDOJ();
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const response = await holidayService.getAllHolidays();
      if (!response.flag || !response.response) return;
  
      const map: Record<string, HolidaysDTO> = {};
      
      response.response.forEach((h: HolidaysDTO) => {
        map[dayjs(h.holidayDate).format('YYYY-MM-DD')] = h;
      });
  
      setHolidayMap(map);
    } catch (err) {
      pushMessage('error', 'Failed to fetch holidays');
    }
  }, []);
  

  const fetchLeaves = useCallback(async (year: string) => {
    try {
      const leaves: EmployeeLeaveDayDTO[] = await leaveService.getApprovedLeaves(year);
      const map: Record<string, { leaveCategory: string; duration: number }> = {};
      leaves.forEach(l => {
        map[dayjs(l.date).format('YYYY-MM-DD')] = {
          leaveCategory: l.leaveCategory,
          duration: l.duration ?? 1,
        };
      });
      setLeaveMap(map);
    } catch (err) {
      pushMessage('error', 'Failed to fetch leaves');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        startDate: weekStart.format('YYYY-MM-DD'),
        endDate: weekStart.clone().add(6, 'day').format('YYYY-MM-DD'),
      };

      const response = await timesheetService.getAllTimesheets(params);
      if (!response.flag || !response.response) throw new Error(response.message || 'Failed');

      const list: TimeSheetResponseDto[] = response.response.filter(entry =>
        dayjs(entry.workDate).isBetween(weekStart, weekStart.clone().add(6, 'day'), 'day', '[]')
      );

      const statuses = list.map(i => i.status).filter(Boolean);
      const status = statuses.includes('APPROVED') ? 'APPROVED' :
                     statuses.includes('PENDING') ? 'PENDING' :
                     statuses.includes('REJECTED') ? 'REJECTED' :
                     statuses.includes('DRAFTED') ? 'DRAFTED' : 'DRAFTED';
      setWeekStatus(status);

      const comment = list.find(i => i.managerComment)?.managerComment || null;
      setManagerComment(comment);
      // Collect all entries with createdAt timestamp
      const entriesWithMeta = list.map(item => ({
        ...item,
        dateKey: dayjs(item.workDate).format('YYYY-MM-DD'),
      }));

      // Sort by createdAt to determine original insertion order
      entriesWithMeta.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      const grouped = new Map<string, TaskRow>(); // Use Map to preserve insertion order
      let orderCounter = 0;

      entriesWithMeta.forEach(item => {
        const task = item.taskName || 'Untitled';
        if (!grouped.has(task)) {
          grouped.set(task, {
            id: task + '_' + (item.timesheetId?.slice(0, 8) || Date.now().toString()),
            taskName: task,
            hours: {},
            timesheetIds: {},
            statuses: {},
            order: orderCounter++, // ← assign stable order
          });
        }

        const row = grouped.get(task)!;
        row.hours[item.dateKey] = Number(item.workedHours || 0);
        if (item.timesheetId) {
          row.timesheetIds![item.dateKey] = item.timesheetId;
          row.statuses![item.dateKey] = (item.status as any) || 'DRAFT';
        }
      });

      // Convert Map → Array (preserves insertion order!)
      let finalRows = Array.from(grouped.values());

      // If no data → add empty row
      if (finalRows.length === 0) {
        finalRows = [{
          id: 'row0',
          taskName: '',
          hours: Object.fromEntries(weekDates.map(d => [d.format('YYYY-MM-DD'), 0])),
          statuses: {},
          order: 0,
        }];
      }

      // FINAL: Sort by `order` field to guarantee consistent ordering
      finalRows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      setRows(finalRows);
    } catch (err) {
      pushMessage('error', 'Failed to fetch timesheets');
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekDates]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchData(), fetchHolidays(), fetchLeaves(currentYear)]);
      setLoading(false);
    };
    load();
  }, [fetchData, fetchHolidays, fetchLeaves, currentYear]);

  // VALIDATIONS
  const runValidationForDates = (dates: string[]): { ok: boolean; messages: string[] } => {
    const msgs: string[] = [];
    const dateHours: Record<string, number> = {};

    rows.forEach((r, ri) => {
      const hasHours = dates.some(d => Number(r.hours[d]) > 0);
      if (hasHours && (!r.taskName || r.taskName.trim() === '')) {
        msgs.push(`Row ${ri + 1}: Task name required`);
      }

      dates.forEach(date => {
        const h = Number(r.hours[date] || 0);
        dateHours[date] = (dateHours[date] || 0) + h;
        if (h < 0) msgs.push(`Negative hours on ${date}`);
        if (h > 8) msgs.push(`Hours exceed 8 on ${date}`);
        if (holidayMap[date] && h > 0) msgs.push(`Holiday entry on ${date}`);
        const leave = leaveMap[date];
        if (leave?.duration === 1 && h > 0) msgs.push(`Full-day leave conflict on ${date}`);
      });
    });

    dates.forEach(date => {
      const total = dateHours[date] || 0;
      const day = dayjs(date);
      const isWeekend = day.day() === 0 || day.day() === 6;
      const isHoliday = !!holidayMap[date];
      const leave = leaveMap[date];

      if (!isWeekend && !isHoliday && !leave && total === 0) {
        msgs.push(`No hours entered for workday ${date}`);
      }
      if (total > 8) msgs.push(`Total exceeds 8 hours on ${date}`);
    });

    return { ok: msgs.length === 0, messages: msgs };
  };

  const validateForSave = (): { ok: boolean; messages: string[] } => {
    const msgs: string[] = [];
    const dateHours: Record<string, number> = {};

    rows.forEach((r, ri) => {
      const anyHours = Object.values(r.hours).some(h => Number(h) > 0);
      if (anyHours && (!r.taskName || r.taskName.trim() === '')) {
        msgs.push(`Row ${ri + 1}: Task name required`);
      }

      Object.entries(r.hours).forEach(([date, hours]) => {
        const h = Number(hours);
        if (h > 0 && !isDayLocked(date)) {
          dateHours[date] = (dateHours[date] || 0) + h;
          if (h > 8) msgs.push(`Hours exceed 8 on ${date}`);
          if (holidayMap[date] && h > 0) msgs.push(`Holiday entry on ${date}`);
          const leave = leaveMap[date];
          if (leave?.duration === 1 && h > 0) msgs.push(`Full-day leave conflict on ${date}`);
        }
      });
    });

    Object.entries(dateHours).forEach(([date, total]) => {
      if (total > 8) msgs.push(`Total exceeds 8 hours on ${date}`);
    });

    return { ok: msgs.length === 0, messages: msgs };
  };

  const runValidation = (): { ok: boolean; messages: string[] } => {
    return runValidationForDates(weekDates.map(d => d.format('YYYY-MM-DD')));
  };

  const addRow = () => {
    if (loading || !hasEditableDay) return;
    const id = 'r' + Date.now();
    const hours = Object.fromEntries(weekDates.map(d => [d.format('YYYY-MM-DD'), 0]));
    const newOrder = rows.length > 0 ? Math.max(...rows.map(r => r.order || 0)) + 1 : 0;
  
    setRows(prev => [...prev, { 
      id, 
      taskName: '', 
      hours,
      order: newOrder  // ← assign order
    }]);
  };

  const deleteRow = (index: number) => {
    if (loading || !hasEditableDay) return;
    setConfirmDelete({ open: true, rowIndex: index });
  };

  const handleChange = (rowIndex: number, date: string, value: number) => {
    if (loading || isDayLocked(date)) return;

    const leaveInfo = leaveMap[date];
    if (leaveInfo?.duration === 1) {
      pushMessage('error', `Cannot enter hours on full-day leave`);
      return;
    }

    const currentTotalOther = rows.reduce((sum, r, i) => {
      if (i === rowIndex) return sum;
      return sum + (Number(r.hours[date]) || 0);
    }, 0);

    let maxAllowed = 8 - currentTotalOther;
    if (leaveInfo?.duration === 0.5) maxAllowed = Math.min(maxAllowed, 4 - currentTotalOther);
    if (maxAllowed < 0) maxAllowed = 0;

    if (value > maxAllowed) {
      pushMessage('error', leaveInfo?.duration === 0.5
        ? `Half-day leave: max 4h total. Only ${maxAllowed}h left.`
        : `Day cap 8h. Only ${maxAllowed}h left.`);
      value = maxAllowed;
    }

    value = Math.max(0, Math.min(value, 8));

    setRows(prev => {
      const copy = [...prev];
      copy[rowIndex].hours[date] = value;
      copy[rowIndex]._dirty = true;
      return copy;
    });
  };

  const handleTaskNameChange = (rowIndex: number, name: string) => {
    if (loading || !hasEditableDay) return;
    setRows(prev => {
      const copy = [...prev];
      copy[rowIndex].taskName = name;
      copy[rowIndex]._dirty = true;
      return copy;
    });
  };

  const dayTotals = useMemo(() => {
    return weekDates.map(d => {
      const date = d.format('YYYY-MM-DD');
      return rows.reduce((sum, r) => sum + (Number(r.hours[date]) || 0), 0);
    });
  }, [rows, weekDates]);

  const areAllRequiredDaysFilled = useMemo(() => {
    return weekDates.every(d => {
      const dateKey = d.format('YYYY-MM-DD');
      const totalHours = dayTotals[weekDates.findIndex(wd => wd.format('YYYY-MM-DD') === dateKey)] || 0;
  
      const isWeekend = d.day() === 0 || d.day() === 6;
      const isHoliday = !!holidayMap[dateKey];
      const leave = leaveMap[dateKey];
      const isFullLeave = leave?.duration === 1;
  
      // If it's weekend, holiday, or full-day leave → no hours required
      if (isWeekend || isHoliday || isFullLeave) {
        return true;
      }
  
      // Otherwise: must have > 0 hours
      return totalHours > 0;
    });
  }, [weekDates, dayTotals, holidayMap, leaveMap]);

  const totalWeekHours = useMemo(() => dayTotals.reduce((a, b) => a + b, 0), [dayTotals]);

  const splitWeekInfo = useMemo(() => {
    if (!isSplitWeek) return null;
  
    const months = [...new Set(weekDates.map(d => d.format('YYYY-MM')))];
    const [firstMonth, secondMonth] = months;
  
    const firstMonthDays = weekDates.filter(d => d.format('YYYY-MM') === firstMonth);
    const lastDayOfFirstMonth = firstMonthDays[firstMonthDays.length - 1];
  
    // Find the last weekday (Mon–Fri) in the week
    const lastWeekday = [...weekDates]
      .reverse()
      .find(d => d.day() >= 1 && d.day() <= 5); // Mon=1, Fri=5
  
    const lastDayOfWeek = weekDates[weekDates.length - 1]; // Sunday
  
    // Check if there is ANY work (hours > 0) in the second month (Oct 1–5)
    const hasAnyWorkInSecondMonth = weekDates.some(d => {
      const key = d.format('YYYY-MM-DD');
      if (d.format('YYYY-MM') !== secondMonth) return false;
      
      // CRITICAL: Allow submission if ANY day in second month has hours
      // EVEN if some days are already submitted (PENDING)
      const totalHours = rows.reduce((sum, r) => sum + (Number(r.hours[key]) || 0), 0);
      return totalHours > 0;
    });
  
    // FINAL RULE:
    // If user worked ANY day in October (even Sat/Sun) → allow submit from last weekday (Fri) to Sunday
    const secondMonthSubmitDate = hasAnyWorkInSecondMonth
      ? (lastWeekday ? lastWeekday.format('YYYY-MM-DD') : lastDayOfWeek.format('YYYY-MM-DD'))
      : null;
  
    // For display: the range user can submit
    const secondMonthSubmitFrom = lastWeekday ? lastWeekday.format('YYYY-MM-DD') : null;
    const secondMonthSubmitTo = lastDayOfWeek.format('YYYY-MM-DD');
  
    return {
      firstMonth,
      secondMonth,
      lastDayOfFirstMonth,
      firstMonthEndDate: lastDayOfFirstMonth.format('YYYY-MM-DD'),
      secondMonthSubmitDate,        // actual date when submit is allowed
      secondMonthSubmitFrom,        // for UI message: "from Oct 3"
      secondMonthSubmitTo,          // for UI message: "until Oct 5"
      hasAnyWorkInSecondMonth,
    };
  }, [isSplitWeek, weekDates, rows, isDayLocked]);

  const saveAll = async () => {
    if (loading || !hasUnsubmittedChanges || !hasEditableDay) return;
  
    const validation = validateForSave();
    if (!validation.ok) {
      validation.messages.forEach(m => pushMessage('error', m));
      return;
    }
  
    try {
      setLoading(true);
      const toCreate: TimeSheetModel[] = [];
      const toUpdate: Record<string, TimeSheetModel> = {};
  
      rows.forEach(r => {
        const isDirty = r._dirty;
        const hasTimesheetIds = r.timesheetIds && Object.keys(r.timesheetIds).length > 0;
        if (isDirty || hasTimesheetIds) {
          Object.entries(r.hours).forEach(([date, hours]) => {
            const tsId = r.timesheetIds?.[date];
            const hrs = Number(hours);
  
            // CREATE new entry
            if (!tsId && hrs > 0 && r.taskName?.trim()) {
              toCreate.push({
                workDate: date,
                hoursWorked: hrs,
                taskName: r.taskName,
                taskDescription: '',
                clientId: '',
              });
            }
  
            // UPDATE existing (including setting to 0)
            if (tsId && (r._dirty || hrs === 0)) {
              toUpdate[tsId] = {
                workDate: date,
                hoursWorked: hrs,
                taskName: r.taskName,
                taskDescription: '',
                clientId: '',
                timesheetId: tsId,
              };
            }
          });
        }
      });
  
      // === CREATE NEW TIMESHEETS ===
      if (toCreate.length > 0) {
        const res = await timesheetService.createTimesheets(toCreate);
  
        if (res.flag && Array.isArray(res.response)) {
          // We will collect all newly created items first
          const newItems = res.response as any[];
  
          setRows(prev => {
            const rowMap = new Map<string, TaskRow>();
  
            // Build map: taskName → row (preserve current order)
            prev.forEach(row => {
              if (row.taskName) rowMap.set(row.taskName, row);
            });
  
            // Add/update with new timesheet IDs
            newItems.forEach(item => {
              const dateKey = item.workDate;
              const tsId = item.timesheetId;
              const taskName = item.taskName;
  
              if (rowMap.has(taskName)) {
                const row = rowMap.get(taskName)!;
                row.timesheetIds = { ...(row.timesheetIds || {}), [dateKey]: tsId };
                row.hours[dateKey] = Number(item.workedHours || 0);
              } else {
                // Brand new task → append at the end (correct order)
                const maxOrder = Math.max(0, ...prev.map(r => r.order ?? 0));
                rowMap.set(taskName, {
                  id: 'new_' + tsId,
                  taskName,
                  hours: { [dateKey]: Number(item.workedHours || 0) },
                  timesheetIds: { [dateKey]: tsId },
                  statuses: { [dateKey]: 'DRAFTED' },
                  order: maxOrder + 1,
                });
              }
            });
  
            // Convert back to array and sort by order
            const updatedRows = Array.from(rowMap.values());
            return updatedRows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          });
        }
      }
  
      // === UPDATE EXISTING ===
      for (const [id, data] of Object.entries(toUpdate)) {
        await timesheetService.updateTimesheet(id, data);
      }
  
      // Clear dirty flags
      setRows(prev => prev.map(r => ({ ...r, _dirty: false })));
  
      // Re-fetch to get final state + correct order from createdAt
      await fetchData();
  
      pushMessage('success', 'Changes saved');
    } catch (err) {
      console.error(err);
      pushMessage('error', 'Save failed');
    } finally {
      setLoading(false);
    }
  };


  const handleConfirmSubmit = async () => {
    setConfirmSubmitOpen(false);
  
    let idsToSubmit: string[] = [];
  
    if (!isSplitWeek) {
      // Normal week
      rows.forEach(r => {
        Object.entries(r.timesheetIds || {}).forEach(([date, id]) => {
          if (id && !isDayLocked(date)) idsToSubmit.push(id);
        });
      });
    } else if (splitWeekInfo) {
      
      let targetDates: string[] = [];

      // Check if first-month dates are still unsubmitted (missed submission)
        const hasUnsubmittedFirstMonth = weekDates.some(d => {
          if (d.format('YYYY-MM') !== splitWeekInfo.firstMonth) return false;

          const dateKey = d.format('YYYY-MM-DD');

          return rows.some(r => {
            const id = r.timesheetIds?.[dateKey];
            const status = r.statuses?.[dateKey]; // assuming you track status
            return id && status === 'DRAFTED';
          });
        });

  
      if (todayKey === splitWeekInfo.firstMonthEndDate) {
        targetDates = weekDates.filter(d => d.format('YYYY-MM') === splitWeekInfo.firstMonth).map(d => d.format('YYYY-MM-DD'));
      } else if (
        splitWeekInfo.secondMonthSubmitFrom && 
        todayKey >= splitWeekInfo.secondMonthSubmitFrom
      ) {
        targetDates = weekDates
        .filter(d => {
          const month = d.format('YYYY-MM');
          const dateKey = d.format('YYYY-MM-DD');

          // Always include second month
          if (month === splitWeekInfo.secondMonth) return true;

          // Include first month ONLY if it was never submitted
          if (
            month === splitWeekInfo.firstMonth &&
            hasUnsubmittedFirstMonth
          ) return true;

          return false;
        })
        .map(d => d.format('YYYY-MM-DD'));
          }
  
      rows.forEach(r => {
        targetDates.forEach(date => {
          const id = r.timesheetIds?.[date];
          if (id && !isDayLocked(date)) idsToSubmit.push(id);
        });
      });
    }
  
    if (idsToSubmit.length === 0) {
      pushMessage('error', 'No entries to submit');
      return;
    }
  
    try {
      setLoading(true);
      const res = await timesheetService.submitForApproval(idsToSubmit);
      if (!res.flag) throw new Error(res.message);
      pushMessage('success', 'Timesheet submitted successfully!');
      await fetchData();
    } catch (err: any) {
      pushMessage('error', err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && rows.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-3">
          <Spinner className="h-10 w-10 text-blue-600" />
          <div className="text-gray-600">Loading timesheet...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* === FULL JSX WITH PER-DAY LOCKING === */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="mb-4"><h2 className="text-xl font-semibold text-gray-800">Select Week</h2></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {/* <Calendar size={20} className="text-gray-500" /> */}
                <input
                  type="date"
                  value={displayDate}
                  min={joiningDate?.format('YYYY-MM-DD')}           // ← NOW uses actual DOJ
                  max={currentMonday.add(6, 'day').format('YYYY-MM-DD')} // Sunday of current week
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                Week: {weekStart.format('MMM D')} - {weekStart.clone().add(6, 'day').format('MMM D, YYYY')}
              </div>
            </div>
            <div className="flex items-center space-x-2">
            <ChevronLeft
              className={`cursor-pointer text-gray-600 hover:text-gray-800 transition-colors ${
                firstAllowedMonday && weekStart.clone().subtract(1, 'week').isBefore(firstAllowedMonday, 'day')
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              size={24}
              onClick={() => {
                const nextWeek = weekStart.clone().subtract(1, 'week');
                if (firstAllowedMonday && nextWeek.isBefore(firstAllowedMonday, 'day')) {
                  pushMessage('info', 'Cannot go before your joining week');
                  return;
                }
                setWeekStart(prev => prev.subtract(1, 'week'));
              }}
            />
        <ChevronRight
          className={`cursor-pointer text-gray-600 hover:text-gray-800 ${
            weekStart.isSameOrAfter(currentMonday, 'week') 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
          size={24}
          onClick={() => {
            if (weekStart.clone().add(1, 'week').isAfter(currentMonday, 'week')) {
              pushMessage('info', 'Cannot navigate to future weeks');
              return;
            }
            setWeekStart(prev => prev.add(1, 'week'));
          }}
        />
      </div>
          </div>
          {employeeDetails && (
            <div className="w-full md:w-auto p-4 bg-gradient-to-b from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm text-sm">
              <div className="space-y-2">
                <div className="flex items-center"><span className="font-medium text-gray-600">Client:</span><span className="font-semibold text-gray-800 ml-3">{employeeDetails.clientName || '—'}</span></div>
                <div className="flex items-center border-t border-blue-100 pt-2"><span className="font-medium text-gray-600">Manager:</span><span className="font-semibold text-gray-800 ml-3">{employeeDetails.reportingManagerName || '—'}</span></div>
                <div className="flex items-center border-t border-blue-100 pt-2"><span className="font-medium text-gray-600">Role:</span><span className="font-semibold text-gray-800 ml-3">
                  {employeeDetails.designation ? employeeDetails.designation.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : '—'}
                </span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {weekStatus && (
        <div className={`mb-4 p-4 rounded-lg font-medium border shadow-sm ${weekStatus === 'DRAFTED' ? 'bg-gray-50 text-gray-700 border-gray-300' : weekStatus === 'PENDING' ? 'bg-orange-50 text-orange-800 border-orange-300' : weekStatus === 'APPROVED' ? 'bg-green-50 text-green-800 border-green-300' : weekStatus === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-300' : 'bg-blue-50 text-blue-800 border-blue-300'}`}>
          <div className="flex items-center justify-between">
            <div><span className="text-sm">Timesheet Status:</span> <strong className="text-base">{weekStatus}</strong></div>
            {managerComment && <div className="text-right"><span className="text-xs block text-gray-600">Manager Comment:</span><span className="text-sm font-medium">{managerComment}</span></div>}
          </div>
        </div>
      )}

      <div className="mb-4 space-y-2">
        {messages.map(m => (
          <div key={m.id} className={`p-3 rounded-lg shadow-sm ${m.type === 'success' ? 'bg-green-50 border-l-4 border-green-400 text-green-800' : m.type === 'error' ? 'bg-red-50 border-l-4 border-red-400 text-red-800' : 'bg-blue-50 border-l-4 border-blue-400 text-blue-800'}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Task
                  <button onClick={addRow} disabled={loading || !hasEditableDay} className="ml-2 p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50">
                    <Plus size={14} />
                  </button>
                </th>
                {weekDates.map(d => {
                  const key = d.format('YYYY-MM-DD');
                  const isHoliday = holidayMap[key];
                  const isLeave = leaveMap[key];
                  const isWeekend = d.day() === 0 || d.day() === 6;
                  let text = ''; let cls = '';
                  if (isHoliday) { text = isHoliday.holidayName; cls = 'text-amber-600 bg-amber-50'; }
                  else if (isLeave) { text = isLeave.leaveCategory; cls = 'text-blue-600 bg-blue-50'; }
                  else if (isWeekend) { text = 'Weekend'; cls = 'text-gray-600 bg-gray-100'; }
                  return (
                    <th key={key} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      <div className="font-semibold text-gray-900">{d.format('DD ddd')}</div>
                      {text && <div className={`mt-1 px-2 py-1 rounded-full text-xs ${cls}`}>{text}</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => {
              const rowLocked = isRowLocked(row); // Check if any day in this row is submitted
              return (
                <tr 
                  key={row.id} 
                  className={`hover:bg-gray-50 transition-colors ${rowLocked ? 'bg-gray-50 opacity-90' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => deleteRow(rowIndex)}
                        disabled={loading || !hasEditableDay || rowLocked}
                        className="p-1 rounded-full text-red-500 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={rowLocked ? "Cannot delete: row contains submitted entries" : "Delete row"}
                      >
                        <Trash2 size={16} />
                      </button>

                      <input
                        type="text"
                        value={row.taskName}
                        placeholder="Task name"
                        onChange={e => handleTaskNameChange(rowIndex, e.target.value)}
                        disabled={loading || !hasEditableDay || rowLocked}
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all
                          ${rowLocked
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300'
                            : 'border-gray-300 focus:ring-blue-500 hover:border-gray-400'
                          }`}
                        title={rowLocked ? "Task name locked — entries already submitted" : ""}
                      />
                    </div>
                  </td>

                  {/* The rest of your <td> cells for hours remain unchanged */}
                  {weekDates.map(d => {
                    const key = d.format('YYYY-MM-DD');
                    const isPreDOJ = joiningDate && d.isBefore(joiningDate, 'day');
                    const isHoliday = !!holidayMap[key];
                    const isLeave = leaveMap[key];
                    const disabled = loading || isHoliday || (isLeave?.duration === 1) || isPreDOJ || isDayLocked(key);
                    const maxHours = isLeave?.duration === 0.5 ? 4 : 8;

                    return (
                      <td
                        key={key}
                        className="px-3 py-4 text-center border-r border-gray-200 relative transition-all"
                      >
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={String(maxHours)}
                            step="0.5"
                            value={row.hours[key] ?? 0}
                            disabled={disabled}
                            className={`w-16 px-2 py-2 border rounded text-center text-sm font-medium transition-all
                              ${isPreDOJ ? 'bg-gray-100 text-gray-400' : ''}
                              ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'hover:bg-gray-50'}
                            `}
                            onChange={e => handleChange(rowIndex, key, Number(e.target.value))}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            </tbody>
            <tfoot className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900 border-r border-gray-200">Total Hours</td>
                {dayTotals.map((t, i) => <td key={i} className="px-3 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-200">{t.toFixed(1)}</td>)}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-b-lg flex items-center justify-start space-x-4">
        <span className="text-sm font-semibold text-gray-700">Total Hours for the Week:</span>
        <span className="text-lg font-bold text-indigo-700">{totalWeekHours.toFixed(totalWeekHours % 1 === 0 ? 0 : 1)} hours</span>
      </div>


    {/* Sticky Action Bar - Always visible at bottom, never overlaps table */}
    <div className=" bottom-0 left-0 right-0 bg-gray-50  border-gray-300 px-6 py-4 -mx-6 z-30">
      <div className="flex justify-end items-center space-x-4 max-w-7xl mx-auto">
        <button
          onClick={saveAll}
          disabled={loading || !hasUnsubmittedChanges}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:shadow-lg disabled:opacity-50 transition-all"
        >
          Save Changes
        </button>
        <button
          onClick={() => {
            // NORMAL WEEK (not split)
            if (!isSplitWeek) {
              if (!areAllRequiredDaysFilled) {
                pushMessage('error', 'Please enter hours for all working days (Mon–Fri, excluding holidays & leaves)');
                return;
              }
              const v = runValidation();
              if (!v.ok) {
                v.messages.forEach(m => pushMessage('error', m));
                return;
              }
              setConfirmSubmitOpen(true);
              return;
            }
          
            // SPLIT WEEK – MAIN FIX IS HERE
            if (!splitWeekInfo) return;
          
            let submitDates: string[] = [];
          
            // Case 1: Today is the last day of first month (e.g. June 30)
            if (todayKey === splitWeekInfo.firstMonthEndDate) {
              submitDates = weekDates
                .filter(d => d.format('YYYY-MM') === splitWeekInfo.firstMonth)
                .map(d => d.format('YYYY-MM-DD'));
            }
            // Case 2: Today is in the allowed second-month range (Fri–Sun)
            else if (
              splitWeekInfo.secondMonthSubmitFrom &&
              todayKey >= splitWeekInfo.secondMonthSubmitFrom
            ) {
              submitDates = weekDates
                .filter(d => d.format('YYYY-MM') === splitWeekInfo.secondMonth)
                .map(d => d.format('YYYY-MM-DD'));
            }
          
            if (submitDates.length === 0) {
              pushMessage('info', `Submit on ${dayjs(splitWeekInfo.firstMonthEndDate).format('D MMM')} or from ${dayjs(splitWeekInfo.secondMonthSubmitFrom).format('D MMM')}`);
              return;
            }
          
            // Validate only the dates we are about to submit
            const v = runValidationForDates(submitDates);
            if (!v.ok) {
              v.messages.forEach(m => pushMessage('error', m));
              return;
            }
          
            // Store for modal text (only used when submitting single day)
            setSelectedSubmitDate(submitDates.length === 1 ? submitDates[0] : null);
          
            // THIS LINE WAS MISSING → BUG 1 FIXED
            setConfirmSubmitOpen(true);
          }}
          disabled={loading || !hasEditableDay || (isSplitWeek && !splitWeekInfo?.firstMonthEndDate)}
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {isSplitWeek
            ? (() => {
                if (!splitWeekInfo) return 'Submit Week';
                const from = dayjs(splitWeekInfo.secondMonthSubmitFrom).format('D MMM');
                const to = dayjs(splitWeekInfo.secondMonthSubmitTo).format('D MMM');

                if (todayKey === splitWeekInfo.firstMonthEndDate)
                  return `Submit ${dayjs(splitWeekInfo.firstMonthEndDate).format('MMMM')} Month`;

                if (splitWeekInfo.secondMonthSubmitDate && splitWeekInfo.secondMonthSubmitFrom && todayKey >= splitWeekInfo.secondMonthSubmitFrom)
                  return 'Submit Remaining Days';

                if (splitWeekInfo.hasAnyWorkInSecondMonth)
                  return `Submit from ${from} – ${to}`;

                return `Submit on ${dayjs(splitWeekInfo.firstMonthEndDate).format('D MMM')}`;
              })()
            : 'Submit Week for Approval'
          }
        </button>
      </div>
    </div>

      {confirmSubmitOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-xl font-semibold text-gray-900 mb-4">
              {isSplitWeek && selectedSubmitDate ? `Submit ${dayjs(selectedSubmitDate).format('D MMMM YYYY')}?` : 'Submit Timesheet for Approval?'}
            </div>
            <div className="text-gray-600 mb-6">
              {isSplitWeek && selectedSubmitDate ? 'Only this day will be submitted.' : 'This will submit the entire week.'}
            </div>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300" onClick={() => setConfirmSubmitOpen(false)}>Cancel</button>
              <button className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700" onClick={handleConfirmSubmit}>Yes, Submit</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete.open && confirmDelete.rowIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Trash2 className="text-red-500 mr-2" size={20} /> Confirm Delete
            </div>
            <div className="text-gray-600 mb-6">Are you sure you want to delete this row?</div>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300" onClick={() => setConfirmDelete({ open: false, rowIndex: null })}>Cancel</button>
              <button
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  disabled={deletingRowIndex !== null}
                  onClick={async () => {
                    const idx = confirmDelete.rowIndex!;
                    const row = rows[idx];
                    setDeletingRowIndex(idx);

                    try {
                      // Optimistic UI update
                      setRows(prev => prev.filter((_, i) => i !== idx));

                      const ids = Object.values(row.timesheetIds || {}).filter(Boolean) as string[];

                      // ⬅️ SINGLE CALL — backend accepts list
                      await timesheetService.deleteTimesheet(ids);

                      await fetchData();
                      pushMessage('success', 'Row deleted');
                    } catch {
                      // Restore UI on failure
                      setRows(prev => [
                        ...prev.slice(0, idx),
                        row,
                        ...prev.slice(idx)
                      ]);
                      pushMessage('error', 'Delete failed');
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
    </div>
  );
};

export default TimeSheetRegister;
