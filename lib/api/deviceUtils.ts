// src/lib/deviceUtils.ts
"use client";

import { v4 as uuidv4 } from "uuid";

export const getDeviceId = (): string => {
  if (typeof window === "undefined") return "server-device"; // fallback
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

export const getDeviceName = (): string => {
  if (typeof window === "undefined") return "Server";
  return window.navigator.platform || "Web Browser";
};

export const getUserAgent = (): string => {
  if (typeof window === "undefined") return "Server";
  return window.navigator.userAgent;
};
// lib/api/deviceUtils.ts
export const getDeviceHeaders = () => {
  const deviceId = (() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('deviceId');
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('deviceId', id);
      }
      return id;
    }
    return 'unknown-device';
  })();

  // Ultra-short device name to avoid any DB length issues (focus on browser/OS only)
  const getShortDeviceName = () => {
    if (typeof navigator === 'undefined') return 'SSR-Device';

    const ua = navigator.userAgent;
    let name = 'Web';

    // Detect browser (short)
    if (ua.includes('Chrome')) name = 'Chrome';
    else if (ua.includes('Firefox')) name = 'Firefox';
    else if (ua.includes('Safari')) name = 'Safari';
    else if (ua.includes('Edge')) name = 'Edge';

    // Detect OS (short)
    let os = '';
    if (ua.includes('Windows')) os = '-Win';
    else if (ua.includes('Mac')) os = '-Mac';
    else if (ua.includes('Linux')) os = '-Linux';
    else if (ua.includes('Android')) os = '-Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = '-iOS';

    // Combine: e.g., "Chrome-Win" (short, <20 chars)
    return `${name}${os}`;
  };

  const deviceName = getShortDeviceName();

  return {
    'X-Device-Id': deviceId,
    'X-Device-Name': deviceName,
    // NEVER set 'User-Agent' here—browser handles it automatically (and it's the source of the length error)
  };
};
