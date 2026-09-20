import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomeView from './views/HomeView';
import AssistantView from './views/AssistantView';
import PasswordView from './views/PasswordView';
import UrlView from './views/UrlView';
import EmailView from './views/EmailView';
import LearnView from './views/LearnView';
import SettingsView from './views/SettingsView';
import { askCyberAwareAI } from './lib/gemini';
import { getLocalFallback } from './lib/knowledge-base';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [theme, setTheme] = useState('dark');
  const [messages, setMessages] = useState([]);
  const [isAsking, setIsAsking] = useState(false);

  // Apply theme class to <html> root element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleSendMessage = async (text) => {
    if (!text || !text.trim() || isAsking) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAsking(true);

    // If user sent question from Home view, automatically switch to Assistant view
    if (activeTab === 'home') {
      setActiveTab('assistant');
    }

    // Call Gemini API with selected model
    const response = await askCyberAwareAI(text.trim(), selectedModel);
    setIsAsking(false);

    let aiText = '';
    let keyTakeaways = null;

    if (response.success) {
      aiText = response.text;
    } else {
      // Local fallback if offline or unreachable
      const fallback = getLocalFallback(text);
      aiText = `### ${fallback.title}\n\n${fallback.summary}\n\n${fallback.details}`;
      keyTakeaways = fallback.keyTakeaways;
    }

    const aiMsg = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiText,
      keyTakeaways: keyTakeaways,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleSelectAction = (actionId) => {
    setActiveTab(actionId);
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  return (
    <div className={`min-h-screen font-sans flex relative overflow-x-hidden selection:bg-emerald-accent/30 selection:text-white transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-obsidian text-white bg-noise bg-grid' 
        : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Fixed Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <TopBar 
          selectedModel={selectedModel} 
          setSelectedModel={setSelectedModel} 
          theme={theme}
          setTheme={setTheme}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeView 
              onSelectAction={handleSelectAction}
              onSendMessage={handleSendMessage}
              isAsking={isAsking}
            />
          )}

          {activeTab === 'assistant' && (
            <AssistantView 
              messages={messages}
              onSendMessage={handleSendMessage}
              isAsking={isAsking}
              onClearMessages={handleClearMessages}
            />
          )}

          {activeTab === 'password' && <PasswordView />}

          {activeTab === 'url' && (
            <UrlView onNavigateToEmail={() => setActiveTab('email')} />
          )}

          {activeTab === 'email' && <EmailView />}

          {activeTab === 'learn' && (
            <LearnView onAskQuestion={(q) => handleSendMessage(q)} />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              onClearHistory={handleClearMessages}
            />
          )}
        </main>
      </div>
    </div>
  );
}
