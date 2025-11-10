import React from 'react';

const ReuseIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="M17 2.1l4 4-4 4"></path>
    <path d="M3 12.6v-2.6c0-3.3 2.7-6 6-6h12"></path>
    <path d="M7 21.9l-4-4 4-4"></path>
    <path d="M21 11.4v2.6c0 3.3-2.7 6-6 6H3"></path>
  </svg>
);

export default ReuseIcon;