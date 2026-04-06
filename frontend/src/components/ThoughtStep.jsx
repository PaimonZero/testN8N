import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ThoughtStep.css';

const STEP_CONFIG = {
  thought: {
    icon: '🧠',
    label: 'Suy nghĩ',
    className: 'step-thought',
  },
  action: {
    icon: '⚡',
    label: 'Hành động',
    className: 'step-action',
  },
  observation: {
    icon: '👁️',
    label: 'Quan sát',
    className: 'step-observation',
  },
  final: {
    icon: '✅',
    label: 'Hoàn tất',
    className: 'step-final',
  },
};

/** Lightweight markdown renderer for CoT steps — no syntax highlighting to keep it fast */
function StepMarkdown({ children }) {
  if (!children) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Render paragraphs as spans to stay inline with step-text styling
        p: ({ node, children }) => <p className="step-text">{children}</p>,
        // Inline code
        code: ({ node, inline, children }) =>
          inline ? (
            <code className="step-inline-code">{children}</code>
          ) : (
            <pre className="step-code-block"><code>{children}</code></pre>
          ),
        // Links open externally
        a: ({ node, href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="step-link">
            {children}
          </a>
        ),
        strong: ({ node, children }) => <strong className="step-strong">{children}</strong>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

export default function ThoughtStep({ step, index, isLatest }) {
  const config = STEP_CONFIG[step.type] || STEP_CONFIG.thought;

  return (
    <div
      className={`thought-step ${config.className} ${isLatest ? 'latest' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Timeline connector */}
      <div className="step-timeline">
        <div className={`timeline-dot ${isLatest ? 'pulse' : ''}`}>
          <span className="dot-icon">{step.icon || config.icon}</span>
        </div>
        <div className="timeline-line" />
      </div>

      {/* Step content */}
      <div className="step-content">
        <div className="step-header">
          <span className="step-label">{config.label}</span>
          {step.tool && (
            <span className="tool-badge">
              {step.tool === 'Open-Meteo Weather API' ? '🌤️' : '🔍'} {step.tool}
            </span>
          )}
          <span className="step-number">#{step.stepNumber}</span>
        </div>

        <h4 className="step-title">{step.title}</h4>

        {step.content && (
          <div className="step-body">
            <StepMarkdown>{step.content}</StepMarkdown>
          </div>
        )}

        {/* Weather card embedded in observation */}
        {step.weather && (
          <div className="weather-inline">
            <span className="weather-icon">
              {step.weather.condition === 'sunny' ? '☀️' : '🌧️'}
            </span>
            <div className="weather-info">
              <span className="weather-desc">{step.weather.description}</span>
              <span className="weather-temp">
                {step.weather.minTemp}°C — {step.weather.maxTemp}°C
              </span>
            </div>
            <div className="weather-rain">
              <span className="rain-label">Mưa</span>
              <span className="rain-value">{step.weather.rainProbability}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
