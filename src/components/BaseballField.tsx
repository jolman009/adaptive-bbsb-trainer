import React from 'react';
import { Box, useTheme } from '@mui/material';
import { Sport, Position } from '@/types/scenario';

export interface FieldAnimation {
  ballStart?: Position | 'home' | '1base' | '2base' | '3base';
  ballEnd?: Position | 'home' | '1base' | '2base' | '3base';
  playerMovements?: {
    position: Position;
    target: Position | 'home' | '1base' | '2base' | '3base';
  }[];
}

interface BaseballFieldProps {
  sport: Sport;
  runners: ('1b' | '2b' | '3b')[];
  highlightPosition?: Position;
  animate?: boolean;
  ballLocation?: Position;
  animationConfig?: FieldAnimation;
}

/**
 * BaseballField Component
 * 
 * Renders a 2D SVG representation of a baseball/softball field.
 * Visualizes:
 * - The field layout (infield/outfield)
 * - Occupied bases (red) vs empty bases (white)
 * - The player's position (highlighted with label)
 */
export const BaseballField: React.FC<BaseballFieldProps> = ({
  sport,
  runners,
  highlightPosition,
  animate = false,
  ballLocation,
  animationConfig,
}) => {
  const theme = useTheme();
  
  const isOccupied = (base: '1b' | '2b' | '3b') => runners.includes(base);

  // Coordinates for positions (0-100 scale)
  const getPositionCoords = (pos: Position) => {
    switch (pos) {
      case 'c': return { x: 50, y: 82 };
      case 'p': return { x: 50, y: 55 };
      case '1b': return { x: 73, y: 53 };
      case '2b': return { x: 60, y: 40 };
      case '3b': return { x: 27, y: 53 };
      case 'ss': return { x: 40, y: 40 };
      case 'lf': return { x: 20, y: 20 };
      case 'cf': return { x: 50, y: 10 };
      case 'rf': return { x: 80, y: 20 };
      default: return null;
    }
  };

  // Helper to get coordinates for any key (position or base)
  const getCoords = (key: Position | 'home' | '1base' | '2base' | '3base') => {
    // Check standard positions first
    const posCoords = getPositionCoords(key as Position);
    if (posCoords) return posCoords;

    // Check bases
    switch (key) {
      case 'home': return { x: 50, y: 85 };
      case '1base': return { x: 80, y: 55 };
      case '2base': return { x: 50, y: 25 };
      case '3base': return { x: 20, y: 55 };
      default: return { x: 50, y: 50 };
    }
  };

  // Resolve animation coordinates
  const animBallStart = animationConfig?.ballStart ? getCoords(animationConfig.ballStart) : null;
  const animBallEnd = animationConfig?.ballEnd ? getCoords(animationConfig.ballEnd) : null;

  const ballPos = ballLocation ? getPositionCoords(ballLocation) : null;
  const homePlatePos = { x: 50, y: 85 };

  // Field colors
  const grassColor = '#4caf50';
  const dirtColor = '#d7ccc8';
  const foulLineColor = 'white';
  const baseColor = 'white';
  const runnerColor = theme.palette.error.main;

  const allPositions: Position[] = ['p', 'c', '1b', '2b', '3b', 'ss', 'lf', 'cf', 'rf'];

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg key={`${animate ? 'animating' : 'static'}-${highlightPosition}`} viewBox="0 0 100 100" style={{ width: '100%', height: '100%', maxHeight: '100%', maxWidth: '100%', display: 'block', overflow: 'visible' }}>
        {/* Outfield Fence / Grass Area */}
        <path d="M 50 85 L 95 20 A 80 80 0 0 0 5 20 Z" fill={grassColor} />
        
        {/* Infield Dirt Area (Diamond shape) */}
        <path d="M 50 85 L 80 55 L 50 25 L 20 55 Z" fill={dirtColor} />
        
        {/* Grass Infield (Baseball specific usually, but looks nice for contrast) */}
        {sport === 'baseball' && (
           <path d="M 50 78 L 73 55 L 50 32 L 27 55 Z" fill={grassColor} />
        )}

        {/* Foul Lines */}
        <line x1="50" y1="85" x2="95" y2="20" stroke={foulLineColor} strokeWidth="0.5" />
        <line x1="50" y1="85" x2="5" y2="20" stroke={foulLineColor} strokeWidth="0.5" />

        {/* Bases */}
        {/* 2nd Base */}
        <rect x="48.5" y="23.5" width="3" height="3" fill={isOccupied('2b') ? runnerColor : baseColor} transform="rotate(45 50 25)">
          {isOccupied('2b') && animate && (
            <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
          )}
        </rect>
        
        {/* 3rd Base */}
        <rect x="18.5" y="53.5" width="3" height="3" fill={isOccupied('3b') ? runnerColor : baseColor} transform="rotate(45 20 55)">
          {isOccupied('3b') && animate && (
            <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
          )}
        </rect>
        
        {/* 1st Base */}
        <rect x="78.5" y="53.5" width="3" height="3" fill={isOccupied('1b') ? runnerColor : baseColor} transform="rotate(45 80 55)">
          {isOccupied('1b') && animate && (
            <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
          )}
        </rect>
        
        {/* Home Plate */}
        <path d="M 48.5 84 L 51.5 84 L 51.5 85.5 L 50 87 L 48.5 85.5 Z" fill={baseColor} />

        {/* Pitcher's Plate */}
        <rect x="49" y="54.5" width="2" height="0.5" fill="white" />

        {/* Static Ball Path (only if no animation active) */}
        {ballPos && !animBallEnd && (
          <line
            x1={homePlatePos.x}
            y1={homePlatePos.y}
            x2={ballPos.x}
            y2={ballPos.y}
            stroke="#FFD700"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.6"
          />
        )}

        {/* All Players */}
        {allPositions.map((pos) => {
          const coords = getPositionCoords(pos);
          if (!coords) return null;
          
          // Check for movement animation
          const movement = animationConfig?.playerMovements?.find(m => m.position === pos);
          const targetCoords = movement ? getCoords(movement.target) : null;
          
          // Highlight if it's the main position OR if it's moving
          const isHighlighted = pos === highlightPosition || (animate && !!movement);

          return (
            <g key={pos}>
              <circle 
                cx={coords.x} 
                cy={coords.y} 
                r={isHighlighted ? 4 : 2.5} 
                fill={isHighlighted ? theme.palette.primary.main : '#e0e0e0'} 
                stroke={isHighlighted ? 'white' : '#757575'} 
                strokeWidth={isHighlighted ? 1 : 0.5} 
              >
                {movement && targetCoords && animate && (
                  <>
                    <animate attributeName="cx" from={coords.x} to={targetCoords.x} dur="1s" fill="freeze" begin="0s" />
                    <animate attributeName="cy" from={coords.y} to={targetCoords.y} dur="1s" fill="freeze" begin="0s" />
                  </>
                )}
              </circle>
              <text 
                x={coords.x} 
                y={coords.y} 
                dy=".35em"
                fontSize={isHighlighted ? 3 : 1.5} 
                fill={isHighlighted ? 'white' : '#424242'} 
                textAnchor="middle" 
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {movement && targetCoords && animate && (
                  <>
                    <animate attributeName="x" from={coords.x} to={targetCoords.x} dur="1s" fill="freeze" begin="0s" />
                    <animate attributeName="y" from={coords.y} to={targetCoords.y} dur="1s" fill="freeze" begin="0s" />
                  </>
                )}
                {pos.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Animated Ball */}
        {animBallStart && animBallEnd && animate && (
          <circle 
            cx={animBallStart.x} 
            cy={animBallStart.y} 
            r="1.5" 
            fill="#FFD700" 
            stroke="black" 
            strokeWidth="0.2" 
          >
            <animate attributeName="cx" from={animBallStart.x} to={animBallEnd.x} dur="1s" fill="freeze" begin="0s" />
            <animate attributeName="cy" from={animBallStart.y} to={animBallEnd.y} dur="1s" fill="freeze" begin="0s" />
          </circle>
        )}

        {/* Static Ball Indicator (fallback if no animation) */}
        {ballPos && (!animBallEnd || !animate) && (
          <circle 
            cx={ballPos.x} 
            cy={ballPos.y} 
            r="1.5" 
            fill="#FFD700" 
            stroke="black" 
            strokeWidth="0.2" 
          />
        )}
      </svg>
    </Box>
  );
};