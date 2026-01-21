// src/components/ui/TooltipHint.tsx
import { Info } from 'lucide-react';
import { useState } from 'react';

interface TooltipHintProps {
  hint: string;
}
export default function TooltipHint({ hint }: TooltipHintProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block ml-2"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          // optional: toggle on click if you want mobile support
          setShow((prev) => !prev);
        }}
        className="text-gray-400 hover:text-indigo-600 transition"
      >
        <Info className="w-4 h-4" />
      </button>

      {show && (
        <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-8 border-transparent border-t-gray-800"></div>
          {hint}
        </div>
      )}
    </div>
  );
}