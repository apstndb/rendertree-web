import React, { useEffect, useState } from 'react';
import { useAppContext, type ScalarAliasResolution } from '../contexts/AppContext';
import {
  DIAGRAM_ZOOM_STEP,
  MAX_DIAGRAM_ZOOM,
  MIN_DIAGRAM_ZOOM,
  useSettingsContext,
} from '../contexts/SettingsContext';
import { useDebounce } from '../hooks/useDebounce';
import type { FormatType, OutputView, PrintSection } from '../types/wasm';

interface InputPanelProps {
  disabled: boolean;
}

type AppendixPreset =
  | 'default'
  | 'none'
  | 'predicates'
  | 'semantic'
  | 'orderingAggregate'
  | 'typed'
  | 'full';

const appendixPresetOptions: Array<{ value: AppendixPreset; label: string; sections: PrintSection[] | undefined }> = [
  { value: 'default', label: 'Default predicates', sections: undefined },
  { value: 'none', label: 'None', sections: [] },
  { value: 'predicates', label: 'Predicates', sections: ['predicates'] },
  { value: 'semantic', label: 'Predicates + ordering + aggregates', sections: ['predicates', 'ordering', 'aggregate'] },
  { value: 'orderingAggregate', label: 'Ordering + aggregates', sections: ['ordering', 'aggregate'] },
  { value: 'typed', label: 'Typed debug', sections: ['typed'] },
  { value: 'full', label: 'Full debug', sections: ['full'] },
];

const scalarAliasResolutionOptions: Array<{ value: ScalarAliasResolution; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'direct', label: 'Resolve scalar aliases' },
  { value: 'recursive', label: 'Resolve scalar aliases recursively' },
];

const sameSections = (a: PrintSection[] | undefined, b: PrintSection[] | undefined): boolean => {
  if (a === undefined || b === undefined) {
    return a === b;
  }
  return a.length === b.length && a.every((section, index) => section === b[index]);
};

const presetForSections = (sections: PrintSection[] | undefined): AppendixPreset => {
  return appendixPresetOptions.find(option => sameSections(option.sections, sections))?.value ?? 'default';
};

const sectionsForPreset = (preset: AppendixPreset): PrintSection[] | undefined => {
  const sections = appendixPresetOptions.find(option => option.value === preset)?.sections;
  return sections === undefined ? undefined : [...sections];
};

const InputPanel: React.FC<InputPanelProps> = ({ disabled }) => {
  const {
    input,
    setInput,
    format,
    setFormat,
    wrapWidth,
    setWrapWidth,
    hangingIndent,
    setHangingIndent,
    printSections,
    setPrintSections,
    showScalarVars,
    setShowScalarVars,
    scalarAliasResolution,
    setScalarAliasResolution,
    diagramFull,
    setDiagramFull,
    handleRender,
    handleFileUpload,
    loadSampleFile
  } = useAppContext();

  const { fontSize, setFontSize, diagramZoom, setDiagramZoom, fitDiagramToView, outputView, setOutputView } = useSettingsContext();
  
  // Local state for wrap width input
  const [localWrapWidth, setLocalWrapWidth] = useState(wrapWidth.toString());
  
  // Debounced wrap width update with 2-second delay
  const { debouncedCallback: debouncedSetWrapWidth, flush: flushWrapWidth } = useDebounce(
    (value: string) => {
      const numValue = parseInt(value, 10) || 0;
      setWrapWidth(numValue);
    },
    2000
  );

  // Update local wrap width when external wrap width changes
  useEffect(() => {
    setLocalWrapWidth(wrapWidth.toString());
  }, [wrapWidth]);

  const appendixPreset = presetForSections(printSections);
  const isPlanVizView = outputView === 'diagram' || outputView === 'svg';
  const [showPlanInput, setShowPlanInput] = useState(false);

  const onFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(event);
    setShowPlanInput(true);
  };

  const onLoadSampleFile = async (path: string) => {
    await loadSampleFile(path);
    setShowPlanInput(true);
  };

  // Auto-render when settings change (except wrapWidth which is handled separately)
  useEffect(() => {
    if (input.trim() && !disabled) {
      const timeoutId = setTimeout(() => {
        handleRender();
      }, 200);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [
    format,
    wrapWidth,
    hangingIndent,
    printSections,
    showScalarVars,
    scalarAliasResolution,
    diagramFull,
    input,
    disabled,
    handleRender,
  ]);

  // Handle wrap width input with debouncing and special keys
  const handleWrapWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalWrapWidth(value);
    debouncedSetWrapWidth(value);
  };

  // Handle wrap width on Enter key or blur
  const handleWrapWidthSubmit = () => {
    flushWrapWidth(localWrapWidth);
  };

  const handleWrapWidthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleWrapWidthSubmit();
    }
  };

  return (
    <div className={`left-pane ${disabled ? 'disabled' : ''}`}>
      <div className="file-picker-container">
        <div className="file-input-wrapper">
          <label htmlFor="fileInput" className="control-group-label">Plan source</label>
          <input
            type="file"
            id="fileInput"
            accept=".yaml,.yml,.json"
            aria-label="Upload plan file"
            onChange={onFileUpload}
            disabled={disabled}
            data-testid="file-picker"
          />
          <div className="file-source-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowPlanInput((visible) => !visible)}
              disabled={disabled}
              aria-expanded={showPlanInput}
              data-testid="plan-input-toggle"
            >
              {showPlanInput ? 'Hide input' : 'Paste / Preview'}
            </button>
          </div>
          <div className="sample-files">
            <span className="control-group-label">Samples</span>
            <button
              className="sample-file-button"
              onClick={() => void onLoadSampleFile('testdata/dca_profile.yaml')}
              disabled={disabled}
            >
              dca_profile.yaml
            </button>
            <button
              className="sample-file-button"
              onClick={() => void onLoadSampleFile('testdata/dca_plan.yaml')}
              disabled={disabled}
            >
              dca_plan.yaml
            </button>
          </div>
        </div>
      </div>
      {showPlanInput && (
        <div className="plan-input-section" data-testid="plan-input-section">
          <textarea
            className="input-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste or preview QueryPlan YAML/JSON..."
            aria-label="QueryPlan input"
            disabled={disabled}
            data-testid="plan-input"
          />
        </div>
      )}
      <div className="render-controls">
        <div className="select-container">
          <label htmlFor="outputView" className="control-group-label">Output view:</label>
          <select
            id="outputView"
            aria-label="Output view"
            value={outputView}
            onChange={(e) => setOutputView(e.target.value as OutputView)}
            disabled={disabled}
            data-testid="output-view-select"
          >
            <option value="ascii">ASCII tree</option>
            <option value="diagram">Diagram (Mermaid)</option>
            <option value="svg">Diagram (Graphviz SVG)</option>
          </select>
        </div>
        {isPlanVizView ? (
          <label className="checkbox-container" htmlFor="diagramFull">
            <input
              type="checkbox"
              id="diagramFull"
              checked={diagramFull}
              onChange={(e) => setDiagramFull(e.target.checked)}
              aria-label="Include full diagram details"
              disabled={disabled}
              data-testid="diagram-full-checkbox"
            />
            <span>Full diagram details</span>
          </label>
        ) : (
          <>
        <div className="select-container">
          <label htmlFor="format" className="control-group-label">Format:</label>
          <select
            id="format"
            aria-label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value as FormatType)}
            disabled={disabled}
          >
            <option value="CURRENT">CURRENT</option>
            <option value="TRADITIONAL">TRADITIONAL</option>
            <option value="COMPACT">COMPACT</option>
          </select>
        </div>
        <div className="select-container">
          <label htmlFor="wrapWidth" className="control-group-label">Wrap Width:</label>
          <input
            type="number"
            id="wrapWidth"
            min="0"
            value={localWrapWidth}
            onChange={handleWrapWidthChange}
            onBlur={handleWrapWidthSubmit}
            onKeyDown={handleWrapWidthKeyDown}
            aria-label="Wrap Width (press Enter or wait 2 seconds to apply)"
            disabled={disabled}
            title="Press Enter or wait 2 seconds to apply changes"
          />
        </div>
        <label className="checkbox-container" htmlFor="hangingIndent">
          <input
            type="checkbox"
            id="hangingIndent"
            checked={hangingIndent}
            onChange={(e) => setHangingIndent(e.target.checked)}
            aria-label="Enable hanging indent for wrapped lines"
            disabled={disabled}
          />
          <span>Hanging indent for wrapped lines</span>
        </label>
        <div className="select-container">
          <label htmlFor="appendixPreset" className="control-group-label">Appendices:</label>
          <select
            id="appendixPreset"
            aria-label="Appendices"
            value={appendixPreset}
            onChange={(e) => setPrintSections(sectionsForPreset(e.target.value as AppendixPreset))}
            disabled={disabled}
          >
            {appendixPresetOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <label className="checkbox-container" htmlFor="showScalarVars">
          <input
            type="checkbox"
            id="showScalarVars"
            checked={showScalarVars}
            onChange={(e) => setShowScalarVars(e.target.checked)}
            aria-label="Show scalar variable names"
            disabled={disabled}
          />
          <span>Show scalar variable names</span>
        </label>
        <div className="select-container">
          <label htmlFor="scalarAliasResolution" className="control-group-label">Scalar Alias Resolution:</label>
          <select
            id="scalarAliasResolution"
            aria-label="Scalar alias resolution"
            value={scalarAliasResolution}
            onChange={(e) => setScalarAliasResolution(e.target.value as ScalarAliasResolution)}
            disabled={disabled}
          >
            {scalarAliasResolutionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
          </>
        )}
        <button
          className="primary-button"
          onClick={handleRender}
          disabled={disabled}
          title="Refresh the current visualization with current settings"
        >
          🔄 Refresh
        </button>
        {isPlanVizView ? (
          <DiagramZoomControls
            diagramZoom={diagramZoom}
            setDiagramZoom={setDiagramZoom}
            onFit={fitDiagramToView}
            disabled={disabled}
          />
        ) : (
          <FontSizeControls
            fontSize={fontSize}
            setFontSize={setFontSize}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};

// Font size controls component
interface FontSizeControlsProps {
  fontSize: number;
  setFontSize: (fontSize: number) => void;
  disabled: boolean;
}

const FontSizeControls: React.FC<FontSizeControlsProps> = ({ 
  fontSize, 
  setFontSize, 
  disabled 
}) => {
  const decreaseFontSize = () => {
    setFontSize(Math.max(8, fontSize - 1));
  };

  const increaseFontSize = () => {
    setFontSize(fontSize + 1);
  };

  return (
    <div className="font-size-controls">
      <span className="control-group-label">Font:</span>
      <button
        id="decrease-font"
        title="Decrease font size"
        aria-label="Decrease font size"
        onClick={decreaseFontSize}
        disabled={disabled}
      >
        A-
      </button>
      <span id="font-size-display" className="font-size-value">
        {fontSize}px
      </span>
      <button
        id="increase-font"
        title="Increase font size"
        aria-label="Increase font size"
        onClick={increaseFontSize}
        disabled={disabled}
      >
        A+
      </button>
    </div>
  );
};

interface DiagramZoomControlsProps {
  diagramZoom: number;
  setDiagramZoom: (diagramZoom: number) => void;
  onFit: () => void;
  disabled: boolean;
}

const DiagramZoomControls: React.FC<DiagramZoomControlsProps> = ({
  diagramZoom,
  setDiagramZoom,
  onFit,
  disabled,
}) => {
  const decreaseZoom = () => {
    setDiagramZoom(diagramZoom - DIAGRAM_ZOOM_STEP);
  };

  const increaseZoom = () => {
    setDiagramZoom(diagramZoom + DIAGRAM_ZOOM_STEP);
  };

  return (
    <div className="diagram-zoom-controls" data-testid="diagram-zoom-controls">
      <div className="diagram-zoom-controls__header">
        <span className="control-group-label">Zoom</span>
        <button
          id="fit-diagram-zoom"
          className="diagram-zoom-controls__fit"
          title="Fit diagram to view"
          aria-label="Fit diagram to view"
          onClick={onFit}
          disabled={disabled}
          data-testid="diagram-zoom-fit"
        >
          Fit
        </button>
      </div>
      <div className="diagram-zoom-controls__stepper">
        <button
          id="decrease-diagram-zoom"
          title="Zoom out diagram"
          aria-label="Zoom out diagram"
          onClick={decreaseZoom}
          disabled={disabled || diagramZoom <= MIN_DIAGRAM_ZOOM}
          data-testid="diagram-zoom-out"
        >
          −
        </button>
        <span id="diagram-zoom-display" className="font-size-value" data-testid="diagram-zoom-display">
          {diagramZoom}%
        </span>
        <button
          id="increase-diagram-zoom"
          title="Zoom in diagram"
          aria-label="Zoom in diagram"
          onClick={increaseZoom}
          disabled={disabled || diagramZoom >= MAX_DIAGRAM_ZOOM}
          data-testid="diagram-zoom-in"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default InputPanel;
