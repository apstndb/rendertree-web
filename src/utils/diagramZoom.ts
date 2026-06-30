import {
  clampDiagramZoom,
  DEFAULT_DIAGRAM_ZOOM,
} from '../contexts/SettingsContext';

/** Fraction of native pinch distance/scale applied to diagram zoom. */
export const DIAGRAM_PINCH_SENSITIVITY = 0.25;

/** Trackpad pinch wheel smoothing; smaller values change zoom more gradually. */
export const DIAGRAM_PINCH_WHEEL_SENSITIVITY = 0.001;

export function applyDampedPinchScale(currentZoom: number, scale: number): number {
  if (scale === 1) {
    return currentZoom;
  }

  const dampedScale = 1 + (scale - 1) * DIAGRAM_PINCH_SENSITIVITY;
  let next = Math.round(currentZoom * dampedScale);
  // After Fit, zoom is often well below 100%; small pinches can round to no change.
  if (next === currentZoom) {
    next = currentZoom + (scale > 1 ? 1 : -1);
  }
  return clampDiagramZoom(next);
}

export function applyWheelPinchDelta(currentZoom: number, deltaY: number): number {
  if (deltaY === 0) {
    return currentZoom;
  }

  const factor = Math.exp(-deltaY * DIAGRAM_PINCH_WHEEL_SENSITIVITY);
  let next = Math.round(currentZoom * factor);
  if (next === currentZoom) {
    next = currentZoom + (deltaY < 0 ? 1 : -1);
  }
  return clampDiagramZoom(next);
}

export function measureSvgSize(svg: SVGSVGElement): { width: number; height: number } {
  const viewBox = svg.viewBox.baseVal;
  if (viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height };
  }

  const widthAttr = svg.getAttribute('width');
  const heightAttr = svg.getAttribute('height');
  if (widthAttr && heightAttr) {
    const width = Number.parseFloat(widthAttr);
    const height = Number.parseFloat(heightAttr);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width, height };
    }
  }

  const rect = svg.getBoundingClientRect();
  return {
    width: Math.max(rect.width, 1),
    height: Math.max(rect.height, 1),
  };
}

export function prepareSvgForManualZoom(svg: SVGSVGElement): void {
  svg.style.maxWidth = 'none';
  svg.style.display = 'block';
  svg.removeAttribute('preserveAspectRatio');
}

export function computeFitDiagramZoom(
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding = 32,
): number {
  if (contentWidth <= 0 || contentHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return DEFAULT_DIAGRAM_ZOOM;
  }

  const availableWidth = Math.max(viewportWidth - padding, 1);
  const availableHeight = Math.max(viewportHeight - padding, 1);
  const scale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight);
  return clampDiagramZoom(Math.floor(scale * 100));
}
