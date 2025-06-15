import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSettingsContext } from '../contexts/SettingsContext';
import { useDebounce } from '../hooks/useDebounce';

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
    handleRender,
    handleFileUpload,
    loadSampleFile
  } = useAppContext();

  const { fontSize, setFontSize } = useSettingsContext();
  
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

  // Auto-render when settings change (except wrapWidth which is handled separately)
  useEffect(() => {
    if (input.trim() && !disabled) {
      const timeoutId = setTimeout(() => {
        handleRender();
      }, 200); // Faster response for dropdown changes
      
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [renderMode, format, input, disabled, handleRender]);

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
        <h3>Select a file to visualize:</h3>
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
          <p className="file-hint">Files are automatically rendered when selected</p>
          <div className="sample-files">
            <p>Sample files:</p>
            <button 
              className="sample-file-button" 
              onClick={() => loadSampleFile('dca_profile.yaml')}
              disabled={disabled}
            >
              Load dca_profile.yaml
            </button>
            <button 
              className="sample-file-button" 
              onClick={() => loadSampleFile('dca_plan.yaml')}
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
        <div className="settings-header">
          <h4>Rendering Settings</h4>
          <p className="auto-render-note">Changes are automatically applied</p>
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
            value={localWrapWidth}
            onChange={handleWrapWidthChange}
            onBlur={handleWrapWidthSubmit}
            onKeyDown={handleWrapWidthKeyDown}
            aria-label="Wrap Width (press Enter or wait 2 seconds to apply)"
            disabled={disabled}
            title="Press Enter or wait 2 seconds to apply changes"
          />
        </div>
        <button
          className="primary-button"
          onClick={handleRender}
          disabled={disabled}
          title="Refresh the current visualization with current settings"
        >
          🔄 Refresh
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
