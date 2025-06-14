import React from 'react';
import { useAppContext } from '../contexts/AppContext';

interface InputPanelProps {
  disabled: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({ disabled }) => {
  const {
    input,
    setInput,
    renderType,
    setRenderType,
    renderMode,
    setRenderMode,
    format,
    setFormat,
    wrapWidth,
    setWrapWidth,
    fontSize,
    setFontSize,
    handleRender,
    handleFileUpload,
    loadSampleFile
  } = useAppContext();
  return (
    <div className={`left-pane ${disabled ? 'disabled' : ''}`}>
      <div className="file-picker-container">
        <h3>Select a file to render:</h3>
        <div className="file-input-wrapper">
          <input
            type="file"
            id="fileInput"
            accept=".yaml,.yml,.json"
            aria-label="Upload plan file"
            onChange={handleFileUpload}
            disabled={disabled}
            data-testid="file-picker"
          />
          <p className="file-hint">Tip: Use the sample files in the testdata directory</p>
          <div className="sample-files">
            <p>Sample files:</p>
            <button 
              className="sample-file-button" 
              onClick={() => loadSampleFile('testdata/dca_profile.yaml')}
              disabled={disabled}
            >
              Load dca_profile.yaml
            </button>
            <button 
              className="sample-file-button" 
              onClick={() => loadSampleFile('testdata/dca_plan.yaml')}
              disabled={disabled}
            >
              Load dca_plan.yaml
            </button>
          </div>
        </div>
      </div>
      <textarea
        className="input-area"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter Spanner QueryPlan in JSON or YAML format..."
        aria-label="QueryPlan input"
        disabled={disabled}
      />
      <div className="render-controls">
        <div className="file-input-container" style={{ display: 'none' }}>
          <label htmlFor="fileInput" className="file-input-label">Upload:</label>
          <input
            type="file"
            id="hiddenFileInput"
            accept=".yaml,.yml,.json"
            aria-label="Hidden upload plan file"
            disabled={disabled}
          />
        </div>
        <div className="select-container">
          <label htmlFor="renderType" className="control-group-label">Type:</label>
          <select
            id="renderType"
            aria-label="Render type"
            value={renderType}
            onChange={(e) => setRenderType(e.target.value)}
            disabled={disabled}
          >
            <option value="ascii">ASCII</option>
          </select>
        </div>
        <div className="select-container">
          <label htmlFor="renderMode" className="control-group-label">Mode:</label>
          <select
            id="renderMode"
            aria-label="Render mode"
            value={renderMode}
            onChange={(e) => setRenderMode(e.target.value)}
            disabled={disabled}
          >
            <option value="AUTO">AUTO</option>
            <option value="PLAN">PLAN</option>
            <option value="PROFILE">PROFILE</option>
          </select>
        </div>
        <div className="select-container">
          <label htmlFor="format" className="control-group-label">Format:</label>
          <select
            id="format"
            aria-label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
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
            value={wrapWidth}
            onChange={(e) => setWrapWidth(parseInt(e.target.value, 10) || 0)}
            aria-label="Wrap Width"
            disabled={disabled}
          />
        </div>
        <button
          className="primary-button"
          onClick={handleRender}
          disabled={disabled}
        >
          Render
        </button>
        <FontSizeControls 
          fontSize={fontSize}
          setFontSize={setFontSize}
          disabled={disabled} 
        />
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

export default InputPanel;
