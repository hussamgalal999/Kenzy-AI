import React, { useState, useCallback } from 'react';
import { geminiService } from '../../services/geminiService';
import FeatureWrapper from '../FeatureWrapper';
import ImageUploader from '../ImageUploader';
import Loader from '../Loader';
import { AspectRatio } from '../../types';

type Tab = 'generate' | 'edit' | 'analyze';

const ImageStudio: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  const [generatePrompt, setGeneratePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [editPrompt, setEditPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [analyzePrompt, setAnalyzePrompt] = useState('Describe this image in detail.');
  const [imageToAnalyze, setImageToAnalyze] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    if (!generatePrompt) return;
    setIsGenerating(true);
    setGeneratedImages([]);
    try {
      const images = await geminiService.generateImage(generatePrompt, aspectRatio);
      setGeneratedImages(images);
    } catch (error) {
      console.error('Image generation failed:', error);
      alert('Failed to generate image. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleEdit = async () => {
    if (!editPrompt || !originalImage) return;
    setIsEditing(true);
    setEditedImage(null);
    try {
      const imageData = await fileToBase64(originalImage);
      const result = await geminiService.editImage(editPrompt, imageData);
      setEditedImage(result);
    } catch (error) {
      console.error('Image editing failed:', error);
      alert('Failed to edit image. See console for details.');
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleAnalyze = async () => {
    if (!analyzePrompt || !imageToAnalyze) return;
    setIsAnalyzing(true);
    setAnalysisResult('');
    try {
      const imageData = await fileToBase64(imageToAnalyze);
      const result = await geminiService.analyzeImage(analyzePrompt, imageData);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Image analysis failed:', error);
      alert('Failed to analyze image. See console for details.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const renderTabContent = () => {
    switch(activeTab) {
      case 'generate':
        return (
          <div className="space-y-4">
            <textarea
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              rows={3}
              placeholder="e.g., A photo of a cat wearing a tiny wizard hat."
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-gray-400">Aspect Ratio:</label>
              {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map(ar => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`px-3 py-1 rounded-md text-sm ${aspectRatio === ar ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >{ar}</button>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={isGenerating || !generatePrompt} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </button>
            {isGenerating && <Loader message="Creating visuals..." />}
            {generatedImages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {generatedImages.map((src, index) => <img key={index} src={src} alt={`Generated image ${index + 1}`} className="rounded-lg w-full" />)}
              </div>
            )}
          </div>
        );
      case 'edit':
        return (
           <div className="space-y-4">
            <ImageUploader onImageUpload={setOriginalImage} title="Upload image to edit" />
            <textarea
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              rows={2}
              placeholder="e.g., Add a retro filter, make it black and white."
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
            />
            <button onClick={handleEdit} disabled={isEditing || !editPrompt || !originalImage} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
              {isEditing ? 'Applying edit...' : 'Edit Image'}
            </button>
            {isEditing && <Loader message="Applying magic touch..." />}
            {editedImage && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Edited Image:</h3>
                <img src={editedImage} alt="Edited result" className="rounded-lg w-full" />
              </div>
            )}
          </div>
        );
      case 'analyze':
        return (
          <div className="space-y-4">
            <ImageUploader onImageUpload={setImageToAnalyze} title="Upload image to analyze" />
            <textarea
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              rows={2}
              placeholder="e.g., What is in this image?"
              value={analyzePrompt}
              onChange={(e) => setAnalyzePrompt(e.target.value)}
            />
            <button onClick={handleAnalyze} disabled={isAnalyzing || !analyzePrompt || !imageToAnalyze} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
              {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
            </button>
            {isAnalyzing && <Loader message="Examining pixels..." />}
            {analysisResult && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2 text-purple-300">Analysis Result:</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{analysisResult}</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <FeatureWrapper title="Image Studio" description="Generate, edit, and analyze images with powerful AI models." onBack={onBack}>
      <div className="w-full">
        <div className="mb-6 border-b border-gray-700">
          <nav className="-mb-px flex space-x-6">
            {(['generate', 'edit', 'analyze'] as Tab[]).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        <div>
          {renderTabContent()}
        </div>
      </div>
    </FeatureWrapper>
  );
};

export default ImageStudio;
