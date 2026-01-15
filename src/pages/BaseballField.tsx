import React from 'react';
import { Box, useTheme } from '@mui/material';
import { Sport, Position } from '@/types/scenario';

interface BaseballFieldProps {
  sport: Sport;
  runners: ('1b' | '2b' | '3b')[];
  highlightPosition?: Position;
  animate?: boolean;
  ballLocation?: Position;
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
      case 'lf': return { x: 20, y: 25 };
      case 'cf': return { x: 50, y: 15 };
      case 'rf': return { x: 80, y: 25 };
      default: return null;
    }
  };

  const playerPos = highlightPosition ? getPositionCoords(highlightPosition) : null;
  const ballPos = ballLocation ? getPositionCoords(ballLocation) : null;
  const homePlatePos = { x: 50, y: 85 };

  // Field colors
  const grassColor = '#4caf50';
  const dirtColor = '#d7ccc8';
  const foulLineColor = 'white';
  const baseColor = 'white';
  const runnerColor = theme.palette.error.main;

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox="0 0 100 90" style={{ width: '100%', height: '100%', maxHeight: '100%', maxWidth: '100%', display: 'block', overflow: 'visible' }}>
        {/* Outfield Fence / Grass Area */}
        <path d="M 50 85 L 95 40 A 60 60 0 0 0 5 40 Z" fill={grassColor} />
        
        {/* Infield Dirt Area (Diamond shape) */}
        <path d="M 50 85 L 80 55 L 50 25 L 20 55 Z" fill={dirtColor} />
        
        {/* Grass Infield (Baseball specific usually, but looks nice for contrast) */}
        {sport === 'baseball' && (
           <path d="M 50 78 L 73 55 L 50 32 L 27 55 Z" fill={grassColor} />
        )}

        {/* Foul Lines */}
        <line x1="50" y1="85" x2="95" y2="40" stroke={foulLineColor} strokeWidth="0.5" />
        <line x1="50" y1="85" x2="5" y2="40" stroke={foulLineColor} strokeWidth="0.5" />

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

        {/* Ball Path */}
        {ballPos && (
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

        {/* Ball Indicator */}
        {ballPos && (
          <circle 
            cx={ballPos.x} 
            cy={ballPos.y} 
            r="1.5" 
            fill="#FFD700" 
            stroke="black" 
            strokeWidth="0.2" 
          />
        )}

        {/* Player Position Marker */}
        {playerPos && (
          <g>
            <circle cx={playerPos.x} cy={playerPos.y} r="4" fill={theme.palette.primary.main} stroke="white" strokeWidth="1" />
            <text 
              x={playerPos.x} 
              y={playerPos.y} 
              dy=".35em"
              fontSize="3" 
              fill="white" 
              textAnchor="middle" 
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              {highlightPosition?.toUpperCase()}
            </text>
          </g>
        )}
      </svg>
    </Box>
  );
};