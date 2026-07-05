
"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getGameById } from "@/games/gameRegistry";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ComingSoonGame } from "@/components/games/ComingSoonGame";

// Import all game components
import SnakeGame from "@/games/Snake/SnakeGame";
import TicTacToeGame from "@/games/TicTacToe/TicTacToeGame";
import Game2048 from "@/games/2048/Game2048";
import MemoryMatchGame from "@/games/MemoryMatch/MemoryMatchGame";
import DiceMasterGame from "@/games/Dice/DiceMasterGame";
import PenaltyShootout from "@/games/Football/PenaltyShootout";
import CricketBatting from "@/games/Cricket/CricketBatting";
import BasketballShootout from "@/games/Basketball/BasketballShootout";
import BubbleShooter from "@/games/Bubble/BubbleShooter";
import BrickBreaker from "@/games/Brick/BrickBreaker";
import SkyboundGame from "@/games/Skybound/GameUI";
import MinesGame from "@/games/Mines/MinesGame";
import { CrashGame } from "@/components/games/CrashGame";
import { EnhancedMinesGame } from "@/components/games/EnhancedMinesGame";
import { PlinkoGame } from "@/components/games/PlinkoGame";
import { DiceGame } from "@/components/games/DiceGame";
import { RouletteGame } from "@/components/games/RouletteGame";
import { BlackjackGame } from "@/components/games/BlackjackGame";
import { TeenPattiGame } from "@/components/games/TeenPattiGame";
import { AndarBaharGame } from "@/components/games/AndarBaharGame";
import { BaccaratGame } from "@/components/games/BaccaratGame";
import { SlotsGame } from "@/components/games/SlotsGame";
import { WheelGame } from "@/components/games/WheelGame";
import { HiLoGame } from "@/components/games/HiLoGame";
import { KenoGame } from "@/components/games/KenoGame";
import { DragonTowerGame } from "@/components/games/DragonTowerGame";
import { DragonTigerGame } from "@/components/games/DragonTigerGame";
import { CoinFlipGame } from "@/components/games/CoinFlipGame";

// Fallback component
const PlaceholderGame = ({ name }: { name: string }) => (
  <div className="text-center py-20">
    <h2 className="text-2xl font-bold mb-3 text-white">{name}</h2>
    <p className="text-muted-light">This game is ready to play!</p>
  </div>
);

const GAME_COMPONENTS: Record<string, React.ComponentType<any>> = {
  snake: SnakeGame,
  "tic-tac-toe": TicTacToeGame,
  "2048": Game2048,
  "memory-match": MemoryMatchGame,
  "dice-master": DiceMasterGame,
  "football-league": PenaltyShootout,
  "cricket-premier": CricketBatting,
  "basketball-nba": BasketballShootout,
  "bubble-shooter": BubbleShooter,
  "brick-breaker": BrickBreaker,
  "skybound": SkyboundGame,
  "crash-extreme": () => <CrashGame
    minBet={5}
    maxBet={100000}
    defaultBetAmount={10}
    quickBetAmounts={[5, 10, 25, 50, 100]}
  />,
  "crash": () => <CrashGame
    minBet={20}
    maxBet={100000}
    defaultBetAmount={20}
    quickBetAmounts={[20, 50, 100, 250, 500]}
  />,
  "minesweeper-pro": EnhancedMinesGame,
  "mines": EnhancedMinesGame,
  "plinko": PlinkoGame,
  "andar-bahar": AndarBaharGame,
  "baccarat": BaccaratGame,
  "teen-patti": TeenPattiGame,
  "dice": DiceGame,
  "roulette": RouletteGame,
  "blackjack": BlackjackGame,
  "slots": SlotsGame,
  "wheel": WheelGame,
  "hilo": HiLoGame,
  "keno": KenoGame,
  "dragontower": DragonTowerGame,
  "dragontiger": DragonTigerGame,
  "coinflip": CoinFlipGame,
  "ludo": () => {
    // Redirect to our dedicated Ludo page
    if (typeof window !== 'undefined') {
      window.location.href = '/games/ludo';
    }
    return <PlaceholderGame name="Ludo" />;
  },
};

const ClientGamePage: React.FC = () => {
  const params = useParams();
  const gameId = params?.gameId as string;
  const game = getGameById(gameId);

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-4 text-white">Game Not Found</h1>
          <p className="text-muted-light text-lg">This game doesn't exist or has been removed</p>
        </div>
        <Link href="/games">
          <Button variant="primary" size="lg">Back to Games</Button>
        </Link>
      </div>
    );
  }

  if (game.playable === false || game.comingSoon) {
    return <ComingSoonGame name={game.name.replace(/^[^\w]+/, '').trim()} category={game.category} rtp={game.rtp} />;
  }

  const GameComponent = GAME_COMPONENTS[gameId] || PlaceholderGame;

  return (
    <div className="pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <Link href="/games" className="text-muted-light hover:text-primary flex items-center gap-2 mb-8 transition-colors font-semibold">
          <ArrowLeft className="w-5 h-5" /> Back to Games
        </Link>
        
        <div className="flex items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">{game.name}</h1>
            <p className="text-muted-light text-lg flex items-center gap-2">
              <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                {game.category.toUpperCase()}
              </span>
              <span>RTP: {game.rtp}%</span>
              <span>• {game.players.toLocaleString()} players</span>
            </p>
          </div>
        </div>

        <Card className="p-4 md:p-8 bg-gradient-to-br from-bv-surface-2 to-bv-surface border border-white/10 rounded-lg">
          <GameComponent name={game.name} />
        </Card>
      </div>
    </div>
  );
};

export default ClientGamePage;
