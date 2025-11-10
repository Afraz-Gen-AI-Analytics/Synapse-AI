import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'right', className = '' }) => {
  const positionClasses = {
    right: 'left-full top-1/2 -translate-y-1/2 ml-4',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  };

  const baseClasses = 'absolute w-max max-w-xs px-3 py-1.5 text-center text-xs font-semibold rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10';
  
  const defaultStyling = !className ? 'bg-slate-800 text-slate-200' : '';

  return (
    <div className="relative group flex items-center">
      {children}
      <span className={`${baseClasses} ${positionClasses[position]} ${defaultStyling} ${className}`}>
        {text}
      </span>
    </div>
  );
};

export default Tooltip;