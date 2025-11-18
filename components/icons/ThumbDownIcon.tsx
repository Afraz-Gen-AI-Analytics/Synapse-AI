import React from 'react';

const ThumbDownIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.77a2 2 0 0 0-1.94 1.51l-2.55 7.65a2 2 0 0 0 .02 1.57c.42.85 1.32 1.27 2.18 1.27H10z" transform="scale(1, -1) translate(0, -24)" />
  </svg>
);

export default ThumbDownIcon;