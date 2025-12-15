'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LoggedInUser } from '@/lib/api/types';
import { Eye, EyeOff } from 'lucide-react';
import { isPrivateMode } from '@/lib/deviceUtils';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ inputKey: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, state } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  // Auto-fill username from preferred storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const privateMode = isPrivateMode();
      const storage = privateMode ? sessionStorage : localStorage;
      const savedUsername =
      localStorage.getItem('rememberedUsername') ??
      sessionStorage.getItem('rememberedUsername');
    
    console.log('🔍 Auto-fill check:', {
      privateMode,
      savedUsername,
    });
      if (savedUsername) {
        setCredentials(prev => ({ ...prev, inputKey: savedUsername }));
        setRememberMe(true); // NEW: Re-check if username exists
        console.log('✅ Auto-checked Remember Me'); // Debug
      }
    }
  }, []);

  // HANDLE REDIRECT LOGIC (unchanged)
  useEffect(() => {
    if (state.isLoading) return;
    if (!state.isAuthenticated || !state.user) return;

    const user = state.user as LoggedInUser;
    const path = window.location.pathname;

    console.log("🔎 Login Effect:", {
      path,
      firstLogin: user.firstLogin,
      role: user.role.roleName,
    });

    if (hasRedirected.current) return;

    // FIRST LOGIN → setup
    if (user.firstLogin) {
      if (path !== "/auth/setup") {
        hasRedirected.current = true;
        router.push("/auth/setup");
      }
      return;
    }

    // ONLY 2 DASHBOARDS
    const target = user.role.roleName === "ADMIN"
      ? "/admin-dashboard"
      : "/dashboard";

    if (path !== target) {
      hasRedirected.current = true;
      router.push(target);
    }
  }, [state.isAuthenticated, state.user, state.isLoading]);

  // 🔥 SUBMIT LOGIN
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError('');
  //   setIsLoading(true);
  //   console.log('📤 Submit with rememberMe:', rememberMe, 'Username:', credentials.inputKey); // NEW: Confirm flag + input
  //   try {
  //     await login(credentials, rememberMe);
  //   } catch (err: any) {
  //     console.error('❌ Login error (no save):', err); // NEW: Log failures
  //     setError(err.message || "Invalid credentials");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(credentials, rememberMe);
      // Success → redirect handled by useEffect above
    } catch (err: any) {
      // Show ONLY the backend message
      const backendMessage = err.message || "Login failed. Please try again.";
      setError(backendMessage);
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // GLOBAL LOADING (unchanged)
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-blue-50 px-4">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          <p className="text-lg text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // 🔥 FINAL UI (unchanged, but checkbox now has onChange/checked)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-blue-50 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-100 p-8 transition-all">

        {/* Logo & Title (unchanged) */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/digiquad logo.jpeg"
              alt="DigiQuad Logo"
              width={80}
              height={80}
              style={{ width: 'auto', height: 'auto' }}
              className="rounded-full shadow-sm"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-5">
            Welcome to DigiQuad
          </h1>
        </div>

        {/* FORM (unchanged except checkbox props) */}
        <form className="space-y-6" onSubmit={handleSubmit}>

          {/* USERNAME (unchanged) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username or Email
            </label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={credentials.inputKey}
              autoComplete="username"
              onChange={(e) => setCredentials({ ...credentials, inputKey: e.target.value })}
              placeholder="Enter your username or email"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-3"
            />
          </div>

          {/* PASSWORD (unchanged) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-3"
              />

              {/* Eye Button (unchanged) */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-indigo-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-indigo-600 transition-colors" />
                )}
              </button>

            </div>
          </div>

          {/* ERROR (unchanged) */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Remember + Forgot Password (checkbox now controlled) */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  console.log('🔧 Checkbox toggled to:', e.target.checked); // NEW: Track clicks
                  setRememberMe(e.target.checked);
                }}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>

            <Link
              href="/auth/forgotPassword"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </Link>
          </div>

          {/* SUBMIT BUTTON (unchanged) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()}
          <span className="font-semibold text-indigo-600">
            {" "}
            <a
              href="https://digiquadsolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              DigiQuad Technologies
            </a>
          </span>
          . All rights reserved.
        </p>

      </div>
    </div>
  );
};

export default Login;