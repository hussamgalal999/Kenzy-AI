import React, { useState } from 'react';
import { geminiService } from '../../services/geminiService';
import FeatureWrapper from '../FeatureWrapper';
import Loader from '../Loader';

const DeepThinker: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const examplePrompts = [
    "Explain the theory of relativity as if I'm a high school student.",
    "Generate a business plan for a sustainable energy startup.",
    "Write a short story in the style of Edgar Allan Poe."
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResult('');
    setError(null);

    try {
      const response = await geminiService.generateTextWithThinking(prompt);
      setResult(response);
    } catch (e: any) {
      console.error("Deep Thinker failed:", e);
      setError("An error occurred. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureWrapper title="Deep Thinker" description="Tackle complex problems with advanced reasoning capabilities." onBack={onBack}>
      <div className="w-full space-y-6">
        <div className="p-6 bg-gray-800 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-rose-300">Your Complex Query</h3>
          <textarea
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none transition"
            rows={6}
            placeholder="Enter a complex prompt that requires deep reasoning..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
           <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-gray-400">Try an example:</div>
             <div className="flex flex-wrap gap-2">
              {examplePrompts.map((p, i) => (
                <button key={i} onClick={() => setPrompt(p)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-md transition-colors">
                  "{p.substring(0,25)}..."
                </button>
              ))}
            </div>
           </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Thinking Deeply...' : 'Generate Response'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        
        {isLoading && <Loader message="Processing complex thought..." />}

        {result && (
          <div className="p-6 bg-gray-800 rounded-lg space-y-4">
            <h3 className="text-xl font-bold text-rose-300">Generated Response</h3>
            <div className="prose prose-invert max-w-none text-gray-200 whitespace-pre-wrap">{result}</div>
          </div>
        )}
      </div>
    </FeatureWrapper>
  );
};

export default DeepThinker;
