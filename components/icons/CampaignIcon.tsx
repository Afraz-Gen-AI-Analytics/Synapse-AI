import React from 'react';

const CampaignIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.05-3.1S6.01 15.65 4.5 16.5z"></path>
    <path d="M17.5 7.5c1.5-1.26 2-5 2-5s-3.74.5-5 2c-.71.84-.7 2.3-.05 3.1s2.3.71 3.05-.1z"></path>
    <path d="M22 2L2 22"></path>
    <path d="M7 17l5-5"></path>
    <path d="M12 12l5-5"></path>
  </svg>
);

export default CampaignIcon;