import { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SettingsContext } from '../contexts/SettingsContext';
import ApiKeyModal from './ApiKeyModal';
import './Header.css';

export default function Header({ isProcessing, version, setVersion, llmModel, setLlmModel, sidebarOpen, onToggleSidebar, showSidebarToggle }) {
  const location = useLocation();
  const { theme, setTheme, lang, setLang, t, userKeys, rateLimitStatus } = useContext(SettingsContext);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  const hasAllKeys = !!(
    userKeys.geminiApiKey && userKeys.anthropicApiKey &&
    userKeys.mapboxApiKey && userKeys.serperApiKey
  );

  const limitColor = rateLimitStatus.remaining !== null
    ? rateLimitStatus.remaining < 5 ? '#ef4444'
      : rateLimitStatus.remaining < 15 ? '#f59e0b'
      : 'var(--color-accent)'
    : 'var(--color-text-muted)';

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-title-group">
              <div className="header-brand-area">
                {showSidebarToggle && (
                  <button className="sidebar-open-btn" onClick={onToggleSidebar} aria-label="Toggle Sidebar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              <div className="header-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
                <div className={`status-dot ${isProcessing ? 'active' : ''}`} />
              </div>
              <h1 className="header-title">{t.appTitle}</h1>
            </div>

            <div className="header-nav">
              <Link to="/chat" className={`nav-link ${location.pathname === '/chat' || location.pathname === '/' ? 'active' : ''}`}>
                {t.interactiveChat}
              </Link>
              <Link to="/compare" className={`nav-link ${location.pathname === '/compare' ? 'active' : ''}`}>
                {t.compareModels}
              </Link>
              <Link to="/presentation" className={`nav-link ${location.pathname === '/presentation' ? 'active' : ''}`}>
                {lang === 'vi' ? 'Sơ đồ' : 'Diagrams'}
              </Link>
            </div>
          </div>

          <div className="header-right">
            {(location.pathname === '/chat' || location.pathname === '/') && setVersion && (
              <div className="select-wrapper">
                <select
                  className="premium-select"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="v1">Baseline V1</option>
                  <option value="v2">Basic V2</option>
                  <option value="v3">Advanced V3</option>
                </select>
              </div>
            )}

            {setLlmModel && (
              <div className="select-wrapper">
                <select
                  className="premium-select"
                  value={llmModel}
                  onChange={e => setLlmModel(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="claude">Claude 3 Haiku</option>
                  <option value="gemini">Gemini 2.5 Flash</option>
                </select>
              </div>
            )}

            <div className="header-badges">
              {rateLimitStatus.remaining !== null && (
                <div className="pill-badge pill-badge--limit" style={{ borderColor: `${limitColor}40` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={limitColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span className="pill-text">
                    <strong style={{ color: limitColor }}>{rateLimitStatus.remaining}</strong>
                    <span className="pill-separator">/</span>
                    <span>{rateLimitStatus.limit}</span>
                  </span>
                </div>
              )}

              <button
                className={`pill-badge pill-badge--action ${hasAllKeys ? 'pill-badge--active' : ''}`}
                onClick={() => setApiKeyModalOpen(true)}
                title="Quản lý API Keys"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3L15.5 7.5z"/>
                </svg>
                <span>API Keys</span>
                {hasAllKeys && <div className="indicator-dot" />}
              </button>

              <button className="tool-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={t.theme}>
                {theme === 'dark'
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                }
              </button>

              <button className="tool-btn" onClick={() => setLang(lang === 'en' ? 'vi' : 'en')} title={t.lang}>
                <span className="lang-text">{lang.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
    </>
  );
}
