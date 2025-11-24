"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { holidaysService } from "@/lib/api/holidayService";
import {
  HolidaySchemeDTO,
  HolidayCalendarDTO,
  HolidayCalendarModel,
  HolidaySchemeModel,
  HolidayType,
  RecurrenceRule,
} from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Edit3, Plus, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const countryOptions = [
  { value: 'ALL', label: 'All Countries' },
  { value: 'IN', label: 'India (IN)' },
  { value: 'US', label: 'United States (US)' },
  { value: 'GB', label: 'United Kingdom (GB)' },
  { value: 'AU', label: 'Australia (AU)' },
  { value: 'CA', label: 'Canada (CA)' },
  { value: 'DE', label: 'Germany (DE)' },
  { value: 'FR', label: 'France (FR)' },
  { value: 'JP', label: 'Japan (JP)' },
  { value: 'BR', label: 'Brazil (BR)' },
];

const HolidaysPage: React.FC = () => {
  const router = useRouter();
  const { state: { accessToken, user } } = useAuth();

  const [activeTab, setActiveTab] = useState<"schemes" | "calendars">("schemes");
  const [schemes, setSchemes] = useState<HolidaySchemeDTO[]>([]);
  const [calendars, setCalendars] = useState<HolidayCalendarDTO[]>([]);
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [totalCalendars, setTotalCalendars] = useState(0);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [loadingCalendars, setLoadingCalendars] = useState(true);

  const [schemeCountryInput, setSchemeCountryInput] = useState("ALL");
  const [calendarCountryInput, setCalendarCountryInput] = useState("ALL");
  const [schemePage, setSchemePage] = useState(1);
  const [calendarPage, setCalendarPage] = useState(1);

  const [debouncedSchemeCountry, setDebouncedSchemeCountry] = useState("");
  const [debouncedCalendarCountry, setDebouncedCalendarCountry] = useState("");

  const [isSchemeDialogOpen, setIsSchemeDialogOpen] = useState(false);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<HolidaySchemeDTO | null>(null);
  const [editingCalendar, setEditingCalendar] = useState<HolidayCalendarDTO | null>(null);

  useEffect(() => {
    if (!accessToken || user?.role.roleName !== "ADMIN") {
      router.push("/login");
      return;
    }
  }, [accessToken, user, router]);

  const fetchSchemes = useCallback(async () => {
    try {
      setLoadingSchemes(true);
      const res = await holidaysService.getAllSchemes({
        schemeCountryCode: debouncedSchemeCountry || undefined,
        page: schemePage - 1,
        size: PAGE_SIZE,
        sortBy: "createdAt",
        direction: "DESC",
      });
      setSchemes(res.response);
      setTotalSchemes(res.totalRecords || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load schemes");
    } finally {
      setLoadingSchemes(false);
    }
  }, [debouncedSchemeCountry, schemePage]);

  const fetchCalendars = useCallback(async () => {
    try {
      setLoadingCalendars(true);
      const res = await holidaysService.getAllCalendars();
      let filtered = res.response || [];

      // ONLY FILTER WHEN NOT EDITING A SCHEME
      if (!editingScheme && debouncedCalendarCountry) {
        filtered = filtered.filter(
          (c: HolidayCalendarDTO) =>
            c.calendarCountryCode?.toUpperCase() === debouncedCalendarCountry
        );
      }

      const start = (calendarPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      setCalendars(filtered.slice(start, end));
      setTotalCalendars(filtered.length);
    } catch (err: any) {
      toast.error(err.message || "Failed to load calendars");
    } finally {
      setLoadingCalendars(false);
    }
  }, [debouncedCalendarCountry, calendarPage, editingScheme]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  const openSchemeDialog = async (scheme?: HolidaySchemeDTO) => {
    setEditingScheme(scheme || null);
    if (scheme && scheme.holidayCalendarId?.length > 0) {
      await fetchCalendars(); // Ensures all calendars are loaded
    }
    setIsSchemeDialogOpen(true);
  };

  const openCalendarDialog = (calendar?: HolidayCalendarDTO) => {
    setEditingCalendar(calendar || null);
    setIsCalendarDialogOpen(true);
  };

  const handleSchemeCountryChange = (v: string) => {
    setSchemeCountryInput(v);
    const countryCode = v === 'ALL' ? '' : v;
    setDebouncedSchemeCountry(countryCode);
    setSchemePage(1);
  };

  const handleCalendarCountryChange = (v: string) => {
    setCalendarCountryInput(v);
    const countryCode = v === 'ALL' ? '' : v;
    setDebouncedCalendarCountry(countryCode);
    setCalendarPage(1);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 sm:mb-8 md:mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Holiday Management
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setSchemePage(1); setCalendarPage(1); }}>
        <TabsList className="grid w-full grid-cols-2">

          <TabsTrigger value="calendars">Holiday Calendars</TabsTrigger>
          <TabsTrigger value="schemes">Holiday Schemas</TabsTrigger>
        </TabsList>

        {/* SCHEMES TAB */}
        <TabsContent value="schemes" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg sm:text-xl">Holiday Schemas</CardTitle>
                  <CardDescription className="text-sm">Manage regional holiday schemas</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-end gap-3 sm:gap-4 w-full lg:w-auto">
                  <div className="w-full sm:w-48 md:w-56">
                    <Label className="text-xs sm:text-sm">Country</Label>
                    <Select value={schemeCountryInput} onValueChange={handleSchemeCountryChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => openSchemeDialog()} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Add Schema
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSchemes ? (
                <p className="text-center py-6 sm:py-8 text-sm text-muted-foreground">Loading schemes...</p>
              ) : schemes.length === 0 ? (
                <p className="text-center py-6 sm:py-8 text-sm text-muted-foreground">No schemes found</p>
              ) : (
                <>
                  <div className="space-y-3 sm:space-y-4">
                    {schemes.map((s) => {
                      const linked = s.holidayCalendarId
                        .map(id => calendars.find(c => c.holidayCalendarId === id))
                        .filter(Boolean);
                      return (
                        <div key={s.holidaySchemeId} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{s.schemeName}</h3>
                              {!s.schemeActive && (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full whitespace-nowrap">Inactive</span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{s.schemeDescription || "No description"}</p>
                            <p className="text-xs sm:text-sm line-clamp-1">{s.city || "N/A"}, {s.state || "N/A"} • {s.schemeCountryCode}</p>
                            {linked.length > 0 && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                Linked: {linked.map(c => c!.holidayName).join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 self-start sm:self-auto">
                            <Button variant="outline" size="sm" onClick={() => openSchemeDialog(s)} className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3">
                              <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            {s.schemeActive && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => holidaysService.deleteScheme(s.holidaySchemeId).then(res => {
                                  if (res.flag) {
                                    toast.success("Scheme soft deleted");
                                    fetchSchemes();
                                  } else toast.error(res.message);
                                })}
                                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 sm:mt-6 gap-2 sm:gap-0">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Showing {(schemePage - 1) * PAGE_SIZE + 1}–{Math.min(schemePage * PAGE_SIZE, totalSchemes)} of {totalSchemes}
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                      <Button variant="outline" size="sm" disabled={schemePage === 1} onClick={() => setSchemePage(p => p - 1)}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={schemePage * PAGE_SIZE >= totalSchemes} onClick={() => setSchemePage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CALENDARS TAB */}
        <TabsContent value="calendars" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg sm:text-xl">Holiday Calendars</CardTitle>
                  <CardDescription className="text-sm">Manage individual holidays</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-end gap-3 sm:gap-4 w-full lg:w-auto">
                  <div className="w-full sm:w-48 md:w-56">
                    <Label className="text-xs sm:text-sm">Country</Label>
                    <Select value={calendarCountryInput} onValueChange={handleCalendarCountryChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => openCalendarDialog()} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Add Holiday
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCalendars ? (
                <p className="text-center py-6 sm:py-8 text-sm text-muted-foreground">Loading holidays...</p>
              ) : calendars.length === 0 ? (
                <p className="text-center py-6 sm:py-8 text-sm text-muted-foreground">No holidays found</p>
              ) : (
                <>
                  <div className="space-y-3 sm:space-y-4">
                    {calendars.map((c) => (
                      <div key={c.holidayCalendarId} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{c.holidayName}</h3>
                            {!c.holidayActive && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full whitespace-nowrap">Inactive</span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{c.calendarDescription || "No description"}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="line-clamp-1">{new Date(c.holidayDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="line-clamp-1">{c.locationRegion || "Global"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {c.holidayType} • {c.recurrenceRule} • {c.calendarCountryCode || "N/A"}
                          </p>
                        </div>
                        <div className="flex gap-2 self-start sm:self-auto">
                          <Button variant="outline" size="sm" onClick={() => openCalendarDialog(c)} className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3">
                            <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          {c.holidayActive && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => holidaysService.deleteHoliday(c.holidayCalendarId).then(res => {
                                if (res.flag) {
                                  toast.success("Holiday soft deleted");
                                  fetchCalendars();
                                } else toast.error(res.message);
                              })}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 sm:mt-6 gap-2 sm:gap-0">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Showing {(calendarPage - 1) * PAGE_SIZE + 1}–{Math.min(calendarPage * PAGE_SIZE, totalCalendars)} of {totalCalendars}
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                      <Button variant="outline" size="sm" disabled={calendarPage === 1} onClick={() => setCalendarPage(p => p - 1)}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={calendarPage * PAGE_SIZE >= totalCalendars} onClick={() => setCalendarPage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      <SchemeDialog
        scheme={editingScheme}
        calendars={calendars}
        isOpen={isSchemeDialogOpen}
        onClose={() => { setIsSchemeDialogOpen(false); setEditingScheme(null); }}
        onSubmit={(data) => {
          const promise = editingScheme
            ? holidaysService.updateScheme(editingScheme.holidaySchemeId, data)
            : holidaysService.createScheme(data);
          promise.then(res => {
            if (res.flag) {
              toast.success(editingScheme ? "Scheme updated" : "Scheme created");
              setIsSchemeDialogOpen(false);
              fetchSchemes();
              fetchCalendars();
            } else toast.error(res.message);
          });
        }}
      />

      <CalendarDialog
        calendar={editingCalendar}
        isOpen={isCalendarDialogOpen}
        onClose={() => { setIsCalendarDialogOpen(false); setEditingCalendar(null); }}
        onSubmit={(data) => {
          const promise = editingCalendar
            ? holidaysService.updateHoliday(editingCalendar.holidayCalendarId, data)
            : holidaysService.createHoliday(data);
          promise.then(res => {
            if (res.flag) {
              toast.success(editingCalendar ? "Holiday updated" : "Holiday created");
              setIsCalendarDialogOpen(false);
              fetchCalendars();
              fetchSchemes();
            } else toast.error(res.message);
          });
        }}
      />
    </div>
  );
};

// SCHEME DIALOG — FINAL FLAWLESS VERSION
const SchemeDialog: React.FC<{
  scheme: HolidaySchemeDTO | null;
  calendars: HolidayCalendarDTO[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HolidaySchemeModel) => void;
}> = ({ scheme, calendars, isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState<HolidaySchemeModel>({
    schemeName: "",
    schemeDescription: "",
    city: "",
    state: "",
    schemeCountryCode: "",
    activeStatus: true,
    holidayCalendarId: undefined,
  });

  useEffect(() => {
    if (isOpen && scheme) {
      setForm({
        schemeName: scheme.schemeName,
        schemeDescription: scheme.schemeDescription || "",
        city: scheme.city || "",
        state: scheme.state || "",
        schemeCountryCode: scheme.schemeCountryCode || "",
        activeStatus: scheme.schemeActive,
        holidayCalendarId: scheme.holidayCalendarId?.[0] || undefined,
      });
    } else if (isOpen) {
      setForm({
        schemeName: "",
        schemeDescription: "",
        city: "",
        state: "",
        schemeCountryCode: "",
        activeStatus: true,
        holidayCalendarId: undefined,
      });
    }
  }, [scheme, isOpen, calendars]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.schemeName?.trim()) {
      toast.error("Scheme name is required");
      return;
    }
    onSubmit(form);
  };

  const selectedCalendar = form.holidayCalendarId
    ? calendars.find(c => c.holidayCalendarId === form.holidayCalendarId)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm sm:text-base">{scheme ? "Edit Scheme" : "Create New Scheme"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label className="text-xs sm:text-sm">Scheme Name *</Label>
            <Input value={form.schemeName || ""} onChange={e => setForm({ ...form, schemeName: e.target.value })} required className="text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Description</Label>
            <Input value={form.schemeDescription || ""} onChange={e => setForm({ ...form, schemeDescription: e.target.value })} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Link Calendar (Optional)</Label>
            <Select value={form.holidayCalendarId ?? ""} onValueChange={v => setForm({ ...form, holidayCalendarId: v || undefined })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None">
                  {selectedCalendar
                    ? `${selectedCalendar.holidayName} (${new Date(selectedCalendar.holidayDate).toLocaleDateString()})`
                    : "None"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {calendars.length === 0 ? (
                  <div className="px-2 py-1 text-xs sm:text-sm text-muted-foreground">No calendars available</div>
                ) : (
                  calendars.map(c => (
                    <SelectItem key={c.holidayCalendarId} value={c.holidayCalendarId}>
                      {c.holidayName} ({new Date(c.holidayDate).toLocaleDateString()})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div><Label className="text-xs sm:text-sm">City</Label><Input value={form.city || ""} onChange={e => setForm({ ...form, city: e.target.value })} className="text-sm" /></div>
            <div><Label className="text-xs sm:text-sm">State</Label><Input value={form.state || ""} onChange={e => setForm({ ...form, state: e.target.value })} className="text-sm" /></div>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Country Code</Label>
            <Input value={form.schemeCountryCode || ""} onChange={e => setForm({ ...form, schemeCountryCode: e.target.value.toUpperCase() })} maxLength={2} className="text-sm uppercase" />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="active" checked={form.activeStatus} onChange={e => setForm({ ...form, activeStatus: e.target.checked })} className="w-4 h-4 rounded" />
            <Label htmlFor="active" className="text-xs sm:text-sm font-normal cursor-pointer">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="text-xs sm:text-sm">Cancel</Button>
            <Button type="submit" className="text-xs sm:text-sm">{scheme ? "Update" : "Create"} Scheme</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ================= CALENDAR DIALOG =================
interface CalendarDialogProps {
  calendar: HolidayCalendarDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HolidayCalendarModel) => void;
}

const CalendarDialog: React.FC<CalendarDialogProps> = ({
  calendar,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<
    Omit<HolidayCalendarModel, "holidayName" | "holidayDate"> & {
      holidayName: string;
      holidayDate: string;
    }
  >({
    holidayName: "",
    calendarDescription: "",
    holidayDate: "",
    locationRegion: "",
    holidayType: "PUBLIC",
    recurrenceRule: "ONE_TIME",
    calendarCountryCode: "",
    activeStatus: true,
  });

  useEffect(() => {
    if (isOpen && calendar) {
      setForm({
        holidayName: calendar.holidayName,
        calendarDescription: calendar.calendarDescription || "",
        holidayDate: calendar.holidayDate.split("T")[0],
        locationRegion: calendar.locationRegion || "",
        holidayType: calendar.holidayType,
        recurrenceRule: calendar.recurrenceRule,
        calendarCountryCode: calendar.calendarCountryCode || "",
        activeStatus: calendar.holidayActive,
      });
    } else if (isOpen) {
      setForm({
        holidayName: "",
        calendarDescription: "",
        holidayDate: "",
        locationRegion: "",
        holidayType: "PUBLIC",
        recurrenceRule: "ONE_TIME",
        calendarCountryCode: "",
        activeStatus: true,
      });
    }
  }, [calendar, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.holidayName.trim()) {
      toast.error("Holiday name is required");
      return;
    }
    if (!form.holidayDate) {
      toast.error("Date is required");
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm sm:text-base">{calendar ? "Edit Holiday" : "Add New Holiday"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label className="text-xs sm:text-sm">Holiday Name *</Label>
            <Input
              value={form.holidayName}
              onChange={(e) => setForm({ ...form, holidayName: e.target.value })}
              required
              placeholder="Diwali"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Date *</Label>
            <Input
              type="date"
              value={form.holidayDate}
              onChange={(e) => setForm({ ...form, holidayDate: e.target.value })}
              required
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Type</Label>
            <Select
              value={form.holidayType}
              onValueChange={(v) => setForm({ ...form, holidayType: v as HolidayType })}
            >
              <SelectTrigger className="w-full" >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="RELIGIOUS">Religious</SelectItem>
                <SelectItem value="REGIONAL">Regional</SelectItem>
                <SelectItem value="COMPANY_SPECIFIC">Company Specific</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Recurrence</Label>
            <Select
              value={form.recurrenceRule}
              onValueChange={(v) => setForm({ ...form, recurrenceRule: v as RecurrenceRule })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANNUAL">Annual</SelectItem>
                <SelectItem value="ONE_TIME">One Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Region</Label>
            <Input
              value={form.locationRegion}
              onChange={(e) => setForm({ ...form, locationRegion: e.target.value })}
              placeholder="Maharashtra"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Country Code</Label>
            <Input
              value={form.calendarCountryCode}
              onChange={(e) => setForm({ ...form, calendarCountryCode: e.target.value.toUpperCase() })}
              placeholder="IN"
              maxLength={2}
              className="text-sm uppercase"
            />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Description</Label>
            <Input
              value={form.calendarDescription}
              onChange={(e) => setForm({ ...form, calendarDescription: e.target.value })}
              className="text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="activeCal"
              checked={form.activeStatus}
              onChange={(e) => setForm({ ...form, activeStatus: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="activeCal" className="text-xs sm:text-sm font-normal cursor-pointer">
              Active
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="text-xs sm:text-sm">
              Cancel
            </Button>
            <Button type="submit" className="text-xs sm:text-sm">{calendar ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export default HolidaysPage;