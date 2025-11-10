import React from 'react';

const VideoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    <path d="m22 8-6 4 6 4V8z"></path>
    <rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect>
  </svg>
);

export default VideoIcon;