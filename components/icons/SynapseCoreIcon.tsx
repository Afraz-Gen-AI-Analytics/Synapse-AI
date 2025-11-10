import React from 'react';

const SynapseCoreIcon: React.FC<{ className?: string }> = ({ className = "w-24 h-24" }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <style>{`
            .core {
                width: 40%;
                height: 40%;
                border-radius: 50%;
                background: radial-gradient(circle, white 0%, var(--gradient-start) 60%, var(--gradient-end) 100%);
                box-shadow: 0 0 15px 2px var(--gradient-start);
                animation: core-pulse 2.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
            }
            @keyframes core-pulse {
                50% { transform: scale(1.03); box-shadow: 0 0 20px 3px var(--gradient-start); }
            }
            .ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                border: 2px solid;
                transform-style: preserve-3d;
            }
            .ring-1 {
                border-color: var(--gradient-start) transparent;
                animation: rotate 6s linear infinite;
            }
            .ring-2 {
                width: 80%;
                height: 80%;
                border-color: transparent var(--gradient-end);
                animation: rotate 8s linear infinite reverse;
            }
            .ring-3 {
                width: 60%;
                height: 60%;
                border-color: var(--gradient-start) var(--gradient-end);
                animation: rotate 10s linear infinite;
            }
            @keyframes rotate {
                from { transform: rotateX(70deg) rotateY(0deg) rotateZ(0deg); }
                to { transform: rotateX(70deg) rotateY(360deg) rotateZ(360deg); }
            }
            .spark {
                position: absolute;
                width: 3px;
                height: 3px;
                background: white;
                border-radius: 50%;
                box-shadow: 0 0 5px white;
                animation: orbit 4s linear infinite;
                opacity: 0;
            }
            @keyframes orbit {
                0% { transform: rotate(0deg) translateX(48%) rotate(-0deg) scale(0.5); opacity: 0.5; }
                50% { transform: rotate(180deg) translateX(48%) rotate(-180deg) scale(1); opacity: 1; }
                100% { transform: rotate(360deg) translateX(48%) rotate(-360deg) scale(0.5); opacity: 0.5; }
            }
            .spark-2 { animation-delay: -1s; animation-duration: 5s; }
            .spark-3 { animation-delay: -2s; animation-duration: 3s; }
            .spark-4 { animation-delay: -3s; animation-duration: 4.5s; transform-origin: 35% 35%; }
        `}</style>
        <div className="core"></div>
        <div className="ring ring-1"></div>
        <div className="ring ring-2"></div>
        <div className="ring ring-3"></div>
        <div className="spark spark-1"></div>
        <div className="spark spark-2"></div>
        <div className="spark spark-3"></div>
        <div className="spark spark-4"></div>
    </div>
);

export default SynapseCoreIcon;