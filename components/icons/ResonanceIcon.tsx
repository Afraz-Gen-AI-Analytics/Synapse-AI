import React from 'react';

const ResonanceIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <circle cx="12" cy="12" r="2"></circle>
    <path d="M15.536 8.464a5 5 0 0 1 0 7.072"></path>
    <path d="M18.364 5.636a9 9 0 0 1 0 12.728"></path>
    <path d="M8.464 15.536a5 5 0 0 1 0-7.072"></path>
    <path d="M5.636 18.364a9 9 0 0 1 0-12.728"></path>
  </svg>
);

export default ResonanceIcon;