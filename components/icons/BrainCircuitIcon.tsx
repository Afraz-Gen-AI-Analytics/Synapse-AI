import React from 'react';

const BrainCircuitIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M12 2a10 10 0 1010 10" opacity="0.4"></path>
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="var(--gradient-start)"></path>
        <path d="M12 12a4 4 0 110 8 4 4 0 010-8z" stroke="var(--gradient-end)"></path>
        <path d="M12 12h8" stroke="var(--gradient-end)"></path>
        <path d="M12 12H4" stroke="var(--gradient-start)"></path>
        <path d="M20 12a8 8 0 10-16 0" opacity="0.4"></path>
        <path d="M4.929 4.929l1.414 1.414" stroke="var(--gradient-start)" opacity="0.6"></path>
        <path d="M17.657 17.657l1.414 1.414" stroke="var(--gradient-end)" opacity="0.6"></path>
        <path d="M4.929 19.071l1.414-1.414" stroke="var(--gradient-start)" opacity="0.6"></path>
        <path d="M17.657 6.343l1.414-1.414" stroke="var(--gradient-end)" opacity="0.6"></path>
    </svg>
);

export default BrainCircuitIcon;
