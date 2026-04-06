import ReactMarkdown from 'react-markdown';
import ChainOfThought from './ChainOfThought';
import './ChatMessage.css';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'message-user' : 'message-ai'}`}>
      {!isUser && (
        <div className="message-avatar">
          <span>🤖</span>
        </div>
      )}

      <div className="message-content-wrapper">
        {/* Chain of Thought — shown above AI's final answer */}
        {!isUser && message.steps && message.steps.length > 0 && (
          <ChainOfThought steps={message.steps} isProcessing={false} />
        )}

        {/* Message bubble */}
        <div className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-ai'}`}>
          {isUser ? (
            <p className="message-text">{message.content}</p>
          ) : (
            <div className="message-markdown">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="message-avatar avatar-user">
          <span>👤</span>
        </div>
      )}
    </div>
  );
}
