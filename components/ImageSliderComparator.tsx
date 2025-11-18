import React, { useState, useRef, useCallback, useEffect } from 'react';
import SliderHandleIcon from './icons/SliderHandleIcon';

interface ImageSliderComparatorProps {
  before: string;
  after: string;
}

const ImageSliderComparator: React.FC<ImageSliderComparatorProps> = ({ before, after }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        let percentage = (x / rect.width) * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        setSliderPos(percentage);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleMove(e.clientX);
    }, [handleMove]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        handleMove(e.touches[0].clientX);
    }, [handleMove]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    const handleTouchEnd = useCallback(() => setIsDragging(false), []);
    
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchend', handleTouchEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, handleMouseMove, handleTouchMove, handleMouseUp, handleTouchEnd]);

    return (
        <div ref={containerRef} className="relative w-full h-full select-none rounded-md overflow-hidden bg-black/20"
            onMouseUp={handleMouseUp}
            onTouchEnd={handleTouchEnd}
        >
            <div className="w-full h-full flex items-center justify-center">
              <img src={before} alt="Before" className="max-w-full max-h-full object-contain pointer-events-none" />
            </div>
            
            <div
                className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                <img src={after} alt="After" className="max-w-full max-h-full object-contain pointer-events-none" />
            </div>

            <div
                className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-lg backdrop-blur-sm cursor-ew-resize">
                    <SliderHandleIcon className="w-6 h-6 text-slate-700" />
                </div>
            </div>
        </div>
    );
};

export default ImageSliderComparator;
