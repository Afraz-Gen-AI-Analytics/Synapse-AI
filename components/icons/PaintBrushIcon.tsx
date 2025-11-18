import React from 'react';

const PaintBrushIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z"></path>
    <path d="M14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l-5 5 3 3 5-5"></path>
    <path d="M7 14l-3 3 5 5 3-3"></path>
  </svg>
);

export default PaintBrushIcon;