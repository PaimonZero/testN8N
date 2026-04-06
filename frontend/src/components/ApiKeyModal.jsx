import { useState, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import './ApiKeyModal.css';

const FIELD_CONFIG = [
  { 
    key: 'geminiApiKey', label: 'Gemini API Key', placeholder: 'AIzaSy...', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      </svg>
    ), 
    hint: 'Lấy từ: aistudio.google.com' 
  },
  { 
    key: 'anthropicApiKey', label: 'Anthropic (Claude) API Key', placeholder: 'sk-ant-...', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12a14.5 14.5 0 0 0 20 0"/>
      </svg>
    ), 
    hint: 'Lấy từ: console.anthropic.com' 
  },
  { 
    key: 'mapboxApiKey', label: 'Mapbox API Key', placeholder: 'pk.eyJ1...', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
    ), 
    hint: 'Lấy từ: account.mapbox.com' 
  },
  { 
    key: 'serperApiKey', label: 'Serper API Key', placeholder: '807e3c...', 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ), 
    hint: 'Lấy từ: serper.dev' 
  },
];

export default function ApiKeyModal({ isOpen, onClose }) {
  const { userKeys, setUserKeys, adminCode, setAdminCode, rateLimitStatus, t } = useContext(SettingsContext);
  const [localKeys, setLocalKeys] = useState({ ...userKeys });
  const [localAdminCode, setLocalAdminCode] = useState(adminCode);
  const [showKeys, setShowKeys] = useState({});
  const [adminStatus, setAdminStatus] = useState('');

  if (!isOpen) return null;

  const allFilled = !!(localKeys.geminiApiKey?.trim() && localKeys.anthropicApiKey?.trim() && localKeys.mapboxApiKey?.trim() && localKeys.serperApiKey?.trim());
  const filledCount = FIELD_CONFIG.filter(f => localKeys[f.key]?.trim()).length;
  const newLimit = allFilled ? 100 : 50;

  function handleSave() {
    setUserKeys({ ...localKeys });
    setAdminCode(localAdminCode);
    setAdminStatus('✅ Đã lưu cấu hình');
    setTimeout(onClose, 800);
  }

  function handleClearKeys() {
    const empty = { geminiApiKey: '', anthropicApiKey: '', mapboxApiKey: '', serperApiKey: '' };
    setLocalKeys(empty);
    setUserKeys(empty);
  }

  function toggleShow(key) {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3L15.5 7.5z"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title">API Configuration</h2>
              <p className="modal-subtitle">Keys are stored in-memory and cleared on refresh.</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={`limit-banner ${allFilled ? 'limit-banner--full' : 'limit-banner--partial'}`}>
          <div className="limit-banner-info">
            <div className="limit-icon">
              {allFilled ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              )}
            </div>
            <div>
              <span className="limit-label">{filledCount}/4 keys active</span>
              <span className="limit-value">Limit: <strong>{newLimit} req/day</strong></span>
            </div>
          </div>
          {rateLimitStatus.remaining !== null && (
            <span className="limit-remaining">{rateLimitStatus.remaining} items left</span>
          )}
        </div>

        <div className="modal-fields">
          {FIELD_CONFIG.map(({ key, label, placeholder, icon, hint }) => {
            const filled = !!localKeys[key]?.trim();
            return (
              <div key={key} className="api-field">
                <label className="api-label">
                  <span className="api-icon">{icon} {label}</span>
                  {filled && <span className="api-badge">ACTIVE</span>}
                </label>
                <div className="api-input-wrap">
                  <input
                    type={showKeys[key] ? 'text' : 'password'}
                    className="api-input"
                    placeholder={placeholder}
                    value={localKeys[key]}
                    onChange={e => setLocalKeys(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                  <button className="api-toggle" onClick={() => toggleShow(key)}>
                    {showKeys[key] ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88 3.59 3.59"/><path d="m21 21-6.41-6.41"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="m3 3 18 18"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                <p className="api-hint">{hint}</p>
              </div>
            );
          })}
        </div>

        <div className="admin-section">
          <label className="api-label" style={{marginBottom: 8}}>
            <span className="api-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10h-10V2z"/><path d="M12 12L2.1 12.3"/><path d="M12 12l9.9.3"/><path d="M12 12l1.9-9.8"/><path d="M12 12l-1.9 9.8"/>
              </svg>
              Admin Bypass Code
            </span>
          </label>
          <div className="api-input-wrap">
            <input
              type={showKeys['admin'] ? 'text' : 'password'}
              className="api-input"
              placeholder="Enter master code..."
              value={localAdminCode}
              onChange={e => setLocalAdminCode(e.target.value)}
            />
            <button className="api-toggle" onClick={() => toggleShow('admin')}>
              {showKeys['admin'] ? '🙈' : '👁️'}
            </button>
          </div>
          {adminStatus && <p className="admin-status" style={{color: '#10b981', fontSize: '0.8rem', marginTop: 8}}>• {adminStatus}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClearKeys}>Clear Keys</button>
          <button className="btn-primary" onClick={handleSave}>Save Session Configuration</button>
        </div>
      </div>
    </div>
  );
}
