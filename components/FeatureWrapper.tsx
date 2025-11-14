import React from 'react';
import { BackArrowIcon } from './icons';

interface ViewWrapperProps {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
  description?: string;
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ title, children, onBack, description }) => {
  return (
    <div className="p-4 sm:p-6 md:p-8 animate-fade-in h-full flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4 font-semibold"
        >
          <BackArrowIcon />
          Back
        </button>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{title}</h1>
        {/* FIX: Render the description if it exists */}
        {description && <p className="text-gray-500 mt-2">{description}</p>}
      </div>
      <div className="flex-grow overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default ViewWrapper;