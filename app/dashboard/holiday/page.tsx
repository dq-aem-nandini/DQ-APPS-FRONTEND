'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { holidaysService } from '@/lib/api/holidayService';
import { employeeService } from '@/lib/api/employeeService';
import { HolidayCalendarDTO } from '@/lib/api/types';
import { format } from 'date-fns';

const HolidayCalendarPage: React.FC = () => {
  const [employee, setEmployee] = useState<any>(null);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<HolidayCalendarDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingEmployee, setLoadingEmployee] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayCalendarDTO | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // FETCH EMPLOYEE
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoadingEmployee(true);
        const emp = await employeeService.getEmployeeById();
        setEmployee(emp);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoadingEmployee(false);
      }
    };
    fetchEmployee();
  }, []);

  // FETCH ALL SCHEMES
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        const response = await holidaysService.getAllSchemes();
        if (response.flag && Array.isArray(response.response)) {
          setSchemes(response.response);
        }
      } catch (err) {
        setError('Failed to load holiday schemes');
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  // AUTO-SELECT SCHEME BASED ON CLIENT NAME
  const currentScheme = useMemo(() => {
    if (!employee?.clientName || schemes.length === 0) return null;
    const clientLower = employee.clientName.toLowerCase();
    return schemes.find(s =>
      s.schemeName.toLowerCase().includes(clientLower) ||
      clientLower.includes(s.schemeName.toLowerCase()) ||
      s.city?.toLowerCase().includes(clientLower)
    ) || schemes[0];
  }, [employee, schemes]);

  // LOAD HOLIDAYS FROM SELECTED SCHEME
  useEffect(() => {
    if (!currentScheme?.holidayCalendarId || !Array.isArray(currentScheme.holidayCalendarId)) {
      setHolidays([]);
      return;
    }

    const loadHolidays = async () => {
      try {
        setLoading(true);
        const responses = await Promise.all(
          currentScheme.holidayCalendarId.map((id: string) =>
            holidaysService.getCalendarById(id).catch(() => ({ flag: false }))
          )
        );
        const validHolidays = responses
          .filter(r => r.flag && r.response)
          .map(r => r.response as HolidayCalendarDTO);
        setHolidays(validHolidays);
      } catch (err) {
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };
    loadHolidays();
  }, [currentScheme]);

  // COUNTRY LIST FROM SCHEMES
  const countries = useMemo(() => {
    const unique = [...new Set(schemes.map(s => s.schemeCountryCode || 'Unknown').filter(Boolean))].sort();
    return ['All', ...unique];
  }, [schemes]);

  // FILTER: Year + Country (from scheme)
  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      const yearMatch = new Date(h.holidayDate).getFullYear() === selectedYear;
      const countryMatch = selectedCountry === 'All' || currentScheme?.schemeCountryCode === selectedCountry;
      return yearMatch && countryMatch && h.holidayActive !== false;
    });
  }, [holidays, selectedYear, selectedCountry, currentScheme]);

  const formatDate = (d: string) => format(new Date(d), 'MMMM d, yyyy');
  const formatHolidayType = (type?: string | null): string => {
    return type ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'N/A';
  };

  if (loadingEmployee || loading) {
    return (
      <div className="container mx-auto p-6 min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-xl text-gray-600">Loading your holiday calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Holiday Calendar
          </h1>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-800">
            Your holidays for{' '}
            <span className="text-indigo-600 font-bold">{employee?.clientName}</span>
            {currentScheme && (
              <span className="text-gray-600">
                {' '} - {currentScheme.city || 'All Cities'}
                {currentScheme.state && `, ${currentScheme.state}`}
                {currentScheme.schemeCountryCode && ` (${currentScheme.schemeCountryCode})`}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters: Year + Country */}
      <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-8 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      )}

      {/* No Holidays */}
      {!loading && !error && filteredHolidays.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm text-gray-600 text-lg">
          No holidays found for <strong>{employee?.clientName}</strong> in {selectedYear}
          {selectedCountry !== 'All' && ` (${selectedCountry})`}.
        </div>
      )}

      {/* Table with City, State, Country from scheme */}
      {!loading && !error && filteredHolidays.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holiday Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredHolidays.map((h, index) => {
                const uniqueKey = h.holidayCalendarId
                  ? h.holidayCalendarId
                  : `holiday-${h.holidayName}-${h.holidayDate}-${index}`;

                return (
                  <tr
                    key={uniqueKey}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedHoliday(h)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{h.holidayName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(h.holidayDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{currentScheme?.city || 'All'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{currentScheme?.state || 'All'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{currentScheme?.schemeCountryCode || 'Global'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{h.calendarDescription || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selectedHoliday && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedHoliday.holidayName}</h2>
            <p className="text-sm text-gray-600 mb-2"><strong>Date:</strong> {formatDate(selectedHoliday.holidayDate)}</p>
            <p className="text-sm text-gray-600 mb-2"><strong>Client:</strong> <span className="font-semibold text-indigo-600">{employee?.clientName}</span></p>
            <p className="text-sm text-gray-600 mb-2"><strong>City:</strong> {currentScheme?.city || 'All'}</p>
            <p className="text-sm text-gray-600 mb-2"><strong>State:</strong> {currentScheme?.state || 'All'}</p>
            <p className="text-sm text-gray-600 mb-2"><strong>Country:</strong> {currentScheme?.schemeCountryCode || 'Global'}</p>
            <button onClick={() => setSelectedHoliday(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendarPage;