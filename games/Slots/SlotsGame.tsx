
import React, { useState } from 'react';
import { GameProps } from '@/lib/gameTypes';
import { Gamepad2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const symbols = ['🍎', '🍊', '🍇', '🍒', '7️⃣', '⭐', '💎', '🎰'];

const SlotsGame: React.FC<GameProps> = ({ onBet, userBalance }) => {
  const [betAmount, setBetAmount] = useState(1);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-6xl mx-auto">
      <div className="flex-1">
        <Card className="p-10">
          <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="w-20 h-20 bg-background border border-gray-700 rounded-2xl flex items-center justify-center text-5xl">
                {symbols[Math.floor(Math.random() * symbols.length)]}
              </div>
            ))}
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

          <Button 
            variant="primary" 
            size="xl"
            onClick={() => onBet(betAmount, {})}
            disabled={betAmount > userBalance}
            className="w-full py-5 text-xl"
          >
            <Gamepad2 className="w-6 h-6 mr-2" />
            Spin
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default SlotsGame;
