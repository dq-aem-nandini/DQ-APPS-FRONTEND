'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LoggedInUser } from '@/lib/api/types';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ inputKey: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, state } = useAuth();
  const router = useRouter();

// Fixed useEffect with type assertion for state.user (treat as LoggedInUser)
useEffect(() => {
  if (state.isAuthenticated && state.user && !state.isLoading) {
    const user = state.user as LoggedInUser;
    console.log('🧩 Login useEffect triggered:', {
      role: user.role,
      userId: user.userId,
      firstLogin: user.firstLogin, // Log for debugging
    });

    // NEW: Check for first login and redirect to setup
    if (user.firstLogin === true) { // Explicit === true to avoid undefined
      console.log('🧩 First login detected in useEffect, redirecting to setup');
      router.push('/auth/setup');
      return;
    }

    // Existing role-based redirect
    const path = user.role === 'EMPLOYEE' ? '/dashboard' :
                 user.role === 'ADMIN' ? '/admin-dashboard' :
                 user.role === 'MANAGER' ? '/manager' :
                 user.role === 'CLIENT' ? '/client-dashboard' :
                 user.role === 'HR' ? '/hr' :
                 user.role === 'FINANCE' ? '/finance' :
                 '/auth/login'; // Fallback for undefined/invalid roles
    console.log('🧩 Redirecting to:', path);
    router.push(path);
  }
}, [state.isAuthenticated, state.user, state.isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      console.log('🧩 Attempting login with credentials:', credentials.inputKey);
      await login(credentials);
      console.log('🧩 Login API succeeded, waiting for state update...');
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-lg text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-blue-50 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-100 p-8 transition-all">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/digiquad logo.jpeg"
              alt="DigiQuad Logo"
              width={80}
              height={80}
              className="rounded-full shadow-sm"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-5">Welcome to DigiQuad</h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="inputKey" className="block text-sm font-medium text-gray-700 mb-2">
              Username or Email
            </label>
            <input
              id="inputKey"
              
              type="text"
              required
              value={credentials.inputKey}
              onChange={(e) => setCredentials({ ...credentials, inputKey: e.target.value })}
              disabled={isLoading}
              placeholder="Enter your username or email"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-3 text-gray-900 placeholder-gray-400 transition duration-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                disabled={isLoading}
                placeholder="Enter your password"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-3 text-gray-900 placeholder-gray-400 transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg
                  className="h-5 w-5 text-gray-400 hover:text-indigo-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>

            <Link href="/auth/forgotPassword" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading || state.isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading || state.isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} <span className="font-semibold text-indigo-600">DigiQuad Technologies</span>. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;