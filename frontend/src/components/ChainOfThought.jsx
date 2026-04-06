import { useEffect, useRef } from 'react';
import ThoughtStep from './ThoughtStep';
import './ChainOfThought.css';

export default function ChainOfThought({ steps, isProcessing }) {
  const endRef = useRef(null);

  // Auto-scroll to bottom when new steps arrive
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [steps.length]);

  if (steps.length === 0 && !isProcessing) return null;

  return (
    <div className="chain-of-thought">
      <div className="cot-header">
        <div className="cot-header-left">
          <span className="cot-icon">🔗</span>
          <span className="cot-title">Chain of Thought</span>
          {isProcessing && (
            <span className="cot-processing">
              <span className="processing-dot" />
              <span className="processing-dot" />
              <span className="processing-dot" />
            </span>
          )}
        </div>
        <span className="cot-count">{steps.length} steps</span>
      </div>

      <div className="cot-steps">
        {steps.map((step, index) => (
          <ThoughtStep
            key={`${step.stepNumber}-${step.type}`}
            step={step}
            index={index}
            isLatest={index === steps.length - 1 && isProcessing}
          />
        ))}

        {isProcessing && steps.length > 0 && (
          <div className="cot-waiting">
            <div className="waiting-shimmer shimmer-loading" />
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
