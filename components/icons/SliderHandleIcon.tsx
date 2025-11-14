import React from 'react';

const SliderHandleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="M8 5L5 8L8 11" />
    <path d="M16 5L19 8L16 11" />
  </svg>
);

export default SliderHandleIcon;
