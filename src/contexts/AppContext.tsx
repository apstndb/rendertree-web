import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createContextWithHook } from '../utils/createContextWithHook';
import { useFileContext } from './FileContext';
import { useSettingsContext } from './SettingsContext';
import { renderASCIITree, renderMermaidDiagram, renderSVGDiagram, isWasmInitialized } from '../wasm';
import type { FormatType, PrintSection, RenderAppendixOptions } from '../types/wasm';
import { logger } from '../utils/logger';

export type ScalarAliasResolution = 'none' | 'direct' | 'recursive';

interface AppState {
  input: string;
  format: FormatType;
  wrapWidth: number;
  hangingIndent: boolean;
  printSections: PrintSection[] | undefined;
  showScalarVars: boolean;
  scalarAliasResolution: ScalarAliasResolution;
  diagramFull: boolean;
  asciiOutput: string;
  diagramOutput: string;
  svgOutput: string;
  message: string;
  isRendering: boolean;
}

interface AppContextType extends AppState {
  setInput: (input: string) => void;
  setFormat: (format: FormatType) => void;
  setWrapWidth: (wrapWidth: number) => void;
  setHangingIndent: (hangingIndent: boolean) => void;
  setPrintSections: (printSections: PrintSection[] | undefined) => void;
  setShowScalarVars: (showScalarVars: boolean) => void;
  setScalarAliasResolution: (scalarAliasResolution: ScalarAliasResolution) => void;
  setDiagramFull: (diagramFull: boolean) => void;
  handleRender: () => Promise<void>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loadSampleFile: (filename: string) => Promise<void>;
}

const { Provider: AppContextProvider, useContext: useAppContext } =
  createContextWithHook<AppContextType>('AppContext');

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [input, setInput] = useState<string>('');
  const [format, setFormat] = useState<FormatType>('CURRENT');
  const [wrapWidth, setWrapWidth] = useState<number>(0);
  const [hangingIndent, setHangingIndent] = useState<boolean>(false);
  const [printSections, setPrintSections] = useState<PrintSection[] | undefined>(undefined);
  const [showScalarVars, setShowScalarVars] = useState<boolean>(false);
  const [scalarAliasResolution, setScalarAliasResolution] = useState<ScalarAliasResolution>('none');
  const [diagramFull, setDiagramFull] = useState<boolean>(true);
  const [asciiOutput, setAsciiOutput] = useState<string>('');
  const [diagramOutput, setDiagramOutput] = useState<string>('');
  const [svgOutput, setSvgOutput] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  // The WASM module is initialized lazily on the first render (see wasm.ts),
  // so the app is immediately usable and starts in a ready state.
  const [message, setMessage] = useState<string>('Ready. Please enter a query plan and click Render.');

  const { outputView } = useSettingsContext();
  const { handleFileUpload: fileUpload, loadSampleFile: sampleFileLoader } = useFileContext();

  const handleRender = useCallback(async () => {
    logger.debug('handleRender called, outputView:', outputView);

    if (!input.trim()) {
      logger.warn('Render attempted with empty input');
      setMessage('Please provide input for the query plan.');
      return;
    }

    logger.info('Starting rendering process');
    setIsRendering(true);
    // The exported render functions initialize the WASM module on demand. The
    // first render therefore also pays the one-time load cost; surface that to
    // the user instead of a bare "Rendering..." message.
    setMessage(isWasmInitialized() ? 'Rendering...' : 'Loading rendering engine...');

    try {
      let rendered: string;
      if (outputView === 'diagram') {
        rendered = await renderMermaidDiagram(input, { full: diagramFull });
      } else if (outputView === 'svg') {
        rendered = await renderSVGDiagram(input, { full: diagramFull });
      } else {
        const appendixOptions: RenderAppendixOptions = {
          showScalarVars,
          resolveScalarVars: scalarAliasResolution === 'direct',
          resolveScalarVarsRecursive: scalarAliasResolution === 'recursive',
          ...(printSections !== undefined ? { printSections } : {}),
        };
        rendered = await renderASCIITree(input, 'AUTO', format, wrapWidth, hangingIndent, appendixOptions);
      }

      if (outputView === 'diagram') {
        setDiagramOutput(rendered);
      } else if (outputView === 'svg') {
        setSvgOutput(rendered);
      } else {
        setAsciiOutput(rendered);
      }
      setMessage('');
    } catch (renderError) {
      const errorMsg = renderError instanceof Error ? renderError.message : String(renderError);
      logger.error('Error during rendering:', errorMsg);
      setMessage(`Error during rendering: ${errorMsg}`);
    } finally {
      setIsRendering(false);
    }
  }, [
    input,
    outputView,
    format,
    wrapWidth,
    hangingIndent,
    printSections,
    showScalarVars,
    scalarAliasResolution,
    diagramFull,
  ]);

  useEffect(() => {
    if (!input.trim()) {
      return;
    }
    void handleRender();
    // Re-render immediately when switching views; input/settings changes use InputPanel debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputView]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    fileUpload(
      event,
      (content) => {
        logger.info('File content loaded into input');
        setInput(content);
      },
      (errorMsg) => {
        setMessage(`Error: ${errorMsg}`);
      }
    );
  }, [fileUpload]);

  const loadSampleFile = useCallback(async (filename: string) => {
    await sampleFileLoader(
      filename,
      (content) => {
        logger.info('Sample file content loaded into input');
        setInput(content);
        setMessage(`Sample file ${filename} loaded successfully. Rendering...`);
      },
      (errorMsg) => {
        setMessage(`Error loading sample file: ${errorMsg}`);
      },
      (loadingMsg) => {
        setMessage(loadingMsg);
      }
    );
  }, [sampleFileLoader]);

  const contextValue: AppContextType = {
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
    asciiOutput,
    diagramOutput,
    svgOutput,
    message,
    isRendering,
    handleRender,
    handleFileUpload,
    loadSampleFile,
  };

  return (
    <AppContextProvider value={contextValue}>
      {children}
    </AppContextProvider>
  );
};

export { useAppContext };
