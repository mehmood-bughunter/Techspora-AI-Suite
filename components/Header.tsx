
import React from 'react';
import { MicIcon, ImageIcon, SparklesIcon } from './Icons';

interface HeaderProps {
  activeTab: 'live' | 'image';
  setActiveTab: (tab: 'live' | 'image') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const commonButtonClasses = "px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const activeButtonClasses = "bg-green-500 text-white shadow-lg scale-105";
  const inactiveButtonClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white";

  return (
    <header className="w-full">
      <div className="flex flex-col items-center text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 md:w-10 md:h-10 animate-pulse" />
          Techspora AI Suite
        </h1>
        <p className="mt-2 text-lg text-gray-400">Digital Brilliance in Every Pixel.</p>
      </div>
      <nav className="flex justify-center bg-gray-800/50 backdrop-blur-sm p-2 rounded-lg gap-2 md:gap-4 border border-gray-700">
        <button
          onClick={() => setActiveTab('live')}
          className={`${commonButtonClasses} ${activeTab === 'live' ? activeButtonClasses : inactiveButtonClasses}`}
        >
          <MicIcon className="w-5 h-5" />
          Live Conversation
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`${commonButtonClasses} ${activeTab === 'image' ? activeButtonClasses : inactiveButtonClasses}`}
        >
          <ImageIcon className="w-5 h-5" />
          Image Generation
        </button>
      </nav>
    </header>
  );
};
