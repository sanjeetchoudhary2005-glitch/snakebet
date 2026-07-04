
import React, { useState } from 'react';
import { GameProps } from '@/lib/gameTypes';
import { Dices, ArrowUp, ArrowDown } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const DiceGame: React.FC<GameProps> = ({ onBet, isPlaying, userBalance }) => {
  const [betAmount, setBetAmount] = useState(1);
  const [target, setTarget] = useState(50);
  const [rollOver, setRollOver] = useState(true);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-6xl mx-auto">
      <div className="flex-1">
        <Card className="p-10 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-primary to-green-600 rounded-3xl flex items-center justify-center mb-6 text-8xl font-extrabold text-black shadow-[0_0_40px_rgba(0,231,1,0.4)]">
            {isPlaying ? '?' : target + Math.floor(Math.random() * 100) + 1}
          </div>
          <h2 className="text-3xl font-bold mb-4">Dice Master</h2>
          <p className="text-muted">Roll {rollOver ? 'over' : 'under'} {target}</p>
          </div>
        </Card>
      </div>
      
      <div className="lg:w-80">
        <Card className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Bet Amount</label>
            <input 
              type="number" 
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
              min={0.1}
              step={0.1}
              className="w-full px-4 py-3 bg-background rounded-xl border border-gray-700 focus:border-primary outline-none text-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Target</label>
            <input 
              type="number" 
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value) || 50)}
              min={2}
              max={98}
              step={1}
              className="w-full px-4 py-3 bg-background rounded-xl border border-gray-700 focus:border-primary outline-none text-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant={rollOver ? "primary" : "secondary"} 
              onClick={() => setRollOver(true)}
              className="w-full"
            >
              <ArrowUp className="w-4 h-4 mr-2" /> Roll Over
            </Button>
            <Button 
              variant={!rollOver ? "primary" : "secondary"} 
              onClick={() => setRollOver(false)}
              className="w-full"
            >
              <ArrowDown className="w-4 h-4 mr-2" /> Roll Under
            </Button>
          </div>

          <Button 
            variant="primary" 
            size="xl"
            onClick={() => onBet(betAmount, { target, rollOver })}
            disabled={betAmount > userBalance}
            className="w-full py-5 text-xl"
          >
            <Dices className="w-6 h-6 mr-2" />
            Roll Dice
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default DiceGame;
