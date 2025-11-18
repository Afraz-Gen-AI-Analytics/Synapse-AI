import React from 'react';

const DiamondIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="M6 3h12l4 6-10 12L2 9z"></path>
    <path d="M12 22L8 9l4-6 4 6"></path>
    <path d="M2 9h20"></path>
  </svg>
);

export default DiamondIcon;