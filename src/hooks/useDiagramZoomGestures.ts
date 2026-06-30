import { useEffect, useRef, type RefObject } from 'react';
import {
  applyDampedPinchScale,
  applyWheelPinchDelta,
} from '../utils/diagramZoom';

function touchDistance(touches: TouchList): number {
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) {
    return 0;
  }
  const dx = first.clientX - second.clientX;
  const dy = first.clientY - second.clientY;
  return Math.hypot(dx, dy);
}

interface UseDiagramZoomGesturesOptions {
  containerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  diagramZoom: number;
  setDiagramZoom: (zoom: number) => void;
}

export function useDiagramZoomGestures({
  containerRef,
  enabled,
  diagramZoom,
  setDiagramZoom,
}: UseDiagramZoomGesturesOptions): void {
  const diagramZoomRef = useRef(diagramZoom);
  const setDiagramZoomRef = useRef(setDiagramZoom);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(diagramZoom);
  const gestureStartZoomRef = useRef(diagramZoom);

  diagramZoomRef.current = diagramZoom;
  setDiagramZoomRef.current = setDiagramZoom;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) {
      return undefined;
    }

    const applyZoom = (nextZoom: number) => {
      setDiagramZoomRef.current(nextZoom);
    };

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      event.preventDefault();
      applyZoom(applyWheelPinchDelta(diagramZoomRef.current, event.deltaY));
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinchStartDistanceRef.current = touchDistance(event.touches);
        pinchStartZoomRef.current = diagramZoomRef.current;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || pinchStartDistanceRef.current === null) {
        return;
      }
      event.preventDefault();
      const distance = touchDistance(event.touches);
      const scale = distance / pinchStartDistanceRef.current;
      applyZoom(applyDampedPinchScale(pinchStartZoomRef.current, scale));
    };

    const onTouchEnd = () => {
      pinchStartDistanceRef.current = null;
    };

    const onGestureStart = (event: Event) => {
      event.preventDefault();
      gestureStartZoomRef.current = diagramZoomRef.current;
    };

    const onGestureChange = (event: Event) => {
      event.preventDefault();
      const gestureEvent = event as Event & { scale?: number };
      if (typeof gestureEvent.scale !== 'number') {
        return;
      }
      applyZoom(applyDampedPinchScale(gestureStartZoomRef.current, gestureEvent.scale));
    };

    const wheelOptions: AddEventListenerOptions = { passive: false, capture: true };
    const gestureOptions: AddEventListenerOptions = { passive: false, capture: true };

    container.addEventListener('wheel', onWheel, wheelOptions);
    container.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    container.addEventListener('touchend', onTouchEnd, { capture: true });
    container.addEventListener('touchcancel', onTouchEnd, { capture: true });
    container.addEventListener('gesturestart', onGestureStart as EventListener, gestureOptions);
    container.addEventListener('gesturechange', onGestureChange as EventListener, gestureOptions);

    return () => {
      container.removeEventListener('wheel', onWheel, wheelOptions);
      container.removeEventListener('touchstart', onTouchStart, { capture: true });
      container.removeEventListener('touchmove', onTouchMove, { capture: true });
      container.removeEventListener('touchend', onTouchEnd, { capture: true });
      container.removeEventListener('touchcancel', onTouchEnd, { capture: true });
      container.removeEventListener('gesturestart', onGestureStart as EventListener, gestureOptions);
      container.removeEventListener('gesturechange', onGestureChange as EventListener, gestureOptions);
    };
  }, [containerRef, enabled]);
}
