import React, { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';
import { logger } from '../utils/logger';
import { measureSvgSize, prepareSvgForManualZoom } from '../utils/diagramZoom';

interface MermaidPanelProps {
  source: string;
  isRendering?: boolean;
  zoom: number;
}

interface DiagramContentSize {
  width: number;
  height: number;
}

let mermaidInitialized = false;

function ensureMermaidInitialized(): void {
  if (mermaidInitialized) {
    return;
  }
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    flowchart: {
      useMaxWidth: false,
      htmlLabels: true,
    },
  });
  mermaidInitialized = true;
}

function looksLikeMermaidSource(source: string): boolean {
  const trimmed = source.trimStart();
  return trimmed.startsWith('%%{')
    || /^graph[\s\n]/i.test(trimmed)
    || /^flowchart[\s\n]/i.test(trimmed);
}

const MermaidPanel: React.FC<MermaidPanelProps> = ({ source, isRendering = false, zoom }) => {
  const renderId = useId().replace(/:/g, '');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [svgMarkup, setSvgMarkup] = useState('');
  const [contentSize, setContentSize] = useState<DiagramContentSize | null>(null);
  const scale = zoom / 100;

  useEffect(() => {
    if (!source.trim() || !looksLikeMermaidSource(source)) {
      setRenderError(null);
      setSvgMarkup('');
      setContentSize(null);
      return;
    }

    let cancelled = false;

    const renderDiagram = async () => {
      ensureMermaidInitialized();
      setRenderError(null);
      setSvgMarkup('');
      setContentSize(null);

      try {
        const { svg } = await mermaid.render(`diagram-${renderId}`, source);
        if (cancelled) {
          return;
        }

        const container = document.createElement('div');
        container.innerHTML = svg.trim();
        const svgEl = container.querySelector('svg');
        if (!svgEl) {
          throw new Error('Mermaid did not return a valid SVG');
        }

        prepareSvgForManualZoom(svgEl);
        const measured = measureSvgSize(svgEl);
        setSvgMarkup(svgEl.outerHTML);
        setContentSize(measured);
        logger.debug('Mermaid diagram rendered', measured);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Mermaid render failed:', message);
        setRenderError(message);
        setSvgMarkup('');
        setContentSize(null);
      }
    };

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [source, renderId]);

  const showError = renderError && !isRendering;
  const stageStyle = contentSize
    ? {
        width: contentSize.width * scale,
        height: contentSize.height * scale,
      }
    : undefined;
  const diagramStyle = contentSize
    ? {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: contentSize.width,
        height: contentSize.height,
      }
    : undefined;

  return (
    <div className="diagram-panel" data-testid="diagram-output">
      {showError && (
        <div className="diagram-error" data-testid="diagram-error">
          Failed to render diagram: {renderError}
        </div>
      )}
      {svgMarkup && (
        <div className="mermaid-zoom-stage" style={stageStyle} data-diagram-zoom={zoom}>
          <div
            className="mermaid-diagram"
            style={diagramStyle}
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        </div>
      )}
    </div>
  );
};

export default MermaidPanel;
