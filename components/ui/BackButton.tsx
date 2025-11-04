'use client';

import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallback?: string;
}

const BackButton = memo(({ fallback = '/' }: BackButtonProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="group mb-6 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-indigo-300"
    >
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
      <span>Back</span>
    </button>
  );
});

BackButton.displayName = 'BackButton';
export default BackButton;
