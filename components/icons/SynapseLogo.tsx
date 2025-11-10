import React from 'react';

const SynapseLogo: React.FC<{ className?: string; onClick?: () => void; }> = ({ className = "w-8 h-8", onClick }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'var(--gradient-start)', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: 'var(--gradient-end)', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M12 2a10 10 0 1 0 10 10" stroke="url(#logoGradient)" opacity="0.5"></path>
    <path d="M12 12m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0" stroke="url(#logoGradient)"></path>
    <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" fill="url(#logoGradient)" stroke="none"></path>
    
    <path d="M19.071 4.929l-1.414 1.414" stroke="url(#logoGradient)" opacity="0.7"></path>
    <path d="M4.929 19.071l1.414-1.414" stroke="url(#logoGradient)" opacity="0.7"></path>
    <path d="M4.929 4.929l1.414 1.414" stroke="url(#logoGradient)" opacity="0.7"></path>
    <path d="M17.657 17.657l1.414 1.414" stroke="url(#logoGradient)" opacity="0.7"></path>
  </svg>
);

export default SynapseLogo;