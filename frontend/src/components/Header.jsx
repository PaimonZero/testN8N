import './Header.css';

export default function Header({ isProcessing }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="header-icon">
            <span className="icon-emoji">🤖</span>
            <div className={`status-dot ${isProcessing ? 'active' : ''}`} />
          </div>
          <div className="header-text">
            <h1 className="header-title">Weather Event Planner</h1>
            <p className="header-subtitle">
              ReAct Agent · Streaming Chain of Thought
            </p>
          </div>
        </div>
        <div className="header-badges">
          <span className="badge badge-tool">
            <span className="badge-dot" style={{ background: '#22c55e' }} />
            Open-Meteo
          </span>
          <span className="badge badge-tool">
            <span className="badge-dot" style={{ background: '#3b82f6' }} />
            Google Search
          </span>
          <span className="badge badge-model">
            <span className="badge-dot" style={{ background: '#f59e0b' }} />
            Claude
          </span>
        </div>
      </div>
    </header>
  );
}
