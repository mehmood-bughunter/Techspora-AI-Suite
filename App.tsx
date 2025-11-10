
import React, { useState } from 'react';
import { Header } from './components/Header';
import { LiveConversation } from './components/LiveConversation';
import { ImageGenerator } from './components/ImageGenerator';

type ActiveTab = 'live' | 'image';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('live');

  return (
    <div className="min-h-screen bg-gray-900 font-sans flex flex-col items-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="mt-6">
          {activeTab === 'live' && <LiveConversation />}
          {activeTab === 'image' && <ImageGenerator />}
        </main>
      </div>
    </div>
  );
};

export default App;
