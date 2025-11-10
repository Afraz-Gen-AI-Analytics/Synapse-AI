import React from 'react';

const HourglassIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="M5 22h14"></path>
    <path d="M5 2h14"></path>
    <path d="M17 2v6l-5 5-5-5V2"></path>
    <path d="M7 16v-6l5 5 5-5v6"></path>
  </svg>
);

export default HourglassIcon;
