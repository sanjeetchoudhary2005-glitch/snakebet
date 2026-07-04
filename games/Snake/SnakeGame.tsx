
"use client";

import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, Play } from "lucide-react";
import Button from "@/components/ui/Button";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

type Position = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 25;
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const directionRef = useRef<Direction>("RIGHT");
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const generateFood = () => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    setFood(newFood);
  };

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setGameOver(false);
    setScore(0);
    setIsPlaying(false);
    generateFood();
  };

  const startGame = () => {
    setIsPlaying(true);
  };

  const checkCollision = (head: Position) => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    return snake.some((segment) => segment.x === head.x && segment.y === head.y);
  };

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        let newHead: Position;
        switch (directionRef.current) {
          case "UP":
            newHead = { x: head.x, y: head.y - 1 };
            break;
          case "DOWN":
            newHead = { x: head.x, y: head.y + 1 };
            break;
          case "LEFT":
            newHead = { x: head.x - 1, y: head.y };
            break;
          case "RIGHT":
            newHead = { x: head.x + 1, y: head.y };
            break;
        }

        if (checkCollision(newHead)) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 10);
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    gameLoopRef.current = setInterval(moveSnake, INITIAL_SPEED);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, gameOver, food]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying && e.key === " ") {
        e.preventDefault();
        startGame();
        return;
      }
      switch (e.key) {
        case "ArrowUp":
        case "w":
          if (direction !== "DOWN") {
            directionRef.current = "UP";
            setDirection("UP");
          }
          break;
        case "ArrowDown":
        case "s":
          if (direction !== "UP") {
            directionRef.current = "DOWN";
            setDirection("DOWN");
          }
          break;
        case "ArrowLeft":
        case "a":
          if (direction !== "RIGHT") {
            directionRef.current = "LEFT";
            setDirection("LEFT");
          }
          break;
        case "ArrowRight":
        case "d":
          if (direction !== "LEFT") {
            directionRef.current = "RIGHT";
            setDirection("RIGHT");
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, direction]);

  const handleDirectionClick = (newDir: Direction) => {
    if (
      (newDir === "UP" && direction === "DOWN") ||
      (newDir === "DOWN" && direction === "UP") ||
      (newDir === "LEFT" && direction === "RIGHT") ||
      (newDir === "RIGHT" && direction === "LEFT")
    ) {
      return;
    }
    directionRef.current = newDir;
    setDirection(newDir);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-2">Snake</h2>
        <p className="text-2xl font-bold text-primary">Score: {score}</p>
      </div>

      <div
        className="relative bg-secondary border-2 border-border rounded-xl overflow-hidden"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
          <div
            key={i}
            className="absolute border border-border/30"
            style={{
              left: (i % GRID_SIZE) * CELL_SIZE,
              top: Math.floor(i / GRID_SIZE) * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />
        ))}
        {snake.map((segment, i) => (
          <div
            key={i}
            className={`absolute transition-all duration-75 rounded-sm ${
              i === 0 ? "bg-primary" : "bg-primary/70"
            }`}
            style={{
              left: segment.x * CELL_SIZE + 2,
              top: segment.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
            }}
          />
        ))}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            left: food.x * CELL_SIZE + 4,
            top: food.y * CELL_SIZE + 4,
            width: CELL_SIZE - 8,
            height: CELL_SIZE - 8,
          }}
        />

        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
            <Button variant="primary" size="xl" onClick={startGame}>
              <Play className="w-6 h-6 mr-2" />
              Start Game
            </Button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <h3 className="text-3xl font-black text-white mb-2">Game Over!</h3>
              <p className="text-xl font-bold text-primary">Final Score: {score}</p>
            </div>
            <Button variant="primary" size="lg" onClick={resetGame}>
              <RefreshCw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          className="p-4 bg-secondary border border-border rounded-xl text-white hover:border-primary transition-all"
          onClick={() => handleDirectionClick("UP")}
        >
          ↑
        </button>
        <div className="flex gap-2">
          <button
            className="p-4 bg-secondary border border-border rounded-xl text-white hover:border-primary transition-all"
            onClick={() => handleDirectionClick("LEFT")}
          >
            ←
          </button>
          <button
            className="p-4 bg-secondary border border-border rounded-xl text-white hover:border-primary transition-all"
            onClick={() => handleDirectionClick("DOWN")}
          >
            ↓
          </button>
          <button
            className="p-4 bg-secondary border border-border rounded-xl text-white hover:border-primary transition-all"
            onClick={() => handleDirectionClick("RIGHT")}
          >
            →
          </button>
        </div>
      </div>

      <p className="text-muted-light text-sm">Use arrow keys or WASD to move</p>
    </div>
  );
}
