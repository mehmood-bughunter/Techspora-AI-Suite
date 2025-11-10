
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { SparklesIcon, SpinnerIcon } from './Icons';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imageUrl = await generateImage(prompt);
      setGeneratedImage(imageUrl);
    } catch (err: any) {
      console.error('Image generation failed:', err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700/50">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A futuristic city skyline with flying cars, neon lights"
            className="flex-grow bg-gray-700 text-white rounded-md px-4 py-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-md shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isLoading ? (
              <>
                <SpinnerIcon className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate
              </>
            )}
          </button>
        </div>
      </form>

      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      
      <div className="mt-6 aspect-[1/1] bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden">
        {isLoading && (
          <div className="text-center text-gray-400">
            <SpinnerIcon className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>Your digital brilliance is being crafted...</p>
          </div>
        )}
        {generatedImage && !isLoading && (
          <img
            src={generatedImage}
            alt={prompt}
            className="w-full h-full object-contain"
          />
        )}
        {!generatedImage && !isLoading && (
            <div className="flex flex-col items-center justify-center text-gray-500 p-4">
                <SparklesIcon className="w-16 h-16 mb-4"/>
                <p className="text-lg text-center">Your generated image will appear here.</p>
                <p className="text-sm text-center">Let your imagination run wild!</p>
            </div>
        )}
      </div>
    </div>
  );
};
