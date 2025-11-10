"use client";

import React, { useState, useEffect } from "react";
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

const ManagerHolidaysPage: React.FC = () => {
  const router = useRouter();
  const {
    state: { accessToken, user },
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"schemes" | "calendars">("schemes");
  const [schemes, setSchemes] = useState<HolidaySchemeDTO[]>([]);
  const [calendars, setCalendars] = useState<HolidayCalendarDTO[]>([]);
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [countryFilter, setCountryFilter] = useState("IN");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Dialogs
  const [isSchemeDialogOpen, setIsSchemeDialogOpen] = useState(false);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<HolidaySchemeDTO | null>(null);
  const [editingCalendar, setEditingCalendar] = useState<HolidayCalendarDTO | null>(null);

  useEffect(() => {
    if (!accessToken || user?.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    fetchSchemes();
    fetchCalendars();
  }, [accessToken, user, router, page, countryFilter]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const res = await holidaysService.getAllSchemes({
        // schemeCountryCode: countryFilter || undefined,
        page: page - 1,
        size: pageSize,
        sortBy: "createdAt",
        direction: "DESC",
      });
      setSchemes(res.response);
      setTotalSchemes(res.totalRecords || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load schemes");
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const res = await holidaysService.getAllCalendars();
      if (res.flag && Array.isArray(res.response)) {
        setCalendars(res.response);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load calendars");
    }
  };

  const openSchemeDialog = (scheme?: HolidaySchemeDTO) => {
    setEditingScheme(scheme || null);
    setIsSchemeDialogOpen(true);
  };

  const openCalendarDialog = (calendar?: HolidayCalendarDTO) => {
    setEditingCalendar(calendar || null);
    setIsCalendarDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-lg">
        Loading holiday data...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Holiday Management</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schemes">Holiday Schemes</TabsTrigger>
          <TabsTrigger value="calendars">Holiday Calendars</TabsTrigger>
        </TabsList>

        {/* ================= SCHEMES TAB ================= */}
        <TabsContent value="schemes" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Holiday Schemes</CardTitle>
                  <CardDescription>Manage regional holiday schemes</CardDescription>
                </div>
                <div className="flex gap-4 items-center">
                  {/* <div className="w-32">
                    <Label>Country</Label>
                    <Input
                      value={countryFilter}
                      onChange={(e) => {
                        setCountryFilter(e.target.value.toUpperCase());
                        setPage(1);
                      }}
                      placeholder="IN"
                      maxLength={2}
                      className="uppercase"
                    />
                  </div> */}
                  <Button onClick={() => openSchemeDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Scheme
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {schemes.length === 0 ? (
                <p className="text-muted-foreground">No schemes found.</p>
              ) : (
                <>
                  <div className="space-y-4">
                    {schemes.map((s) => {
                      const linked = s.holidayCalendarId
                        .map((id) => calendars.find((c) => c.holidayCalendarId === id))
                        .filter(Boolean);
                      return (
                        <div
                          key={s.holidaySchemeId}
                          className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition"
                        >
                          <div>
                            <h3 className="font-semibold">{s.schemeName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {s.schemeDescription || "No description"}
                            </p>
                            <p className="text-sm">
                              {s.city}, {s.state} • {s.schemeCountryCode}
                            </p>
                            {linked.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Linked: {linked.map((c) => c!.holidayName).join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSchemeDialog(s)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                holidaysService.deleteScheme(s.holidaySchemeId).then((res) => {
                                  if (res.flag) {
                                    toast.success("Scheme deleted");
                                    fetchSchemes();
                                  } else toast.error(res.message);
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1}–
                      {Math.min(page * pageSize, totalSchemes)} of {totalSchemes}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page * pageSize >= totalSchemes}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= CALENDARS TAB ================= */}
        <TabsContent value="calendars" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Holiday Calendars</CardTitle>
                  <CardDescription>Manage individual holidays</CardDescription>
                </div>
                <Button onClick={() => openCalendarDialog()}>
                  <Plus className="mr-2 h-4 w-4" /> Add Holiday
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {calendars.length === 0 ? (
                <p className="text-muted-foreground">No holidays yet.</p>
              ) : (
                <div className="space-y-4">
                  {calendars.map((c) => (
                    <div
                      key={c.holidayCalendarId}
                      className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div>
                        <h3 className="font-semibold">{c.holidayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {c.calendarDescription || "No description"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(c.holidayDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>{c.locationRegion || "Global"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {c.holidayType} • {c.recurrenceRule}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCalendarDialog(c)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            holidaysService.deleteHoliday(c.holidayCalendarId).then((res) => {
                              if (res.flag) {
                                toast.success("Holiday deleted");
                                fetchCalendars();
                              } else toast.error(res.message);
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================= DIALOGS ================= */}
      <SchemeDialog
        scheme={editingScheme}
        calendars={calendars}
        isOpen={isSchemeDialogOpen}
        onClose={() => {
          setIsSchemeDialogOpen(false);
          setEditingScheme(null);
        }}
        onSubmit={(data) => {
          const promise = editingScheme
            ? holidaysService.updateScheme(editingScheme.holidaySchemeId, data)
            : holidaysService.createScheme(data);
          promise.then((res) => {
            if (res.flag) {
              toast.success(editingScheme ? "Scheme updated" : "Scheme created");
              setIsSchemeDialogOpen(false);
              fetchSchemes();
            } else toast.error(res.message);
          });
        }}
      />

      <CalendarDialog
        calendar={editingCalendar}
        isOpen={isCalendarDialogOpen}
        onClose={() => {
          setIsCalendarDialogOpen(false);
          setEditingCalendar(null);
        }}
        onSubmit={(data) => {
          const promise = editingCalendar
            ? holidaysService.updateHoliday(editingCalendar.holidayCalendarId, data)
            : holidaysService.createHoliday(data);
          promise.then((res) => {
            if (res.flag) {
              toast.success(editingCalendar ? "Holiday updated" : "Holiday created");
              setIsCalendarDialogOpen(false);
              fetchCalendars();
            } else toast.error(res.message);
          });
        }}
      />
    </div>
  );
};

// ================= SCHEME DIALOG =================
interface SchemeDialogProps {
  scheme: HolidaySchemeDTO | null;
  calendars: HolidayCalendarDTO[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HolidaySchemeModel) => void;
}

const SchemeDialog: React.FC<SchemeDialogProps> = ({
  scheme,
  calendars,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<
    Omit<HolidaySchemeModel, "schemeName"> & { schemeName: string }
  >({
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
        holidayCalendarId: scheme.holidayCalendarId[0] || undefined,
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
  }, [scheme, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.schemeName.trim()) {
      toast.error("Scheme name is required");
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{scheme ? "Edit Scheme" : "Create New Scheme"}</DialogTitle>
          <DialogDescription>
            {scheme ? "Update scheme details" : "Add a new holiday scheme"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Scheme Name *</Label>
            <Input
              id="name"
              value={form.schemeName}
              onChange={(e) => setForm({ ...form, schemeName: e.target.value })}
              required
              placeholder="India Public Holidays 2025"
            />
          </div>

          <div>
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              value={form.schemeDescription}
              onChange={(e) => setForm({ ...form, schemeDescription: e.target.value })}
            />
          </div>

          <div>
            <Label>Link Calendar (Optional)</Label>
            <Select
              value={form.holidayCalendarId || ""}
              onValueChange={(v) =>
                setForm({ ...form, holidayCalendarId: v || undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((c) => (
                  <SelectItem key={c.holidayCalendarId} value={c.holidayCalendarId}>
                    {c.holidayName} ({new Date(c.holidayDate).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Mumbai"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="MH"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country Code</Label>
            <Input
              id="country"
              value={form.schemeCountryCode}
              onChange={(e) =>
                setForm({ ...form, schemeCountryCode: e.target.value.toUpperCase() })
              }
              placeholder="IN"
              maxLength={2}
              className="uppercase"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={form.activeStatus}
              onChange={(e) => setForm({ ...form, activeStatus: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="active" className="font-normal cursor-pointer">
              Active
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{scheme ? "Update" : "Create"} Scheme</Button>
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
          <DialogTitle>{calendar ? "Edit Holiday" : "Add New Holiday"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Holiday Name *</Label>
            <Input
              value={form.holidayName}
              onChange={(e) => setForm({ ...form, holidayName: e.target.value })}
              required
              placeholder="Diwali"
            />
          </div>
          <div>
            <Label>Date *</Label>
            <Input
              type="date"
              value={form.holidayDate}
              onChange={(e) => setForm({ ...form, holidayDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={form.holidayType}
              onValueChange={(v) => setForm({ ...form, holidayType: v as HolidayType })}
            >
              <SelectTrigger>
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
            <Label>Recurrence</Label>
            <Select
              value={form.recurrenceRule}
              onValueChange={(v) => setForm({ ...form, recurrenceRule: v as RecurrenceRule })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANNUAL">Annual</SelectItem>
                <SelectItem value="ONE_TIME">One Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Region</Label>
            <Input
              value={form.locationRegion}
              onChange={(e) => setForm({ ...form, locationRegion: e.target.value })}
              placeholder="Maharashtra"
            />
          </div>
          <div>
            <Label>Country Code</Label>
            <Input
              value={form.calendarCountryCode}
              onChange={(e) => setForm({ ...form, calendarCountryCode: e.target.value.toUpperCase() })}
              placeholder="IN"
              maxLength={2}
              className="uppercase"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={form.calendarDescription}
              onChange={(e) => setForm({ ...form, calendarDescription: e.target.value })}
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
            <Label htmlFor="activeCal" className="font-normal cursor-pointer">
              Active
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{calendar ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManagerHolidaysPage;