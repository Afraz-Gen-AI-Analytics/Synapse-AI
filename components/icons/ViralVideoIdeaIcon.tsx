import React from 'react';

const ViralVideoIdeaIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="M14.5 7.9c.3-1 .2-2.3-.5-3.3s-2.3-1.2-3.3-.9c-.6.2-1.1.6-1.5 1.1" />
    <path d="M11 12.5v-2a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v2" />
    <path d="M11 14.5a1 1 0 0 0 1 1h0a1 1 0 0 0 1-1" />
    <path d="m22 8-6 4 6 4V8z" />
    <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
  </svg>
);

export default ViralVideoIdeaIcon;