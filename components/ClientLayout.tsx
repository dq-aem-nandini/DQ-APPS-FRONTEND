// components/ClientLayout.tsx
'use client';
 
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
 
interface Props {
  children: ReactNode;
  className?: string;
}
 
export const ClientLayout = ({ children, className }: Props) => {
  return <body className={className}><AuthProvider>{children}</AuthProvider></body>;
};
 