// components/ClientLayout.tsx
'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';

interface Props {
  children: ReactNode;
  className?: string;
}

export const ClientLayout = ({ children, className }: Props) => {
  return (
    <AuthProvider>
      <div className={className}>
        {children}
      </div>
    </AuthProvider>
  );
};