import React from 'react';

const Loader: React.FC<{ message?: string }> = ({ message = "Thinking..." }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4 bg-gray-800/50 rounded-lg">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="text-gray-300">{message}</p>
    </div>
  );
};

export default Loader;
