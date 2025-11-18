import React from 'react';

interface ImageComparatorProps {
  before: string | null;
  after: string;
}

const ImageComparator: React.FC<ImageComparatorProps> = ({ before, after }) => {
  if (!before) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold text-center text-slate-400 mb-2">Before</h3>
        <div className="flex-1 bg-black/20 rounded-md p-2 flex items-center justify-center">
            <img src={before} alt="Original" className="max-w-full max-h-full object-contain rounded-sm" />
        </div>
      </div>
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold text-center text-slate-400 mb-2">After</h3>
         <div className="flex-1 bg-black/20 rounded-md p-2 flex items-center justify-center">
            <img src={after} alt="Edited" className="max-w-full max-h-full object-contain rounded-sm" />
        </div>
      </div>
    </div>
  );
};

export default ImageComparator;
