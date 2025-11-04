// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
 
const inter = Inter({ subsets: ['latin'] });
 
export const metadata: Metadata = {
  title: 'EmpTimeHub',
  description: 'Employee Time Tracking Hub',

};
 
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <ClientLayout className={inter.className}>
        {children}
        <ToastContainer position="top-right" autoClose={3000} />
      </ClientLayout>
    </html>
  );
}