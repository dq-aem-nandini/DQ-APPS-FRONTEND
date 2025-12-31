// src/lib/deviceUtils.ts
"use client";

import { generateUUID } from "./utils";

const DEVICE_ID_KEY = "device_id_v3";
const PRIVATE_DEVICE_KEY = "device_id_private_v1";

let cachedId: string | null = null;
let cachedDeviceName: string | null = null;

const generatedUUID = () => generateUUID();

export const isPrivateMode = () => {
  try {
    localStorage.setItem("_t", "1");
    localStorage.removeItem("_t");
    return false;
  } catch {
    return true;
  }
};

export const getDeviceIdSync = (): string => {
  if (typeof window === "undefined") return "ssr";

  if (cachedId) return cachedId;

  const privateMode = isPrivateMode();

  if (privateMode) {
    let id = sessionStorage.getItem(PRIVATE_DEVICE_KEY);
    if (!id) {
      id = generatedUUID();
      sessionStorage.setItem(PRIVATE_DEVICE_KEY, id);
    }
    console.log(`Device ID: ${id} (Private: ${privateMode})`); // Temp debug
    cachedId = id;
    return id;
  }

  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generatedUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }

  cachedId = id;
  return id;
};


export const getDeviceName = (): string => {
  if (cachedDeviceName) return cachedDeviceName;

  if (typeof navigator === "undefined") return "Server";

  const ua = navigator.userAgent;

  let browser = "Browser";

  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";

  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(ua);

  cachedDeviceName = `${browser} ${isMobile ? "Mobile" : "Desktop"}`;
  return cachedDeviceName;
};


export const getDeviceHeaders = () => ({
  "X-Device-ID": getDeviceIdSync(),
  "X-Device-Name": getDeviceName(),
});