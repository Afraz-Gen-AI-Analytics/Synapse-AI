import React from 'react';

const AnalyticsIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="M3 3v18h18"></path>
    <path d="M18.7 8a5 5 0 0 1-6.4 0l-6.3 6.3"></path>
    <path d="M14 16.7a5 5 0 0 1-6.4 0"></path>
  </svg>
);

export default AnalyticsIcon;