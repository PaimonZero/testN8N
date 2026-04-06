import { useState, useRef, useEffect, useContext } from 'react';
import ChatInput from '../components/ChatInput';
import ChainOfThought from '../components/ChainOfThought';
import { SettingsContext } from '../contexts/SettingsContext';
import { sendMessage } from '../services/api';
import { subscribeToSession, cleanupSession } from '../services/firebase';
import ReactMarkdown from 'react-markdown';
import './CompareView.css';

export default function CompareView({ llmModel, isProcessing, setIsProcessing }) {
  const [results, setResults] = useState(null); 
  const [error, setError] = useState(null);
  const [times, setTimes] = useState({ v1: 0, v2: 0, v3: 0 });
  const [steps, setSteps] = useState({ v1: [], v2: [], v3: [] });
  const [promptMsg, setPromptMsg] = useState('');
  const { t, lang } = useContext(SettingsContext);

  const stepsRef = useRef({ v1: [], v2: [], v3: [] });

  // Keep references in sync for async callbacks
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const runComparison = async (text) => {
    setIsProcessing(true);
    setResults(null);
    setError(null);
    setTimes({ v1: 0, v2: 0, v3: 0 });
    setSteps({ v1: [], v2: [], v3: [] });
    setPromptMsg(text);
    
    // UUIDs for logs
    const s1 = crypto.randomUUID();
    const s2 = crypto.randomUUID();
    const s3 = crypto.randomUUID();

    // Setup Firebase listeners
    const unsub1 = subscribeToSession(s1, (step) => {
      setSteps(prev => ({ ...prev, v1: [...prev.v1, step] }));
    });
    const unsub2 = subscribeToSession(s2, (step) => {
      setSteps(prev => ({ ...prev, v2: [...prev.v2, step] }));
    });
    const unsub3 = subscribeToSession(s3, (step) => {
      setSteps(prev => ({ ...prev, v3: [...prev.v3, step] }));
    });

    try {
      // Wrap in promises that also track time
      const timeApi = async (msg, session, version) => {
        const s = Date.now();
        const res = await sendMessage(msg, session, version, llmModel);
        const t = ((Date.now() - s) / 1000).toFixed(1);
        return { res, t };
      };

      const [v1, v2, v3] = await Promise.allSettled([
        timeApi(text, s1, 'v1'),
        timeApi(text, s2, 'v2'),
        timeApi(text, s3, 'v3')
      ]);

    setResults({
        v1: v1.status === 'fulfilled' ? v1.value.res.finalAnswer : (lang === 'vi' ? 'Lỗi: ' : 'Error: ') + v1.reason,
        v2: v2.status === 'fulfilled' ? v2.value.res.finalAnswer : (lang === 'vi' ? 'Lỗi: ' : 'Error: ') + v2.reason,
        v3: v3.status === 'fulfilled' ? v3.value.res.finalAnswer : (lang === 'vi' ? 'Lỗi: ' : 'Error: ') + v3.reason,
      });

      setTimes({
        v1: v1.status === 'fulfilled' ? v1.value.t : 'N/A',
        v2: v2.status === 'fulfilled' ? v2.value.t : 'N/A',
        v3: v3.status === 'fulfilled' ? v3.value.t : 'N/A',
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
      unsub1();
      unsub2();
      unsub3();
      setTimeout(() => {
        cleanupSession(s1);
        cleanupSession(s2);
        cleanupSession(s3);
      }, 5000);
    }
  };

  return (
    <div className="compare-view">
      <div className="compare-description">
        <h2>{t.compareHeading} ({llmModel === 'claude' ? 'Claude 3' : 'Gemini 1.5'})</h2>
        <p>{t.compareDesc}</p>
      </div>

      <div className="compare-grid">
        {/* V1 Column */}
        <div className="compare-col">
          <div className="compare-header">
            <h3>{t.v1Baseline}</h3>
            <span className="time-badge">{times.v1 ? `${times.v1}s` : '--'}</span>
          </div>
          <p className="col-desc">{lang === 'vi' ? 'Thuần tuý LLM Prompt: Không Tool, không Search.' : 'Pure LLM Prompt: No Tools, no Search.'}</p>
          <div className="compare-result-box">
            {promptMsg && (
              <div className="compare-user-message">
                <strong>User:</strong> {promptMsg}
              </div>
            )}
            
            {/* Real-time CoT Rendering */}
            {(steps.v1.length > 0 || (isProcessing && promptMsg)) && (
               <div className="compare-cot">
                  <ChainOfThought steps={steps.v1} isProcessing={isProcessing && !results?.v1} />
               </div>
            )}

            {results && <div className="markdown-content"><ReactMarkdown>{results.v1}</ReactMarkdown></div>}
          </div>
        </div>

        {/* V2 Column */}
        <div className="compare-col">
          <div className="compare-header">
            <h3>{t.v2Basic}</h3>
            <span className="time-badge">{times.v2 ? `${times.v2}s` : '--'}</span>
          </div>
          <p className="col-desc">{lang === 'vi' ? 'Naïve Tools: Có API nhưng dễ lỗi format (Crash).' : 'Naïve Tools: API included but prone to format errors.'}</p>
          <div className="compare-result-box">
            {promptMsg && (
              <div className="compare-user-message">
                <strong>User:</strong> {promptMsg}
              </div>
            )}

            {(steps.v2.length > 0 || (isProcessing && promptMsg)) && (
               <div className="compare-cot">
                  <ChainOfThought steps={steps.v2} isProcessing={isProcessing && !results?.v2} />
               </div>
            )}

            {results && <div className="markdown-content"><ReactMarkdown>{results.v2}</ReactMarkdown></div>}
          </div>
        </div>

        {/* V3 Column */}
        <div className="compare-col highlight-col">
          <div className="compare-header">
            <h3>{t.v3Advanced}</h3>
            <span className="time-badge">{times.v3 ? `${times.v3}s` : '--'}</span>
          </div>
          <p className="col-desc">{lang === 'vi' ? 'Mapbox Geocode, Guardrail Prompt, Logic chặt chẽ.' : 'Mapbox Geocode, Guardrail Prompt, Robust logic.'}</p>
          <div className="compare-result-box">
            {promptMsg && (
              <div className="compare-user-message">
                <strong>User:</strong> {promptMsg}
              </div>
            )}

            {(steps.v3.length > 0 || (isProcessing && promptMsg)) && (
               <div className="compare-cot">
                  <ChainOfThought steps={steps.v3} isProcessing={isProcessing && !results?.v3} />
               </div>
            )}

            {results && <div className="markdown-content"><ReactMarkdown>{results.v3}</ReactMarkdown></div>}
          </div>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="compare-input-area">
        <ChatInput 
          onSend={runComparison} 
          disabled={isProcessing} 
        />
      </div>
    </div>
  );
}
