import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useWasmContext } from '../contexts/WasmContext';
import { useSettingsContext } from '../contexts/SettingsContext';
import { computeFitDiagramZoom, measureSvgSize } from '../utils/diagramZoom';
import { logger } from '../utils/logger';
import { CharacterRuler } from './CharacterRuler';
import { OutputActionButtons } from './OutputActionButtons';
import MermaidPanel from './MermaidPanel';
import SvgPanel from './SvgPanel';
import { OUTPUT_DOWNLOAD } from '../utils/downloadFile';
import { useDiagramZoomGestures } from '../hooks/useDiagramZoomGestures';
import { useScrollTracking } from '../hooks/useScrollTracking';

const OutputPanel: React.FC = () => {
  const { asciiOutput, diagramOutput, svgOutput, message, isRendering } = useAppContext();
  const { isLoading: isWasmLoading } = useWasmContext();
  const { fontSize, diagramZoom, setDiagramZoom, outputView, registerDiagramFitHandler } = useSettingsContext();
  const isLoading = isWasmLoading || isRendering;
  const isDiagramView = outputView === 'diagram';
  const isSvgView = outputView === 'svg';
  const isZoomableView = isDiagramView || isSvgView;
  const activeOutput = isDiagramView ? diagramOutput : isSvgView ? svgOutput : asciiOutput;

  const preRef = useRef<HTMLPreElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const diagramScrollRef = useRef<HTMLDivElement>(null);

  useDiagramZoomGestures({
    containerRef: diagramScrollRef,
    enabled: isZoomableView && Boolean(activeOutput),
    diagramZoom,
    setDiagramZoom,
  });

  const { scrollLeft, rulerWidth } = useScrollTracking(
    preRef,
    codeRef,
    isZoomableView ? '' : asciiOutput,
    fontSize,
    "Consolas, 'Courier New', Courier, monospace"
  );

  if (isWasmLoading || isRendering) {
    logger.debug('OutputPanel loading state:', { isWasmLoading, isRendering });
  }

  useEffect(() => {
    if (isLoading) {
      logger.debug('OutputPanel is showing loading indicator');
    } else if (message && !activeOutput) {
      logger.info('OutputPanel is showing message:', message);
    } else if (activeOutput) {
      logger.info('OutputPanel is showing output, length:', activeOutput.length, 'view:', outputView);
    } else {
      logger.debug('OutputPanel is in an undefined state - no loading, no message, no output');
    }
  }, [isLoading, message, activeOutput, outputView]);

  useEffect(() => {
    registerDiagramFitHandler(() => {
      const container = diagramScrollRef.current;
      const svg = container?.querySelector('[data-testid="diagram-output"] svg');
      if (!container || !(svg instanceof SVGSVGElement)) {
        return;
      }

      const contentSize = measureSvgSize(svg);
      const fitZoom = computeFitDiagramZoom(
        contentSize.width,
        contentSize.height,
        container.clientWidth,
        container.clientHeight,
      );
      setDiagramZoom(fitZoom);
    });

    return () => registerDiagramFitHandler(null);
  }, [diagramOutput, svgOutput, registerDiagramFitHandler, setDiagramZoom]);

  return (
    <div className="content-container">
      {isLoading && (
        <div className="loading-indicator" />
      )}

      {message && !activeOutput && !isLoading && (
        <div className="placeholder" data-testid="message-placeholder">{message}</div>
      )}

      {isDiagramView && diagramOutput && (
        <div
          className="output-panel-shell diagram-shell"
          data-testid="output-container"
        >
          <div
            className="diagram-scroll"
            ref={diagramScrollRef}
            data-testid="diagram-scroll"
            title="Pinch or Ctrl+scroll (Cmd+scroll on Mac) to zoom the diagram"
          >
            <MermaidPanel source={diagramOutput} isRendering={isRendering} zoom={diagramZoom} />
          </div>
          <OutputActionButtons
            content={diagramOutput}
            download={OUTPUT_DOWNLOAD.diagram}
          />
        </div>
      )}

      {isSvgView && svgOutput && (
        <div
          className="output-panel-shell diagram-shell"
          data-testid="output-container"
        >
          <div
            className="diagram-scroll"
            ref={diagramScrollRef}
            data-testid="diagram-scroll"
            title="Pinch or Ctrl+scroll (Cmd+scroll on Mac) to zoom the diagram"
          >
            <SvgPanel svg={svgOutput} zoom={diagramZoom} />
          </div>
          <OutputActionButtons
            content={svgOutput}
            download={OUTPUT_DOWNLOAD.svg}
          />
        </div>
      )}

      {outputView === 'ascii' && asciiOutput && (
        <div
          className="pre-container"
          data-testid="output-container"
        >
          <div className="ruler-container">
            <CharacterRuler
              scrollLeft={scrollLeft}
              fontSize={fontSize}
              width={rulerWidth}
              fontFamily="Consolas, 'Courier New', Courier, monospace"
            />
          </div>
          <pre
            ref={preRef}
            style={{
              fontFamily: 'monospace',
              whiteSpace: 'pre',
              border: 'solid',
              padding: '10px',
              marginTop: '0',
              position: 'relative',
              overflow: 'auto',
              maxWidth: '100%',
              flex: '1 1 auto',
              boxSizing: 'border-box',
              margin: '0',
            }}
          >
            <code
              ref={codeRef}
              style={{
                fontFamily: "Consolas, 'Courier New', Courier, monospace",
                fontSize: `${fontSize}px`,
              }}
              data-testid="output-code"
            >
              {asciiOutput}
            </code>
          </pre>

          <OutputActionButtons
            content={asciiOutput}
            download={OUTPUT_DOWNLOAD.ascii}
          />
        </div>
      )}
    </div>
  );
};

export default OutputPanel;
