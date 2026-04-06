import { useState, useContext, useMemo } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { createConversation } from '../services/conversationStorage';
import './ConversationSidebar.css';

export default function ConversationSidebar({ conversations, activeId, onSelect, onNew, onDelete, onTogglePin, isOpen, onToggle }) {
  const { lang } = useContext(SettingsContext);
  const [hoveredId, setHoveredId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const t = {
    vi: {
      newChat: 'Cuộc trò chuyện mới',
      recent: 'Cuộc trò chuyện',
      pinned: 'Đã ghim',
      search: 'Tìm kiếm lịch sử...',
      empty: 'Không tìm thấy kết quả'
    },
    en: {
      newChat: 'New chat',
      recent: 'Recent',
      pinned: 'Pinned',
      search: 'Search history...',
      empty: 'No results found'
  }}[lang] || {
    newChat: 'New chat',
    recent: 'Recent',
    pinned: 'Pinned',
    search: 'Search history...',
    empty: 'No results found'
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const pinnedConvs = useMemo(() => filteredConversations.filter(c => c.isPinned), [filteredConversations]);
  const recentConvs = useMemo(() => filteredConversations.filter(c => !c.isPinned), [filteredConversations]);

  function handleNew() {
    onNew();
  }

  function handleDelete(e, id) {
    e.stopPropagation();
    onDelete(id);
  }

  function handleTogglePin(e, id) {
    e.stopPropagation();
    onTogglePin(id);
  }

  function handleSearchClick(e) {
    e.stopPropagation();
    setShowSearch(prev => !prev);
    if (showSearch) setSearchQuery('');
  }

  return (
    <aside className={`gemini-sidebar ${isOpen ? 'expanded' : 'collapsed'}`}>
      {/* Header Area */}
      <div className="sidebar-header-nav" style={{ justifyContent: 'flex-end' }}>
        {!showSearch ? (
          <>
            {isOpen && (
              <button className="nav-icon-btn search-btn" onClick={handleSearchClick} title={t.search}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            )}
          </>
        ) : (
          <div className="sidebar-search-container">
            <input
              type="text"
              autoFocus
              className="sidebar-search-input"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-close-btn" onClick={handleSearchClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Primary Actions */}
      <div className="sidebar-prime-actions">
        <button className="prime-action-item new-chat-btn" onClick={handleNew} title={t.newChat}>
          <div className="prime-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          {isOpen && <span className="prime-label">{t.newChat}</span>}
        </button>
      </div>

      {/* History List */}
      <div className="sidebar-history-area">
        <div className="history-entries-scroll">
          {filteredConversations.length === 0 && searchQuery && (
             <div className="history-empty">{t.empty}</div>
          )}

          {/* Pinned Items */}
          {pinnedConvs.length > 0 && isOpen && <div className="history-section-header">{t.pinned}</div>}
          {pinnedConvs.map(conv => (
            <div
              key={conv.id}
              role="button"
              tabIndex={0}
              className={`history-entry-item ${conv.id === activeId ? 'active' : ''}`}
              onClick={() => onSelect(conv)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(conv)}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={conv.title}
            >
              <div className="entry-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              {isOpen && <span className="entry-label">{conv.title}</span>}
              {isOpen && (
                <div className="entry-actions">
                  <button type="button" className="entry-mini-btn" onClick={(e) => handleTogglePin(e, conv.id)} title="Unpin">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" pointerEvents="none">
                        <path d="M16 4.5V11l2 2v2h-4.5v4.5L12 20l-1.5-1.5V15H6v-2l2-2V4.5l-1-1v-1h10v1l-1 1z"/>
                     </svg>
                  </button>
                  <button type="button" className="entry-delete-btn" onClick={(e) => handleDelete(e, conv.id)} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Recent Items */}
          {isOpen && <div className="history-section-header">{t.recent}</div>}
          {recentConvs.map(conv => (
            <div
              key={conv.id}
              role="button"
              tabIndex={0}
              className={`history-entry-item ${conv.id === activeId ? 'active' : ''}`}
              onClick={() => onSelect(conv)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(conv)}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={conv.title}
            >
              <div className="entry-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              {isOpen && <span className="entry-label">{conv.title}</span>}
               {isOpen && (
                <div className="entry-actions">
                  <button type="button" className="entry-mini-btn" onClick={(e) => handleTogglePin(e, conv.id)} title="Pin">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
                      <path d="M16 4.5V11l2 2v2h-4.5v4.5L12 20l-1.5-1.5V15H6v-2l2-2V4.5l-1-1v-1h10v1l-1 1z"/>
                    </svg>
                  </button>
                  <button type="button" className="entry-delete-btn" onClick={(e) => handleDelete(e, conv.id)} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom area removed per request */}
    </aside>
  );
}
