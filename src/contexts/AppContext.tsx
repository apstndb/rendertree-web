import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createContextWithHook } from '../utils/createContextWithHook';
import { useWasmContext } from './WasmContext';
import { useFileContext } from './FileContext';
import { useSettingsContext } from './SettingsContext';
import { renderASCIITree, renderMermaidDiagram } from '../wasm';
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
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Loading rendering engine... Please wait.');

  const { isLoading, error, renderASCII, renderMermaid } = useWasmContext();
  const { outputView } = useSettingsContext();
  const { handleFileUpload: fileUpload, loadSampleFile: sampleFileLoader } = useFileContext();

  useEffect(() => {
    logger.debug('AppContext useEffect triggered - isLoading:', isLoading, 'hasError:', !!error);

    if (error) {
      const errorMsg = `Error: ${error.message}`;
      logger.error('Setting error message in UI:', errorMsg);
      setMessage(errorMsg);
    } else if (!isLoading) {
      logger.info('WASM loading completed, setting ready message in UI');
      setMessage('Ready. Please enter a query plan and click Render.');
    } else {
      logger.debug('Still loading, message remains unchanged');
    }
  }, [isLoading, error]);

  const handleRender = useCallback(async () => {
    logger.debug('handleRender called, outputView:', outputView);

    if (!input.trim()) {
      logger.warn('Render attempted with empty input');
      setMessage('Please provide input for the query plan.');
      return;
    }

    if (outputView === 'ascii' && !renderASCII) {
      logger.error('Render attempted but renderASCII function is not available');
      setMessage('Rendering engine not initialized.');
      return;
    }

    if (outputView === 'diagram' && !renderMermaid) {
      logger.error('Render attempted but renderMermaid function is not available');
      setMessage('Rendering engine not initialized.');
      return;
    }

    logger.info('Starting rendering process');
    setIsRendering(true);
    setMessage('Rendering...');

    try {
      let rendered: string;
      if (outputView === 'diagram') {
        rendered = await renderMermaidDiagram(input, { full: diagramFull });
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
    renderASCII,
    renderMermaid,
  ]);

  useEffect(() => {
    if (isLoading || !input.trim()) {
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
