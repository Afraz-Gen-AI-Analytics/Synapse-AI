import React from 'react';

const ProPlanIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Solid circle background, using the start of the theme gradient */}
    <circle cx="16" cy="16" r="15.5" fill="var(--gradient-start)" />
    
    {/* Larger and bolder Checkmark */}
    <path
      d="M9 16L15 22L24 13"
      stroke="white"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ProPlanIcon;