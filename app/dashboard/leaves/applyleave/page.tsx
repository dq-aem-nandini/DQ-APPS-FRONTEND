// app/dashboard/leaves/applyleave/page.tsx
'use client';

import { Suspense } from 'react';

import Spinner from '@/components/ui/Spinner';
import ApplyLeavePage from '@/components/employee/ApplyLeave';

export default function ApplyLeaveWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600 text-sm font-medium">Loading leave form...</p>
        </div>
      }
    >
      <ApplyLeavePage />
    </Suspense>
  );
}