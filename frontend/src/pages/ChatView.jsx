import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import ChainOfThought from '../components/ChainOfThought';
import { subscribeToSession, cleanupSession } from '../services/firebase';
import { sendMessage } from '../services/api';
import { SettingsContext } from '../contexts/SettingsContext';

export default function ChatView({ version, llmModel, isProcessing, setIsProcessing, initialMessages = [], onMessagesUpdate }) {
  const [messages, setMessages] = useState(initialMessages);
  const [currentSteps, setCurrentSteps] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const currentStepsRef = useRef([]);
  const { t, lang, userKeys, adminCode, setRateLimitStatus } = useContext(SettingsContext);

  // Sync initial messages when conversation changes
  useEffect(() => {
    setMessages(initialMessages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    currentStepsRef.current = currentSteps;
  }, [currentSteps]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentSteps]);

  const handleSend = useCallback(async (text) => {
    const sessionId = crypto.randomUUID();

    const newUserMsg = { role: 'user', content: text };
    const updatedWithUser = [...messages, newUserMsg];
    setMessages(updatedWithUser);
    onMessagesUpdate?.(updatedWithUser);
    setCurrentSteps([]);
    setIsProcessing(true);
    setError(null);

    const unsubscribe = subscribeToSession(sessionId, (step) => {
      setCurrentSteps(prev => {
        const newSteps = [...prev, step];
        currentStepsRef.current = newSteps;
        return newSteps;
      });
    });

    try {
      // Prepare history by sending only role and content (not steps)
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const result = await sendMessage(text, sessionId, version, llmModel, history, userKeys, adminCode);

      const aiMsg = {
        role: 'ai',
        content: result.finalAnswer || t.noResponse,
        steps: currentStepsRef.current,
      };
      const finalMessages = [...updatedWithUser, aiMsg];
      setMessages(finalMessages);
      onMessagesUpdate?.(finalMessages);
      
      // Update UI limit based on the response payload instantly
      if (result.rateLimitStatus) {
        setRateLimitStatus(result.rateLimitStatus);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || t.errorOccurred);

      if (currentStepsRef.current.length > 0) {
        const errMsg = {
          role: 'ai',
          content: `⚠️ ${lang === 'vi' ? 'Đã xảy ra lỗi' : 'An error occurred'}: ${err.message}`,
          steps: currentStepsRef.current,
        };
        const errMessages = [...updatedWithUser, errMsg];
        setMessages(errMessages);
        onMessagesUpdate?.(errMessages);
      }
      
      // If it's a 429 Error, the API may have returned the updated limit state
      if (err.rateLimitStatus) {
        setRateLimitStatus(err.rateLimitStatus);
      }
    } finally {
      unsubscribe();
      setIsProcessing(false);
      setCurrentSteps([]);
      setTimeout(() => cleanupSession(sessionId), 5000);
      // Removed refreshRateLimit() to avoid a redundant network call since the server payload now carries it.
    }
  }, [version, messages, llmModel, setIsProcessing, t, lang, userKeys, adminCode, onMessagesUpdate, setRateLimitStatus]);

  return (
    <>
      <main className="chat-area">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="gemini-welcome">
              <h1 className="gemini-title-gradient">
                <span className="sparkle-icon">✨</span> {lang === 'vi' ? 'Xin chào User!' : 'Hello User!'}
              </h1>
              <h2 className="gemini-subtitle">
                {lang === 'vi' ? 'Chúng ta nên bắt đầu từ đâu nhỉ?' : 'How can I help you today?'}
              </h2>

              <div className="gemini-suggestions">
                <button className="suggestion-chip" onClick={() => handleSend(lang === 'vi' ? 'Dựa theo dữ liệu, hãy gợi ý cho tôi 1 kế hoạch du lịch Đà Lạt vào cuối tháng này?' : 'Suggest a travel plan for Da Lat based on data.')}>
                  <span className="chip-icon">🏖️</span> {lang === 'vi' ? 'Gợi ý kế hoạch du lịch' : 'Suggest travel plan'}
                </button>
                <button className="suggestion-chip" onClick={() => handleSend(lang === 'vi' ? 'Hôm nay tại Hà Nội thì tôi nên làm gì?' : 'What should I do in Hanoi today?')}>
                  <span className="chip-icon">☀️</span> {lang === 'vi' ? 'Hôm nay nên làm gì?' : 'What should I do today?'}
                </button>
                <button className="suggestion-chip" onClick={() => handleSend(lang === 'vi' ? 'Top 10 địa điểm check-in hot nhất Đà Lạt' : 'Top 10 Instagrammable spots in Da Lat')}>
                  <span className="chip-icon">📸</span> {lang === 'vi' ? 'Địa điểm check-in' : 'Photo spots'}
                </button>
                <button className="suggestion-chip" onClick={() => handleSend(lang === 'vi' ? 'Review các quán hải sản ngon ở Nha Trang' : 'Review best seafood in Nha Trang')}>
                  <span className="chip-icon">🦐</span> {lang === 'vi' ? 'Quán ngon Nha Trang' : 'Seafood review'}
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {isProcessing && (
            <div className="live-cot-wrapper">
              <div className="message-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              </div>
              <div className="live-cot-content">
                <ChainOfThought steps={currentSteps} isProcessing={true} />
                {currentSteps.length === 0 && (
                  <div className="cot-initializing">
                    <span className="init-spinner" /><span>{t.initializing}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && !isProcessing && (
            <div className="error-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{marginLeft: 8}}>{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <ChatInput onSend={handleSend} disabled={isProcessing} hasMessages={messages.length > 0} />
    </>
  );
}
