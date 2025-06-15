/**
 * Measures the actual character width for a given font and font size
 * Uses canvas for accurate measurement with fallback approximation
 * 
 * @param fontSize - Font size in pixels
 * @param fontFamily - Font family string
 * @returns Character width in pixels
 */
export const measureCharacterWidth = (fontSize: number, fontFamily: string): number => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    // Fallback to approximation if canvas is not available
    return fontSize * 0.6;
  }
  
  context.font = `${fontSize}px ${fontFamily}`;
  // Measure a representative monospace character
  const metrics = context.measureText('M');
  return metrics.width;
};