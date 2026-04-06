import React, { useEffect, useRef, useContext, useState } from 'react';
import mermaid from 'mermaid';
import { SettingsContext } from '../contexts/SettingsContext';
import './PresentationView.css';

const MermaidDiagram = ({ chart, id }) => {
  const containerRef = useRef(null);
  const { theme } = useContext(SettingsContext);
  const [svgCode, setSvgCode] = useState('');

  useEffect(() => {
    // Generate static ID for consistent rendering
    const renderId = `mermaid-render-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    mermaid.initialize({ 
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      fontFamily: 'Inter, system-ui, sans-serif',
      securityLevel: 'loose',
      themeVariables: {
        primaryTextColor: theme === 'dark' ? '#ffffff' : '#1e293b',
        lineColor: theme === 'dark' ? '#ffffff' : '#1e293b',
        secondaryColor: theme === 'dark' ? '#2d2d39' : '#f8fafc',
      }
    });

    const render = async () => {
      try {
        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        
        const { svg } = await mermaid.render(renderId, chart.trim());
        setSvgCode(svg);
      } catch (err) {
        console.error('Mermaid Render Exception:', err);
        // Fallback: If it fails, try simple flowchart without subroutine shapes
        try {
          const fallbackChart = chart.replace(/\[\[/g, '[').replace(/\]\]/g, ']');
          const { svg } = await mermaid.render(`${renderId}-fallback`, fallbackChart.trim());
          setSvgCode(svg);
        } catch (subErr) {
          setSvgCode('<p style="color: red; padding: 20px;">Diagram Render Error: Please refresh browser.</p>');
        }
      }
    };

    const timer = setTimeout(render, 100); // Small delay to ensure DOM is settled
    return () => clearTimeout(timer);
  }, [chart, theme, id]);

  return (
    <div 
      className="mermaid-container" 
      ref={containerRef} 
      dangerouslySetInnerHTML={{ __html: svgCode }}
      style={{ minHeight: '200px' }}
    />
  );
};

export default function PresentationView({ llmModel }) {
  const { t, theme, lang } = useContext(SettingsContext);

  const usecaseChart = lang === 'vi' ? `flowchart LR
    User((Người dùng))
    subagent[AI Agent]
    wea[[Open-Meteo API]]
    geo[[Mapbox Geocoding]]
    search[[Serper Web Search]]

    User -->|Nhập câu hỏi| subagent
    subagent -->|Tên TP| geo
    geo -->|Toạ độ| subagent
    subagent -->|Gửi Toạ độ| wea
    wea -->|Dự báo| subagent
    subagent -->|Từ khoá| search
    search -->|Web Kết quả| subagent
    subagent -->|Kế hoạch| User` : `flowchart LR
    User((User))
    subagent[AI Agent]
    wea[[Open-Meteo API]]
    geo[[Mapbox Geocoding]]
    search[[Serper Web Search]]

    User -->|Query| subagent
    subagent -->|City Name| geo
    geo -->|Coordinates| subagent
    subagent -->|Send Coords| wea
    wea -->|Forecast| subagent
    subagent -->|Keywords| search
    search -->|Web Results| subagent
    subagent -->|Final Plan| User`;

  const sequenceChart = `sequenceDiagram
    autonumber
    actor U as User
    participant V1 as V1 (Baseline)
    participant V2 as V2 (Basic)
    participant V3 as V3 (Advanced)
    participant T as Tools (API)

    U->>V1: ${lang === 'vi' ? 'Hỏi "Picnic Vũng Tàu?"' : 'Ask "Picnic Vung Tau?"'}
    V1->>U: ${lang === 'vi' ? 'Trả lời mò mẫm (KHÔNG TOOLS)' : 'Limited Answer (NO TOOLS)'}

    U->>V2: ${lang === 'vi' ? 'Hỏi "Picnic Vũng Tàu?"' : 'Ask "Picnic Vung Tau?"'}
    V2->>T: ${lang === 'vi' ? 'Ép LLM đẻ toạ độ & gọi weather' : 'Force LLM to guess coords'}
    T-->>V2: ${lang === 'vi' ? 'Nếu LLM Halucinate -> Crash!' : 'If Hallucinated -> Crash!'}
    V2->>U: ${lang === 'vi' ? 'Trả lời máy móc (Nếu pass)' : 'Robotic response (If pass)'}

    U->>V3: ${lang === 'vi' ? 'Hỏi "Picnic Vũng Tàu?"' : 'Ask "Picnic Vung Tau?"'}
    V3->>V3: ${lang === 'vi' ? 'Phân tích -> Trích xuất City' : 'Analyze -> Extract City'}
    V3->>T: ${lang === 'vi' ? 'Geocoding -> Lấy Toạ độ thực' : 'Geocoding -> Real Coords'}
    T-->>V3: (Lat, Lng)
    V3->>T: ${lang === 'vi' ? 'Weather -> Tình hình thời tiết' : 'Weather -> Fetch info'}
    T-->>V3: ${lang === 'vi' ? 'Nắng' : 'Sunny'}
    V3->>V3: ${lang === 'vi' ? 'Suy luận kế hoạch ngoài trời' : 'Reason about outdoor plan'}
    V3->>T: ${lang === 'vi' ? 'Search Web -> Điểm vui chơi' : 'Search Web -> Local gems'}
    T-->>V3: ${lang === 'vi' ? 'Top 3 bãi biển đẹp' : 'Top 3 beautiful beaches'}
    V3->>U: ${lang === 'vi' ? 'Kết luận hoàn hảo theo ReAct' : 'Perfect ReAct conclusion!'}`;

  const reactFlowchart = lang === 'vi' ? `stateDiagram-v2
    [*] --> THOUGHT
    THOUGHT --> ACTION: Ra quyết định Tool
    ACTION --> OBSERVATION: Kết quả API
    OBSERVATION --> THOUGHT: Phân tích tiếp
    THOUGHT --> FINAL_ANSWER: Nếu đủ dữ kiện
    FINAL_ANSWER --> [*]
    
    note right of THOUGHT
      Agent tự thoại
      để hiểu context
    end note` : `stateDiagram-v2
    [*] --> THOUGHT
    THOUGHT --> ACTION: Tool Selection
    ACTION --> OBSERVATION: API Response
    OBSERVATION --> THOUGHT: Further Reasoning
    THOUGHT --> FINAL_ANSWER: If enough data
    FINAL_ANSWER --> [*]
    
    note right of THOUGHT
      Agent reasons
      to understand context
    end note`;

  return (
    <div className="presentation-view">
      <div className="presentation-header">
        <h2>{t.systemArchitecture}</h2>
        <p>{t.analysingFlow.replace('...', '')} {llmModel.toUpperCase()}</p>
      </div>

      <div className="presentation-grid">
        <section className="diagram-card">
          <h3>{t.useCaseTitle}</h3>
          <p>{t.useCaseDesc}</p>
          <MermaidDiagram id="usecase" chart={usecaseChart} />
        </section>

        <section className="diagram-card">
          <h3>{t.reactFlowTitle}</h3>
          <p>{t.reactFlowDesc}</p>
          <MermaidDiagram id="reactflow" chart={reactFlowchart} />
        </section>
        
        <section className="diagram-card full-width">
          <h3>{t.seqTitle}</h3>
          <p>{t.seqDesc}</p>
          <MermaidDiagram id="seq" chart={sequenceChart} />
        </section>

        <section className="diagram-card full-width text-section">
          <h3>{t.conclusionTitle}</h3>
          <ul>
            <li><strong>{t.conclusion1.split(':')[0]}:</strong>{t.conclusion1.split(':')[1]}</li>
            <li><strong>{t.conclusion2.split(':')[0]}:</strong>{t.conclusion2.split(':')[1]}</li>
            <li><strong>{t.conclusion3.split(':')[0]}:</strong>{t.conclusion3.split(':')[1]}</li>
            <li><strong>{t.conclusion4.split(':')[0]}:</strong>{t.conclusion4.split(':')[1]}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
