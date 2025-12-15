"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Shield,
  Smartphone,
  Laptop,
  Tablet,
  Globe,
  LogOut,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { sessionService } from "@/lib/api/sessionService";
import type { DeviceSessionDTO } from "@/lib/api/types";
import { getDeviceIdSync } from "@/lib/deviceUtils";

export default function SettingsPage() {
  const [sessions, setSessions] = useState<DeviceSessionDTO[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminatingAll, setTerminatingAll] = useState(false);

  useEffect(() => {
    setCurrentDeviceId(getDeviceIdSync());
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionService.getMySessions();
      const all = [...data.activeSessions, ...data.loggedOutSessions].sort(
        (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
      );
      setSessions(all);
    } catch {
      toast.error("Failed to load device sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoutDevice = async (deviceId: string) => {
    if (
      deviceId === currentDeviceId &&
      !confirm("This will log you out from this device. Continue?")
    )
      return;

    try {
      await sessionService.logoutDevice(deviceId);
      toast.success("Session logged out");
      fetchSessions();
    } catch {
      toast.error("Failed to logout device");
    }
  };

  const handleLogoutAllOthers = async () => {
    if (!confirm("Logout from all other devices?")) return;
    setTerminatingAll(true);
    try {
      await sessionService.logoutAllExceptCurrent();
      toast.success("All other devices logged out");
      fetchSessions();
    } catch {
      toast.error("Failed to logout devices");
    } finally {
      setTerminatingAll(false);
    }
  };

  const getDeviceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("android") || n.includes("mobile"))
      return <Smartphone className="h-6 w-6" />;
    if (n.includes("ipad") || n.includes("tablet"))
      return <Tablet className="h-6 w-6" />;
    return <Laptop className="h-6 w-6" />;
  };

  const getStatusBadge = (session: DeviceSessionDTO) => {
    const isCurrent = session.deviceId === currentDeviceId;
    const isActive = session.logoutTime === null;

    if (isCurrent && isActive) {
      return (
        <Badge className="bg-green-600 text-white flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> This device
        </Badge>
      );
    }

    return isActive ? (
      <Badge className="bg-emerald-600 text-white">Active</Badge>
    ) : (
      <Badge variant="secondary">De-Activate</Badge>
    );
  };

  const activeCount = sessions.filter(s => s.logoutTime === null).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-6 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">

           <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
           Account Settings
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Manage your security and device sessions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Security Overview */}
          <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
            <Shield className="h-10 w-10 text-blue-600 mx-auto mb-3" />
            <p className="text-4xl font-bold">{activeCount}</p>
            <p className="text-gray-600 mt-1">Active Sessions</p>
          </Card>

          {/* Sessions */}
          <Card className="lg:col-span-2 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Globe className="h-6 w-6 text-indigo-600" />
                Device Sessions
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="sm" variant="outline" onClick={fetchSessions}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading && "animate-spin"}`} />
                  Refresh
                </Button>
                {activeCount > 1 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleLogoutAllOthers}
                    disabled={terminatingAll}
                  >
                    {terminatingAll ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Logout Others
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-10">Loading sessions…</p>
            ) : sessions.length === 0 ? (
              <p className="text-center text-gray-500 py-10">
                No device sessions found
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map(session => {
                  const isCurrent = session.deviceId === currentDeviceId;
                  const isActive = session.logoutTime === null;

                  return (
                    <div
                      key={session.deviceId}
                      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition
                        ${isCurrent ? "ring-2 ring-green-500 bg-green-50/40" : "hover:bg-gray-50"}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            isCurrent
                              ? "bg-green-600 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          {getDeviceIcon(session.deviceName)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="font-semibold truncate max-w-[160px] sm:max-w-none">
                              {session.deviceName}
                            </span>
                            {getStatusBadge(session)}
                          </div>

                          <p className="text-sm text-gray-600">
                            {session.ipAddress} ·{" "}
                            {format(new Date(session.loginTime), "dd MMM yyyy, HH:mm")}
                          </p>

                          {session.logoutTime && (
                            <p className="text-xs text-gray-500">
                              Logged out{" "}
                              {formatDistanceToNow(
                                new Date(session.logoutTime),
                                { addSuffix: true }
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {isActive && !isCurrent && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleLogoutDevice(session.deviceId)}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Log out
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
