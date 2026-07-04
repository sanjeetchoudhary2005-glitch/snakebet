'use client';
import React from 'react';

// The 52 step path around a 15x15 Ludo board.
// [row, col] indices from 0 to 14.
const PATH = [
  // Starts from Red's start (left arm, bottom row, moving right)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Up the top arm (left column)
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Across the top
  [0, 7], [0, 8],
  // Down the top arm (right column)
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Right arm (top row, moving right)
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Down the right edge
  [7, 14], [8, 14],
  // Right arm (bottom row, moving left)
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Down the bottom arm (right column)
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Across the bottom
  [14, 7], [14, 6],
  // Up the bottom arm (left column)
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Left arm (bottom row, moving left)
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Up the left edge
  [7, 0], [6, 0]
];

// Colors: 0=red, 1=green, 2=yellow, 3=blue (matching websocket.ts HOME_BASES)
const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'];

const HOME_COORDS = [
  // Red (bottom left)
  [[11, 2], [11, 3], [12, 2], [12, 3]],
  // Green (top left)
  [[2, 2], [2, 3], [3, 2], [3, 3]],
  // Yellow (top right)
  [[2, 11], [2, 12], [3, 11], [3, 12]],
  // Blue (bottom right)
  [[11, 11], [11, 12], [12, 11], [12, 12]],
];

const FINISH_COORDS = [
  // Red (middle left)
  [[7, 1], [7, 2], [7, 3], [7, 4]],
  // Green (middle top)
  [[1, 7], [2, 7], [3, 7], [4, 7]],
  // Yellow (middle right)
  [[7, 13], [7, 12], [7, 11], [7, 10]],
  // Blue (middle bottom)
  [[13, 7], [12, 7], [11, 7], [10, 7]]
];

interface LudoBoardProps {
  gameState: any;
  onMoveToken: (playerIndex: number, tokenIndex: number) => void;
  userId: string | undefined;
}

export function LudoBoard({ gameState, onMoveToken, userId }: LudoBoardProps) {
  if (!gameState) return null;

  const renderToken = (color: string, size = 24) => (
    <img 
      src={`/images/games/ludo/token-${color}.jpg`} 
      alt={`${color} token`}
      style={{ width: size, height: size, borderRadius: '50%', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
    />
  );

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto rounded-xl overflow-hidden shadow-2xl border border-gray-700">
      {/* Background Board Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen"
        style={{ backgroundImage: "url('/images/games/ludo/board.jpg')" }}
      />
      
      {/* 15x15 Grid */}
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}>
        {/* Render paths slightly visible for context if needed, or just let tokens float over */}
        {PATH.map((coord, i) => (
          <div key={`path-${i}`} style={{ gridColumn: coord[1] + 1, gridRow: coord[0] + 1 }} className="flex items-center justify-center relative">
             <div className="w-1 h-1 bg-white/10 rounded-full" />
          </div>
        ))}

        {/* Render Players */}
        {gameState.players.map((player: any, pIdx: number) => {
          const isMe = player.userId === userId;
          const isMyTurn = gameState.currentTurnIndex === pIdx;
          const colorName = PLAYER_COLORS[player.color];

          return player.position.map((pos: number, tIdx: number) => {
            let row, col;
            
            if (pos === -1) {
              // At home
              [row, col] = HOME_COORDS[player.color][tIdx];
            } else if (pos === 100) {
              // Finished
              [row, col] = FINISH_COORDS[player.color][tIdx];
            } else {
              // On path
              [row, col] = PATH[pos];
            }

            const canMove = isMe && isMyTurn;

            return (
              <div 
                key={`p${pIdx}-t${tIdx}`}
                style={{ 
                  gridColumn: col + 1, 
                  gridRow: row + 1,
                  zIndex: pos >= 0 && pos < 100 ? 10 : 1 // Path tokens on top
                }}
                className={`flex items-center justify-center transition-all duration-300 ${canMove ? 'cursor-pointer hover:scale-125' : ''}`}
                onClick={() => {
                  if (canMove) {
                    onMoveToken(pIdx, tIdx);
                  }
                }}
              >
                <div className={`relative ${canMove ? 'animate-bounce' : ''}`}>
                  {renderToken(colorName)}
                  {canMove && pos === -1 && gameState.lastDiceRoll === 6 && (
                    <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                  )}
                </div>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
