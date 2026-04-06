import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useContext, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ChatView from './pages/ChatView';
import CompareView from './pages/CompareView';
import PresentationView from './pages/PresentationView';
import ConversationSidebar from './components/ConversationSidebar';
import { SettingsContext } from './contexts/SettingsContext';
import {
  loadConversations, saveConversations, createConversation,
  updateConversation, togglePin
} from './services/conversationStorage';
import './App.css';

export default function App() {
  const [version, setVersion] = useState('v3');
  const [llmModel, setLlmModel] = useState('claude');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const location = useLocation();

  // Conversation management
  const [conversations, setConversations] = useState(() => {
    const loaded = loadConversations();
    if (loaded.length === 0) {
      const first = createConversation();
      saveConversations([first]);
      return [first];
    }
    return loaded;
  });
  const [activeConvId, setActiveConvId] = useState(() => conversations[0]?.id);
  const activeConversation = conversations.find(c => c.id === activeConvId);

  const handleNewConversation = useCallback((conv) => {
    // Intelligent Check: If a "New Chat" (empty) already exists, don't create another one
    const emptyConv = conversations.find(c => c.messages.length === 0);
    if (emptyConv) {
      setActiveConvId(emptyConv.id);
      return;
    }

    const newConv = conv || createConversation();
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== newConv.id);
      const updated = [newConv, ...filtered];
      saveConversations(updated);
      return updated;
    });
    setActiveConvId(newConv.id);
  }, [conversations]);

  const handleSelectConversation = useCallback((conv) => {
    setActiveConvId(conv.id);
    // Close sidebar on mobile after selecting
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const handleDeleteConversation = useCallback((id) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveConversations(updated);
      // If active conversation was deleted, switch to the first available or create new
      if (id === activeConvId) {
        if (updated.length > 0) {
          setActiveConvId(updated[0].id);
        } else {
          const first = createConversation();
          const newConvs = [first];
          saveConversations(newConvs);
          setConversations(newConvs);
          setActiveConvId(first.id);
        }
      }
      return updated;
    });
  }, [activeConvId]);

  const handleTogglePin = useCallback((id) => {
    setConversations(prev => {
      const updated = togglePin(prev, id);
      saveConversations(updated);
      return updated;
    });
  }, []);

  const handleMessagesUpdate = useCallback((messages) => {
    setConversations(prev => {
      const updated = updateConversation(prev, activeConvId, messages);
      saveConversations(updated);
      return updated;
    });
  }, [activeConvId]);

  const showSidebar = location.pathname === '/chat' || location.pathname === '/';

  return (
    <div className="app">
      <Header
        isProcessing={isProcessing}
        version={version} setVersion={setVersion}
        llmModel={llmModel} setLlmModel={setLlmModel}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
        showSidebarToggle={showSidebar}
      />

      <div className={`app-body ${showSidebar ? 'app-body--with-sidebar' : ''}`}>
        {showSidebar && (
          <>
            <div 
              className={`sidebar-mobile-backdrop ${sidebarOpen ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            />
            <ConversationSidebar
              conversations={conversations}
              activeId={activeConvId}
              onSelect={handleSelectConversation}
              onNew={handleNewConversation}
              onDelete={handleDeleteConversation}
              onTogglePin={handleTogglePin}
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(p => !p)}
            />
          </>
        )}

        <div className="app-main">
          <Routes>
            <Route
              path="/chat"
              element={
                <ChatView
                  key={activeConvId}
                  version={version}
                  llmModel={llmModel}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  initialMessages={activeConversation?.messages || []}
                  onMessagesUpdate={handleMessagesUpdate}
                />
              }
            />
            <Route
              path="/compare"
              element={<CompareView llmModel={llmModel} isProcessing={isProcessing} setIsProcessing={setIsProcessing} />}
            />
            <Route
              path="/presentation"
              element={<PresentationView llmModel={llmModel} />}
            />
            <Route path="*" element={<Navigate to="/chat" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
