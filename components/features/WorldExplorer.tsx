import React, { useState, useEffect } from 'react';
import { geminiService } from '../../services/geminiService';
import FeatureWrapper from '../FeatureWrapper';
import Loader from '../Loader';
import { GroundingSource } from '../../types';

const WorldExplorer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string>('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMaps, setUseMaps] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (useMaps && !location) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setError(null);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Could not get your location. Please enable location services in your browser. Using Search instead.");
          setUseMaps(false);
        }
      );
    }
  }, [useMaps, location]);

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResult('');
    setSources([]);
    setError(null);

    try {
      let response;
      if (useMaps && location) {
        response = await geminiService.groundedMapsSearch(prompt, location.lat, location.lng);
      } else {
        response = await geminiService.groundedSearch(prompt);
      }
      setResult(response.text);
      setSources(response.sources as GroundingSource[]);
    } catch (e: any) {
      console.error("Grounded search failed:", e);
      setError("An error occurred during the search. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureWrapper title="World Explorer" description="Get up-to-date, real-world info with Search and Maps grounding." onBack={onBack}>
      <div className="w-full space-y-6">
        <div className="p-6 bg-gray-800 rounded-lg space-y-4">
          <textarea
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none transition"
            rows={3}
            placeholder="e.g., Who won the latest F1 race? or What are some good cafes near me?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="use-maps" 
                checked={useMaps} 
                onChange={(e) => setUseMaps(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-yellow-600 focus:ring-yellow-500"
              />
              <label htmlFor="use-maps" className="text-gray-300">Use Google Maps (requires location)</label>
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading || !prompt}
              className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Searching...' : 'Explore'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        
        {isLoading && <Loader message="Exploring the world for answers..." />}

        {result && (
          <div className="p-6 bg-gray-800 rounded-lg space-y-4">
            <h3 className="text-xl font-bold text-yellow-300">Answer</h3>
            <p className="whitespace-pre-wrap text-gray-200">{result}</p>
            {sources.length > 0 && (
              <div>
                <h4 className="font-semibold text-yellow-400 mb-2">Sources:</h4>
                <ul className="space-y-2 list-disc list-inside">
                  {sources.map((source, index) => (
                    <li key={index} className="text-sm">
                      <a href={source.web?.uri || source.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {source.web?.title || source.maps?.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </FeatureWrapper>
  );
};

export default WorldExplorer;
