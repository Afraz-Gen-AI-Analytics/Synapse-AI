import React from 'react';

const BrainCircuitIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="12 2 15 12 12 22 9 12 12 2"></polygon>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

export default BrainCircuitIcon;