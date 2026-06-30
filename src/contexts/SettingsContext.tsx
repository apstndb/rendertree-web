import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createContextWithHook } from '../utils/createContextWithHook';
import type { OutputView } from '../types/wasm';

interface SettingsState {
  fontSize: number;
  diagramZoom: number;
  outputView: OutputView;
}

interface SettingsContextType extends SettingsState {
  setFontSize: (fontSize: number) => void;
  setDiagramZoom: (diagramZoom: number) => void;
  setOutputView: (outputView: OutputView) => void;
  fitDiagramToView: () => void;
  registerDiagramFitHandler: (handler: (() => void) | null) => void;
}

const { Provider: SettingsContextProvider, useContext: useSettingsContext } =
  createContextWithHook<SettingsContextType>('SettingsContext');

interface SettingsProviderProps {
  children: ReactNode;
}

const isOutputView = (value: string | null): value is OutputView =>
  value === 'ascii' || value === 'diagram';

export const MIN_DIAGRAM_ZOOM = 5;
export const MAX_DIAGRAM_ZOOM = 500;
export const DIAGRAM_ZOOM_STEP = 10;
export const DEFAULT_DIAGRAM_ZOOM = 100;

export function clampDiagramZoom(value: number): number {
  return Math.min(MAX_DIAGRAM_ZOOM, Math.max(MIN_DIAGRAM_ZOOM, value));
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [fontSize, setFontSize] = useState<number>(14);
  const [diagramZoom, setDiagramZoomState] = useState<number>(DEFAULT_DIAGRAM_ZOOM);
  const [outputView, setOutputView] = useState<OutputView>('ascii');
  const fitHandlerRef = useRef<(() => void) | null>(null);

  const setDiagramZoom = (value: number) => {
    setDiagramZoomState(clampDiagramZoom(value));
  };

  const registerDiagramFitHandler = useCallback((handler: (() => void) | null) => {
    fitHandlerRef.current = handler;
  }, []);

  const fitDiagramToView = useCallback(() => {
    fitHandlerRef.current?.();
  }, []);

  useEffect(() => {
    const storedSize = localStorage.getItem('rendertree-font-size');
    if (storedSize) {
      setFontSize(parseInt(storedSize, 10));
    }

    const storedZoom = localStorage.getItem('rendertree-diagram-zoom');
    if (storedZoom) {
      const parsed = parseInt(storedZoom, 10);
      if (!Number.isNaN(parsed)) {
        setDiagramZoomState(clampDiagramZoom(parsed));
      }
    }

    const storedView = localStorage.getItem('rendertree-output-view');
    if (isOutputView(storedView)) {
      setOutputView(storedView);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rendertree-font-size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('rendertree-diagram-zoom', diagramZoom.toString());
  }, [diagramZoom]);

  useEffect(() => {
    localStorage.setItem('rendertree-output-view', outputView);
  }, [outputView]);

  const contextValue: SettingsContextType = {
    fontSize,
    setFontSize,
    diagramZoom,
    setDiagramZoom,
    outputView,
    setOutputView,
    fitDiagramToView,
    registerDiagramFitHandler,
  };

  return (
    <SettingsContextProvider value={contextValue}>
      {children}
    </SettingsContextProvider>
  );
};

export { useSettingsContext };
