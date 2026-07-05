
import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '@/lib/gameTypes';
import { Play, Pause, Zap } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const CrashGame: React.FC<GameProps> = ({ 
  onBet, 
  onCashOut, 
  isPlaying, 
  currentMultiplier = 1,
  userBalance 
}) => {
  const [betAmount, setBetAmount] = useState(1);
  const [autoCashout, setAutoCashout] = useState(2);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(0, 231, 1, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw curve
      ctx.strokeStyle = '#00E701';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      
      const multiplier = isPlaying ? currentMultiplier : 1 + (time % 3000) / 3000 * 3;
      for (let t = 0; t < canvas.width; t++) {
        const m = 1 + t / 100;
        const y = canvas.height - (m - 1) * 50;
        if (t === 0) {
          ctx.moveTo(t, y);
        } else {
          ctx.lineTo(t, Math.max(0, y));
        }
      }
      ctx.stroke();
      
      time += 16;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationRef.current!);
  }, [isPlaying, currentMultiplier]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-6xl mx-auto">
      {/* Game Canvas */}
      <div className="flex-1">
        <Card className="p-0 overflow-hidden">
          <canvas 
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full bg-gradient-to-b from-gray-900 to-gray-800"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-6xl font-extrabold text-primary">
              {currentMultiplier.toFixed(2)}x
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="lg:w-80">
        <Card className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Bet Amount</label>
            <div className="flex gap-2 mb-3">
              <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                min={0.1}
                step={0.1}
                className="w-full px-4 py-3 bg-background rounded-xl border border-gray-700 focus:border-primary outline-none text-lg font-bold"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.1, 1, 10, 100].map(amt => (
                <button 
                  key={amt} 
                  onClick={() => setBetAmount(amt)}
                  className="px-3 py-2 bg-secondary border border-gray-700 rounded-lg hover:border-primary font-bold text-sm"
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Auto Cashout (x)
            </label>
            <input 
              type="number" 
              value={autoCashout}
              onChange={(e) => setAutoCashout(parseFloat(e.target.value) || 2)}
              min={1.01}
              step={0.1}
              className="w-full px-4 py-3 bg-background rounded-xl border border-gray-700 focus:border-primary outline-none text-lg font-bold"
            />
          </div>

          <Button 
            variant="primary" 
            size="xl"
            onClick={() => isPlaying ? onCashOut() : onBet(betAmount, { autoCashout })}
            disabled={betAmount > userBalance}
            className="w-full py-5 text-xl"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 mr-2" />
            ) : (
              <Play className="w-6 h-6 mr-2" />
            )}
            {isPlaying ? 'Cash Out' : 'Place Bet'}
          </Button>

          <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">RTP</span>
              <span className="font-bold text-primary">97%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CrashGame;
