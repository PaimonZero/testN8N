import { useState, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import './ChatInput.css';

const getSuggestions = (t) => [
  {
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect width="18" height="18" x="3" y="4" rx="2"/><circle cx="12" cy="10" r="2"/><line x1="8" x2="8" y1="2" y2="4"/><line x1="16" x2="16" y1="2" y2="4"/></svg>,
    label: t.suggestion1Label,
    text: t.suggestion1Text,
  },
  {
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
    label: t.suggestion2Label,
    text: t.suggestion2Text,
  },
  {
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 20 21 4 21 12 2"/><line x1="12" x2="12" y1="10" y2="15"/></svg>,
    label: t.suggestion3Label,
    text: t.suggestion3Text,
  },
];

export default function ChatInput({ onSend, disabled, hasMessages }) {
  const [text, setText] = useState('');
  const { t } = useContext(SettingsContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleSuggestion = (suggestion) => {
    if (!disabled) {
      onSend(suggestion);
    }
  };

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="input-field-wrapper">
            <textarea
              id="chat-input-field"
              className="chat-input-field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={t.typeMessage}
              disabled={disabled}
              rows={1}
            />
            <button
              id="send-button"
              type="submit"
              className="send-button"
              disabled={!text.trim() || disabled}
            >
              {disabled ? (
                <span className="send-spinner" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </form>

        {!hasMessages && (
          <div className="quick-suggestions">
            <span className="suggestions-label">💡 {t.tryQuick}</span>
            <div className="suggestions-list">
              {getSuggestions(t).map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSuggestion(s.text)}
                  disabled={disabled}
                >
                  <span className="suggestion-icon">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
