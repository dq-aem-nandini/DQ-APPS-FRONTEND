'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import SalaryDetails from '@/components/employee/SalaryDetails';

export default function SalaryPage() {
  const { state } = useAuth();  // ✅ Access state
  const { user } = state;       // ✅ Extract user

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <SalaryDetails employeeId={user.userId} /> 
    </div>
  );
}
