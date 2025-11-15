import React from 'react';

const ProFeatureBadge: React.FC<{ className?: string }> = ({ className }) => (
    <span className={`bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center ${className}`}>
        PRO
    </span>
);

export default ProFeatureBadge;