import React, { useEffect, useState } from 'react';
import { measureSvgSize, prepareSvgForManualZoom } from '../utils/diagramZoom';

interface SvgPanelProps {
  svg: string;
  zoom: number;
}

interface DiagramContentSize {
  width: number;
  height: number;
}

const SvgPanel: React.FC<SvgPanelProps> = ({ svg, zoom }) => {
  const [renderError, setRenderError] = useState<string | null>(null);
  const [svgMarkup, setSvgMarkup] = useState('');
  const [contentSize, setContentSize] = useState<DiagramContentSize | null>(null);
  const scale = zoom / 100;

  useEffect(() => {
    const trimmed = svg.trim();
    if (!trimmed) {
      setRenderError(null);
      setSvgMarkup('');
      setContentSize(null);
      return;
    }

    try {
      const container = document.createElement('div');
      container.innerHTML = trimmed;
      const svgEl = container.querySelector('svg');
      if (!svgEl) {
        throw new Error('Renderer did not return a valid SVG');
      }

      prepareSvgForManualZoom(svgEl);
      const measured = measureSvgSize(svgEl);
      setRenderError(null);
      setSvgMarkup(svgEl.outerHTML);
      setContentSize(measured);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRenderError(message);
      setSvgMarkup('');
      setContentSize(null);
    }
  }, [svg]);

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
      {renderError && (
        <div className="diagram-error" data-testid="diagram-error">
          Failed to render diagram: {renderError}
        </div>
      )}
      {svgMarkup && (
        <div className="mermaid-zoom-stage" style={stageStyle} data-diagram-zoom={zoom}>
          <div
            className="mermaid-diagram graphviz-diagram"
            style={diagramStyle}
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        </div>
      )}
    </div>
  );
};

export default SvgPanel;
