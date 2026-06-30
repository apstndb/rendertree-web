import { describe, expect, it } from 'vitest';
import {
  clampDiagramZoom,
  MAX_DIAGRAM_ZOOM,
  MIN_DIAGRAM_ZOOM,
} from '../../contexts/SettingsContext';
import { computeFitDiagramZoom, applyDampedPinchScale, applyWheelPinchDelta } from '../diagramZoom';

describe('computeFitDiagramZoom', () => {
  it('fits wide diagrams below 100%', () => {
    expect(computeFitDiagramZoom(2000, 800, 400, 300, 32)).toBe(18);
  });

  it('clamps to minimum zoom', () => {
    expect(computeFitDiagramZoom(10000, 10000, 100, 100, 32)).toBe(MIN_DIAGRAM_ZOOM);
  });

  it('clamps to maximum zoom for small diagrams', () => {
    expect(computeFitDiagramZoom(50, 50, 1000, 1000, 32)).toBe(MAX_DIAGRAM_ZOOM);
  });
});

describe('clampDiagramZoom', () => {
  it('clamps values to the supported range', () => {
    expect(clampDiagramZoom(1)).toBe(MIN_DIAGRAM_ZOOM);
    expect(clampDiagramZoom(1000)).toBe(MAX_DIAGRAM_ZOOM);
    expect(clampDiagramZoom(120)).toBe(120);
  });
});

describe('applyDampedPinchScale', () => {
  it('applies only a fraction of the native pinch scale', () => {
    expect(applyDampedPinchScale(100, 2)).toBe(125);
    expect(applyDampedPinchScale(100, 0.5)).toBe(88);
  });

  it('still changes zoom after Fit when the damped delta rounds away', () => {
    expect(applyDampedPinchScale(18, 1.05)).toBe(19);
    expect(applyDampedPinchScale(45, 0.95)).toBe(44);
  });
});

describe('applyWheelPinchDelta', () => {
  it('changes zoom gradually for typical trackpad deltas', () => {
    const zoomOut = applyWheelPinchDelta(100, 10);
    const zoomIn = applyWheelPinchDelta(100, -10);
    expect(zoomOut).toBeLessThan(100);
    expect(zoomIn).toBeGreaterThan(100);
    expect(Math.abs(zoomIn - 100)).toBeLessThanOrEqual(2);
    expect(Math.abs(100 - zoomOut)).toBeLessThanOrEqual(2);
  });

  it('still changes zoom after Fit when the wheel delta rounds away', () => {
    expect(applyWheelPinchDelta(18, -1)).toBe(19);
    expect(applyWheelPinchDelta(45, 1)).toBe(44);
  });
});
