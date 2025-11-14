import React, { useState } from 'react';
import { geminiService } from '../../services/geminiService';
import FeatureWrapper from '../FeatureWrapper';
import ApiKeySelector from '../ApiKeySelector';
import ImageUploader from '../ImageUploader';
import Loader from '../Loader';

type GenerateMode = 'text' | 'image';

const VideoLab: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [keySelected, setKeySelected] = useState(false);
  const [mode, setMode] = useState<GenerateMode>('text');
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const mimeType = result.split(';')[0].split(':')[1];
        const data = result.split(',')[1];
        resolve({ data, mimeType });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    if (mode === 'image' && !imageFile) return;

    setIsLoading(true);
    setVideoUrl(null);
    setError(null);
    
    try {
      let imagePayload: {data: string, mimeType: string} | undefined;
      if (mode === 'image' && imageFile) {
        imagePayload = await fileToBase64(imageFile);
      }
      const url = await geminiService.generateVideo(prompt, imagePayload);
      setVideoUrl(url);
    } catch (e: any) {
      console.error("Video generation failed:", e);
      if (e.message && e.message.includes("Requested entity was not found.")) {
        setError("API Key error. Please re-select your key.");
        // This would be a good place to reset the key state if ApiKeySelector supported it.
      } else {
        setError("Failed to generate video. Please check the console for details.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureWrapper title="Video Lab" description="Create and understand video content from prompts or images." onBack={onBack}>
      <div className="w-full space-y-6">
        <ApiKeySelector onKeySelected={() => setKeySelected(true)}>
          {keySelected && (
            <div className="p-6 bg-gray-800 rounded-lg space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-gray-400">Generation Mode:</span>
                <button onClick={() => setMode('text')} className={`px-3 py-1 rounded-md text-sm ${mode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>From Text</button>
                <button onClick={() => setMode('image')} className={`px-3 py-1 rounded-md text-sm ${mode === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>From Image</button>
              </div>
              
              {mode === 'image' && <ImageUploader onImageUpload={setImageFile} title="Upload starting image" />}

              <textarea
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                rows={3}
                placeholder="e.g., A cinematic shot of a futuristic city at night."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />

              <button 
                onClick={handleGenerate} 
                disabled={isLoading || !prompt || (mode === 'image' && !imageFile)} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                {isLoading ? 'Generating Video...' : 'Generate Video'}
              </button>

              {error && <div className="text-red-400 text-center p-2 bg-red-900/50 rounded-md">{error}</div>}

              {isLoading && (
                  <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                      <Loader message="Generating video... This can take several minutes."/>
                      <p className="text-sm text-gray-400 mt-2">Feel free to grab a coffee, we're working on it!</p>
                  </div>
              )}

              {videoUrl && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-blue-300">Generated Video:</h3>
                  <video controls src={videoUrl} className="w-full rounded-lg"></video>
                </div>
              )}
            </div>
          )}
        </ApiKeySelector>
      </div>
    </FeatureWrapper>
  );
};

export default VideoLab;
