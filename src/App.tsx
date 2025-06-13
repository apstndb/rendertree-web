import { useState, useEffect } from 'react';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import { renderASCIITree } from './wasm';

function App() {
  const [input, setInput] = useState<string>('');
  const [renderType, setRenderType] = useState<string>('ascii');
  const [renderMode, setRenderMode] = useState<string>('AUTO');
  const [format, setFormat] = useState<string>('CURRENT');
  const [wrapWidth, setWrapWidth] = useState<number>(0);
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Loading rendering engine... Please wait.');
  const [fontSize, setFontSize] = useState<number>(14);

  // Initialize font size from localStorage
  useEffect(() => {
    const storedSize = localStorage.getItem('rendertree-font-size');
    if (storedSize) {
      setFontSize(parseInt(storedSize, 10));
    }
  }, []);

  // Save font size to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('rendertree-font-size', fontSize.toString());
  }, [fontSize]);

  // Initialize WASM
  useEffect(() => {
    const initializeWasm = async () => {
      try {
        await renderASCIITree('', 'AUTO', 'CURRENT', 0);
        setIsLoading(false);
        setMessage('Ready. Please enter a query plan and click Render.');
      } catch (error) {
        console.error('Failed to initialize WebAssembly:', error);
        setMessage('Error: Failed to load rendering engine.');
      }
    };

    initializeWasm();
  }, []);

  const handleRender = async () => {
    if (!input.trim()) {
      setMessage('Please provide input for the query plan.');
      return;
    }

    setIsRendering(true);
    setMessage('Rendering...');

    try {
      const result = await renderASCIITree(input, renderMode, format, wrapWidth);
      setOutput(result);
      setMessage('');
    } catch (error) {
      console.error('Error during rendering:', error);
      setMessage(`Error during rendering: ${error}`);
    } finally {
      setIsRendering(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('No file selected');
      return;
    }

    const file = files[0];
    if (!file) {
      console.log('No file selected, or file is not accessible.');
      return;
    }

    console.log(`File selected: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        console.error('Empty or invalid file content');
        setMessage('Error: Could not read file content.');
        return;
      }

      setInput(content);
      handleRender();
    };

    reader.onerror = () => {
      console.error('Error reading file:', reader.error);
      setMessage(`Error reading file: ${reader.error?.message || 'Unknown error'}`);
    };

    reader.readAsText(file);
  };

  return (
    <>
      <div className="main-container">
        <InputPanel
          input={input}
          setInput={setInput}
          renderType={renderType}
          setRenderType={setRenderType}
          renderMode={renderMode}
          setRenderMode={setRenderMode}
          format={format}
          setFormat={setFormat}
          wrapWidth={wrapWidth}
          setWrapWidth={setWrapWidth}
          fontSize={fontSize}
          setFontSize={setFontSize}
          onRender={handleRender}
          onFileUpload={handleFileUpload}
          disabled={isLoading}
        />
        <OutputPanel
          output={output}
          message={message}
          isLoading={isLoading || isRendering}
          fontSize={fontSize}
        />
      </div>
      <footer className="app-footer">
        <a href="https://github.com/apstndb/rendertree-web" target="_blank" rel="noopener noreferrer">
          GitHub Repository
        </a>
      </footer>
    </>
  );
}

export default App;
