import React from 'react';

const MegaphoneIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="M3 11h3l3 4v-8l-3 4H3z" fill="currentColor" opacity="0.3"></path>
    <path d="M12 15v-6a2 2 0 0 1 2-2h3.5a2.5 2.5 0 0 1 2.5 2.5v1A2.5 2.5 0 0 1 17.5 13H14"></path>
    <path d="M8 11L12.5 4.5"></path>
    <path d="M8 11l4.5 6.5"></path>
  </svg>
);

export default MegaphoneIcon;