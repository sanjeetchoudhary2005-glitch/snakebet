
"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

type Player = "X" | "O";
type BoardState = (Player | null)[];

const INITIAL_BOARD: BoardState = Array(9).fill(null);
const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export default function TicTacToeGame() {
  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | "Draw" | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const checkWinner = (newBoard: BoardState): Player | "Draw" | null => {
    for (let combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a];
      }
    }
    if (newBoard.every(cell => cell !== null)) return "Draw";
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setGameOver(true);
      setWinner(result);
      if (result === "Draw") {
        setScores(s => ({ ...s, draws: s.draws + 1 }));
      } else {
        setScores(s => ({ ...s, [result]: s[result] + 1 }));
      }
    } else {
      setCurrentPlayer(p => p === "X" ? "O" : "X");
    }
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setCurrentPlayer("X");
    setGameOver(false);
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-2">Tic Tac Toe</h2>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-muted-light text-sm">Player X</p>
            <p className="text-2xl font-black text-primary">{scores.X}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-light text-sm">Draws</p>
            <p className="text-2xl font-black text-gray-400">{scores.draws}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-light text-sm">Player O</p>
            <p className="text-2xl font-black text-accent">{scores.O}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 bg-secondary p-3 rounded-2xl border border-border">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            className={`w-24 h-24 rounded-xl text-5xl font-black flex items-center justify-center transition-all duration-200 ${
              cell ? "bg-secondary-light" : "bg-background hover:bg-secondary-light"
            } ${cell === "X" ? "text-primary" : cell === "O" ? "text-accent" : ""}`}
          >
            {cell}
          </button>
        ))}
      </div>

      {gameOver && (
        <div className="text-center">
          <h3 className="text-3xl font-black text-white mb-4">
            {winner === "Draw" ? "It's a Draw!" : `Player ${winner} Wins!`}
          </h3>
          <Button variant="primary" onClick={resetGame}>
            <RefreshCw className="w-5 h-5 mr-2" />
            Play Again
          </Button>
        </div>
      )}

      {!gameOver && (
        <div className="text-center">
          <p className="text-xl font-bold text-muted-light">
            Current Turn: <span className={currentPlayer === "X" ? "text-primary" : "text-accent"}>
              Player {currentPlayer}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
