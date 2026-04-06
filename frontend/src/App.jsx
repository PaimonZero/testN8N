import { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import ChainOfThought from './components/ChainOfThought';
import { subscribeToSession, cleanupSession } from './services/firebase';
import { sendMessage } from './services/api';
import './App.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [currentSteps, setCurrentSteps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const currentStepsRef = useRef([]);

  // Keep ref in sync with state for use in async callbacks
  useEffect(() => {
    currentStepsRef.current = currentSteps;
  }, [currentSteps]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentSteps]);

  const handleSend = useCallback(async (text) => {
    // Generate unique session ID
    const sessionId = crypto.randomUUID();

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setCurrentSteps([]);
    setIsProcessing(true);
    setError(null);

    // 1. Subscribe to Firebase BEFORE calling N8N
    const unsubscribe = subscribeToSession(sessionId, (step) => {
      setCurrentSteps(prev => {
        const newSteps = [...prev, step];
        currentStepsRef.current = newSteps;
        return newSteps;
      });
    });

    try {
      // 2. Call N8N webhook (blocks until final answer)
      const result = await sendMessage(text, sessionId);

      // 3. Add AI response with embedded steps
      setMessages(prev => [...prev, {
        role: 'ai',
        content: result.finalAnswer || 'Không nhận được phản hồi từ agent.',
        steps: currentStepsRef.current,
      }]);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Đã xảy ra lỗi khi gọi agent.');

      // Still save whatever steps we got
      if (currentStepsRef.current.length > 0) {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: `⚠️ Đã xảy ra lỗi: ${err.message}. Dưới đây là các bước agent đã thực hiện trước khi lỗi.`,
          steps: currentStepsRef.current,
        }]);
      }
    } finally {
      // 4. Cleanup
      unsubscribe();
      setIsProcessing(false);
      setCurrentSteps([]);

      // Clean up Firebase data after a delay
      setTimeout(() => cleanupSession(sessionId), 5000);
    }
  }, []);

  return (
    <div className="app">
      <Header isProcessing={isProcessing} />

      <main className="chat-area">
        <div className="chat-messages">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="welcome">
              <div className="welcome-icon">🌤️</div>
              <h2 className="welcome-title">Weather Event Planner Agent</h2>
              <p className="welcome-desc">
                Tôi là AI Agent chuyên lên kế hoạch sự kiện dựa trên thời tiết.
                Hãy cho tôi biết bạn muốn tổ chức sự kiện gì, ở đâu và khi nào!
              </p>
              <div className="welcome-features">
                <div className="feature-card">
                  <span className="feature-icon">🧠</span>
                  <span className="feature-label">ReAct Reasoning</span>
                  <span className="feature-desc">Suy luận từng bước</span>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">🌤️</span>
                  <span className="feature-label">Weather API</span>
                  <span className="feature-desc">Dữ liệu thời tiết thực</span>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">🔍</span>
                  <span className="feature-label">Web Search</span>
                  <span className="feature-desc">Tìm kiếm địa điểm</span>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">⚡</span>
                  <span className="feature-label">Streaming CoT</span>
                  <span className="feature-desc">Xem AI suy nghĩ realtime</span>
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {/* Live Chain of Thought (while processing) */}
          {isProcessing && (
            <div className="live-cot-wrapper">
              <div className="message-avatar">
                <span>🤖</span>
              </div>
              <div className="live-cot-content">
                <ChainOfThought steps={currentSteps} isProcessing={true} />

                {currentSteps.length === 0 && (
                  <div className="cot-initializing">
                    <span className="init-spinner" />
                    <span>Đang khởi tạo agent...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error display */}
          {error && !isProcessing && (
            <div className="error-banner">
              <span>⚠️</span> {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSend={handleSend} disabled={isProcessing} />
    </div>
  );
}
