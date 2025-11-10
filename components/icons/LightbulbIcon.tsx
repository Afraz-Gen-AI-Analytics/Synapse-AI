import React from 'react';

const LightbulbIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="M9 18h6"></path>
    <path d="M10 22h4"></path>
    <path d="M12 2a5 5 0 0 0-5 5c0 2.38 1.19 4.47 3 5.74V18h4v-5.26c1.81-1.27 3-3.36 3-5.74a5 5 0 0 0-5-5z"></path>
  </svg>
);

export default LightbulbIcon;