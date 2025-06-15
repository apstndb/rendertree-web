import React, { useCallback } from 'react';
import { measureCharacterWidth } from '../utils/characterMeasurement';

/**
 * Props for the CharacterRuler component
 */
interface CharacterRulerProps {
  /** Current horizontal scroll position of the content */
  scrollLeft: number;
  /** Font size in pixels */
  fontSize: number;
  /** Width of the ruler area in pixels */
  width: number;
  /** Font family for measurement (should match content font) */
  fontFamily?: string;
}

/**
 * Character ruler component that displays column position markers
 * aligned with monospace text content.
 * 
 * @param props - Component props
 * @returns JSX element representing the character ruler
 */
export const CharacterRuler: React.FC<CharacterRulerProps> = ({ 
  scrollLeft, 
  fontSize, 
  width, 
  fontFamily = 'Consolas, "Courier New", Courier, monospace' 
}) => {
  // Memoize character width calculation
  const charWidth = useCallback(() => {
    return measureCharacterWidth(fontSize, fontFamily);
  }, [fontSize, fontFamily])();

  // Generate ruler marks
  const generateRulerMarks = () => {
    const marks = [];
    const actualCharWidth = charWidth;
    const numMarks = Math.ceil(width / actualCharWidth) + 50; // Add extra marks for scrolling

    for (let i = 0; i <= numMarks; i += 10) {
      // Add a major mark every 10 characters
      marks.push(
        <div 
          key={`major-${i}`}
          className="ruler-mark major"
          style={{ 
            left: `${i * actualCharWidth}px`,
          }}
        >
          <div className="ruler-mark-label">{i}</div>
        </div>
      );

      // Add minor marks between major marks
      if (i < numMarks) {
        for (let j = 1; j < 10 && i + j <= numMarks; j++) {
          marks.push(
            <div 
              key={`minor-${i+j}`}
              className="ruler-mark minor"
              style={{ 
                left: `${(i + j) * actualCharWidth}px`,
              }}
            />
          );
        }
      }
    }

    return marks;
  };

  return (
    <div 
      className="character-ruler"
      style={{ 
        transform: `translateX(-${scrollLeft}px)`,
        fontSize: `${fontSize * 0.7}px`, // Smaller font for the ruler
        marginLeft: '10px' // Match the padding of the pre element exactly
      }}
    >
      {generateRulerMarks()}
    </div>
  );
};