import React from 'react';

const DeployIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
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
    <path d="M15.22 2H8.78a3.7 3.7 0 0 0-3.54 5.3L3 13.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4.5l-2.24-6.2A3.7 3.7 0 0 0 15.22 2z" />
    <path d="M9 12H8m8 0h-1" />
  </svg>
);

export default DeployIcon;