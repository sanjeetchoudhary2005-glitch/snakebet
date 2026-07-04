
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

const GRID_SIZE = 4;
const TARGET_SCORE = 2048;

const getRandomTile = () => (Math.random() < 0.9 ? 2 : 4);

const cloneGrid = (grid: number[][]) => grid.map(row => [...row]);

const initGrid = () => {
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  addRandomTile(grid);
  addRandomTile(grid);
  return grid;
};

const addRandomTile = (grid: number[][]) => {
  const emptyCells: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === 0) {
        emptyCells.push({ x, y });
      }
    }
  }
  if (emptyCells.length > 0) {
    const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[y][x] = getRandomTile();
  }
};

const getTileColor = (value: number) => {
  switch (value) {
    case 2: return "bg-[#eee4da] text-[#776e65]";
    case 4: return "bg-[#ede0c8] text-[#776e65]";
    case 8: return "bg-[#f2b179] text-white";
    case 16: return "bg-[#f59563] text-white";
    case 32: return "bg-[#f67c5f] text-white";
    case 64: return "bg-[#f65e3b] text-white";
    case 128: return "bg-[#edcf72] text-white";
    case 256: return "bg-[#edcc61] text-white";
    case 512: return "bg-[#edc850] text-white";
    case 1024: return "bg-[#edc53f] text-white";
    case 2048: return "bg-[#edc22e] text-white";
    default: return "bg-[#3c3a32] text-white";
  }
};

const getTileSize = (value: number) => {
  if (value < 100) return "text-3xl";
  if (value < 1000) return "text-2xl";
  return "text-xl";
};

export default function Game2048() {
  const [grid, setGrid] = useState(initGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
    }
  }, [score, bestScore]);

  const resetGame = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  const checkGameOver = useCallback((currentGrid: number[][]) => {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentGrid[y][x] === 0) return false;
        if (x < GRID_SIZE - 1 && currentGrid[y][x] === currentGrid[y][x + 1]) return false;
        if (y < GRID_SIZE - 1 && currentGrid[y][x] === currentGrid[y + 1][x]) return false;
      }
    }
    return true;
  }, []);

  const moveLeft = useCallback(() => {
    let newGrid = cloneGrid(grid);
    let newScore = score;

    for (let y = 0; y < GRID_SIZE; y++) {
      let row = newGrid[y].filter(val => val !== 0);
      let newRow: number[] = [];
      for (let i = 0; i < row.length; i++) {
        if (i + 1 < row.length && row[i] === row[i + 1]) {
          newRow.push(row[i] * 2);
          newScore += row[i] * 2;
          i++;
        } else {
          newRow.push(row[i]);
        }
      }
      while (newRow.length < GRID_SIZE) newRow.push(0);
      newGrid[y] = newRow;
    }

    if (JSON.stringify(newGrid) !== JSON.stringify(grid)) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      if (newGrid.some(row => row.some(val => val >= TARGET_SCORE))) {
        setWon(true);
      }
      if (checkGameOver(newGrid)) {
        setGameOver(true);
      }
    }
  }, [grid, score, checkGameOver]);

  const moveRight = useCallback(() => {
    let newGrid = cloneGrid(grid);
    let newScore = score;

    for (let y = 0; y < GRID_SIZE; y++) {
      let row = newGrid[y].filter(val => val !== 0);
      let newRow: number[] = [];
      for (let i = row.length - 1; i >= 0; i--) {
        if (i - 1 >= 0 && row[i] === row[i - 1]) {
          newRow.unshift(row[i] * 2);
          newScore += row[i] * 2;
          i--;
        } else {
          newRow.unshift(row[i]);
        }
      }
      while (newRow.length < GRID_SIZE) newRow.unshift(0);
      newGrid[y] = newRow;
    }

    if (JSON.stringify(newGrid) !== JSON.stringify(grid)) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      if (checkGameOver(newGrid)) {
        setGameOver(true);
      }
    }
  }, [grid, score, checkGameOver]);

  const moveUp = useCallback(() => {
    let newGrid = cloneGrid(grid);
    let newScore = score;

    for (let x = 0; x < GRID_SIZE; x++) {
      let col: number[] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        if (newGrid[y][x] !== 0) col.push(newGrid[y][x]);
      }
      let newCol: number[] = [];
      for (let i = 0; i < col.length; i++) {
        if (i + 1 < col.length && col[i] === col[i + 1]) {
          newCol.push(col[i] * 2);
          newScore += col[i] * 2;
          i++;
        } else {
          newCol.push(col[i]);
        }
      }
      while (newCol.length < GRID_SIZE) newCol.push(0);
      for (let y = 0; y < GRID_SIZE; y++) {
        newGrid[y][x] = newCol[y];
      }
    }

    if (JSON.stringify(newGrid) !== JSON.stringify(grid)) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      if (checkGameOver(newGrid)) {
        setGameOver(true);
      }
    }
  }, [grid, score, checkGameOver]);

  const moveDown = useCallback(() => {
    let newGrid = cloneGrid(grid);
    let newScore = score;

    for (let x = 0; x < GRID_SIZE; x++) {
      let col: number[] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        if (newGrid[y][x] !== 0) col.push(newGrid[y][x]);
      }
      let newCol: number[] = [];
      for (let i = col.length - 1; i >= 0; i--) {
        if (i - 1 >= 0 && col[i] === col[i - 1]) {
          newCol.unshift(col[i] * 2);
          newScore += col[i] * 2;
          i--;
        } else {
          newCol.unshift(col[i]);
        }
      }
      while (newCol.length < GRID_SIZE) newCol.unshift(0);
      for (let y = 0; y < GRID_SIZE; y++) {
        newGrid[y][x] = newCol[y];
      }
    }

    if (JSON.stringify(newGrid) !== JSON.stringify(grid)) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      if (checkGameOver(newGrid)) {
        setGameOver(true);
      }
    }
  }, [grid, score, checkGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || won) return;
      switch (e.key) {
        case "ArrowUp": e.preventDefault(); moveUp(); break;
        case "ArrowDown": e.preventDefault(); moveDown(); break;
        case "ArrowLeft": e.preventDefault(); moveLeft(); break;
        case "ArrowRight": e.preventDefault(); moveRight(); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLeft, moveRight, moveUp, moveDown, gameOver, won]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-2">2048</h2>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center px-6 py-3 bg-secondary rounded-xl border border-border">
            <p className="text-muted-light text-sm">Score</p>
            <p className="text-2xl font-black text-primary">{score}</p>
          </div>
          <div className="text-center px-6 py-3 bg-secondary rounded-xl border border-border">
            <p className="text-muted-light text-sm">Best</p>
            <p className="text-2xl font-black text-accent">{bestScore}</p>
          </div>
        </div>
      </div>

      <div className="relative bg-secondary p-4 rounded-2xl border border-border">
        <div className="grid grid-cols-4 gap-3">
          {grid.map((row, y) => (
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`w-20 h-20 rounded-xl flex items-center justify-center font-black transition-all duration-200 ${
                  cell === 0 ? "bg-background" : getTileColor(cell)
                } ${getTileSize(cell)}`}
              >
                {cell !== 0 ? cell : ""}
              </div>
            ))
          ))}
        </div>
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center gap-4">
            <h3 className="text-3xl font-black text-white">Game Over!</h3>
            <Button variant="primary" onClick={resetGame}>
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
          </div>
        )}
        {won && !gameOver && (
          <div className="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center gap-4">
            <h3 className="text-3xl font-black text-primary">You Win!</h3>
            <Button variant="primary" onClick={resetGame}>
              Play Again
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          className="p-4 bg-secondary border border-border rounded-xl text-white hover:border-primary transition-all"
          onClick={moveUp}
        >
          ↑
        </button>
        <div className="flex gap-2">
          <button
            className="p-4 bg-secondary border border-border rounded-xl text-white hover:border-primary transition-all"
            onClick={moveLeft}
          >
            ←
          </button>
          <button
            className="p-4 bg-secondary border border-border rounded-xl text-white hover:border-primary transition-all"
            onClick={moveDown}
          >
            ↓
          </button>
          <button
            className="p-4 bg-secondary border border-border rounded-xl text-white hover:border-primary transition-all"
            onClick={moveRight}
          >
            →
          </button>
        </div>
      </div>

      <Button variant="secondary" onClick={resetGame}>
        <RefreshCw className="w-5 h-5 mr-2" />
        New Game
      </Button>
    </div>
  );
}
