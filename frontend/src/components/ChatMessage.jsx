import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ChainOfThought from './ChainOfThought';
import './ChatMessage.css';

function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Syntax-highlighted code blocks
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              className="md-code-block"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="md-inline-code" {...props}>
              {children}
            </code>
          );
        },
        // External links open in new tab safely
        a({ node, children, href, ...props }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="md-link" {...props}>
              {children}
            </a>
          );
        },
        // Scrollable table container
        table({ node, children, ...props }) {
          return (
            <div className="md-table-wrapper">
              <table className="md-table" {...props}>{children}</table>
            </div>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'message-user' : 'message-ai'}`}>
      {!isUser && (
        <div className="message-avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
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
              <MarkdownContent content={message.content} />
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="message-avatar avatar-user">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      )}
    </div>
  );
}
