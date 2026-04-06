import { useState } from 'react';
import './ChatInput.css';

const QUICK_SUGGESTIONS = [
  {
    label: '🏖️ Team building Vũng Tàu',
    text: 'Tôi muốn tổ chức team building vào thứ 7 tới ở Vũng Tàu. Kiểm tra thời tiết, nếu nắng hãy gợi ý 3 bãi tắm đẹp, nếu mưa hãy gợi ý 3 nhà hàng hải sản có mái che.',
  },
  {
    label: '🌴 Du lịch Đà Nẵng',
    text: 'Cuối tuần này tôi muốn đi Đà Nẵng. Kiểm tra thời tiết, nếu nắng gợi ý 3 bãi biển đẹp, nếu mưa gợi ý 3 quán cà phê view đẹp có mái che.',
  },
  {
    label: '🏔️ Picnic Đà Lạt',
    text: 'Tôi dự định đi picnic ở Đà Lạt vào chủ nhật tới. Kiểm tra thời tiết, nếu nắng gợi ý 3 đồi cỏ/vườn hoa check-in, nếu mưa gợi ý 3 quán ăn ấm cúng trong nhà.',
  },
];

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');

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
              placeholder="Nhập yêu cầu lên kế hoạch sự kiện..."
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

        <div className="quick-suggestions">
          <span className="suggestions-label">💡 Thử nhanh:</span>
          <div className="suggestions-list">
            {QUICK_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="suggestion-chip"
                onClick={() => handleSuggestion(s.text)}
                disabled={disabled}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
