import React, { useState, useEffect, useCallback } from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
  children: React.ReactNode;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected, children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkKey = useCallback(async () => {
    try {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const keyStatus = await window.aistudio.hasSelectedApiKey();
        setHasKey(keyStatus);
        if (keyStatus) {
            onKeySelected();
        }
      } else {
        setError("AI Studio SDK not available. Please run this in the correct environment.");
        setHasKey(false);
      }
    } catch (e) {
      console.error("Error checking API key:", e);
      setError("An error occurred while checking for an API key.");
      setHasKey(false);
    }
  }, [onKeySelected]);

  useEffect(() => {
    checkKey();
  }, [checkKey]);

  const handleSelectKey = async () => {
    try {
       if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        // Assume success and optimistically update UI
        setHasKey(true);
        onKeySelected();
       } else {
         setError("AI Studio SDK not available.");
       }
    } catch (e) {
      console.error("Error opening key selector:", e);
      setError("Could not open the API key selector.");
    }
  };

  if (hasKey === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">API Key Required for Veo</h3>
        <p className="mb-4 text-gray-400">
          Video generation with Veo requires you to select a Google AI API key. This will be used for billing purposes.
        </p>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <button
          onClick={handleSelectKey}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Select API Key
        </button>
        <p className="text-xs text-gray-500 mt-4">
          Learn more about <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">billing for Gemini API</a>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApiKeySelector;
