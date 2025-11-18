

import React from 'react';
import SynapseCoreIcon from './icons/SynapseCoreIcon';

const SynapseVisualizer: React.FC = () => {
    return (
        <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="relative w-full h-full">
                {/* Glow effect for the icon itself */}
                <div 
                    className={`absolute -inset-3 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] transition-all duration-1000`}
                    style={{ filter: 'blur(32px)', opacity: 0.2 }}
                ></div>
                
                {/* The icon itself, without any extra background div */}
                <div className="w-full h-full flex items-center justify-center">
                    <SynapseCoreIcon className={`w-28 h-28 opacity-90 transition-transform duration-1000 animate-visualizer-pulse`} />
                </div>
            </div>
        </div>
    );
};

export default SynapseVisualizer;