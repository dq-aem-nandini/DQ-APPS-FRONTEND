'use client';

import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Shield, Smartphone, Laptop, Tablet, Globe, LogOut, 
  CheckCircle2, AlertCircle, Loader2, Settings, User, 
  Bell, Lock, XCircle, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { sessionService } from '@/lib/api/sessionService';

import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { DeviceSessionDTO } from '@/lib/api/types';

export default function SettingsPage() {
  const [sessions, setSessions] = useState<DeviceSessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminatingAll, setTerminatingAll] = useState(false);
  const router = useRouter();

  const currentDeviceId = typeof window !== 'undefined' ? localStorage.getItem('deviceId') : null;

  // Real-time session fetch
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionService.getMySessions();
      const all = [...data.activeSessions, ...data.loggedOutSessions]
        .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
      setSessions(all);
    } catch (err) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Optional: Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchSessions, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoutDevice = async (deviceId: string) => {
    if (deviceId === currentDeviceId) {
      if (!confirm("This will log you out from this device. Continue?")) return;
    }

    try {
      await sessionService.logoutDevice(deviceId);
      toast.success("Session terminated");
      fetchSessions();
    } catch {
      toast.error("Failed to terminate session");
    }
  };

  const handleLogoutAllOthers = async () => {
    if (!confirm("This will log you out from ALL other devices. Continue?")) return;
    setTerminatingAll(true);
    try {
      await sessionService.logoutAllExceptCurrent();
      toast.success("All other devices logged out");
      fetchSessions();
    } catch {
      toast.error("Failed");
    } finally {
      setTerminatingAll(false);
    }
  };

  const getDeviceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('android') || n.includes('mobile')) return <Smartphone className="h-7 w-7" />;
    if (n.includes('ipad') || n.includes('tablet')) return <Tablet className="h-7 w-7" />;
    return <Laptop className="h-7 w-7" />;
  };

  const getStatusBadge = (session: DeviceSessionDTO) => {
    const isCurrent = session.deviceId === currentDeviceId;
    if (isCurrent) {
      return <Badge className="bg-green-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> This device</Badge>;
    }
    if (session.status === "Active") {
      return <Badge variant="default" className="bg-emerald-600">Active</Badge>;
    }
    return <Badge variant="secondary">Logged out</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-2xl mb-6">
            <Settings className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
            Account Settings
          </h1>
          <p className="text-xl text-gray-600 mt-4">Manage your security and active sessions</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Security Overview */}
          <Card className="lg:col-span-1 p-8 shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              Security Overview
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Lock className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Password</p>
                    <p className="text-sm text-gray-600">Last changed 3 months ago</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Change</Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Bell className="h-7 w-7 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold">2-Factor Auth</p>
                    <p className="text-sm text-gray-600">Not enabled</p>
                  </div>
                </div>
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">Enable</Button>
              </div>

              <Separator />

              <div className="bg-white/70 backdrop-blur rounded-2xl p-6 text-center">
                <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="font-bold text-2xl">{sessions.filter(s => s.status === "Active").length}</p>
                <p className="text-gray-600">Active Sessions</p>
              </div>
            </div>
          </Card>

          {/* Active Sessions */}
          <Card className="lg:col-span-2 p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold flex items-center gap-4">
                <Globe className="h-10 w-10 text-indigo-600" />
                Your Active Sessions
              </h2>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {sessions.filter(s => s.status === "Active").length > 1 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleLogoutAllOthers}
                    disabled={terminatingAll}
                  >
                    {terminatingAll ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Logout All Others
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-6 p-6 bg-gray-100 rounded-2xl">
                    <div className="w-16 h-16 bg-gray-300 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gray-300 rounded w-48" />
                      <div className="h-4 bg-gray-300 rounded w-64" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Shield className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                <p className="text-xl">No sessions found</p>
              </div>
            ) : (
              <div className="space-y-5">
                {sessions.map((session) => {
                  const isCurrent = session.deviceId === currentDeviceId;
                  const isActive = session.status === "Active";

                  return (
                    <Card 
                      key={session.deviceId} 
                      className={`p-6 transition-all hover:shadow-lg ${isCurrent ? 'ring-2 ring-green-500 bg-green-50/30' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className={`p-4 rounded-2xl ${isCurrent ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                            {getDeviceIcon(session.deviceName)}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold flex items-center gap-3">
                              {session.deviceName}
                              {getStatusBadge(session)}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              {session.ipAddress} • {format(new Date(session.loginTime), "dd MMM yyyy, HH:mm")}
                            </p>
                            {session.logoutTime && (
                              <p className="text-sm text-gray-500 mt-2">
                                Logged out {formatDistanceToNow(new Date(session.logoutTime), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>

                        {isActive && !isCurrent && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleLogoutDevice(session.deviceId)}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Log out
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500">
          <p>Your account is protected with enterprise-grade security</p>
          <p className="mt-2">© 2025 DigiQuad Technologies • All sessions encrypted</p>
        </div>
      </div>
    </div>
  );
}