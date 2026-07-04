'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { GameViewportLayout } from './GameViewportLayout';
import { BetControlPanel } from './BetControlPanel';
import Matter from 'matter-js';

const PLINKO_MULTIPLIERS: Record<number, Record<string, number[]>> = {
  8: {
    Low: [0.5, 1, 2, 3, 5, 3, 2, 1, 0.5],
    Medium: [0.3, 0.8, 1.5, 4, 8, 4, 1.5, 0.8, 0.3],
    High: [0.2, 0.5, 1.2, 6, 18, 6, 1.2, 0.5, 0.2]
  },
  12: {
    Low: [0.4, 0.8, 1.2, 2, 4, 8, 8, 4, 2, 1.2, 0.8, 0.4],
    Medium: [0.2, 0.5, 1, 3, 8, 20, 20, 8, 3, 1, 0.5, 0.2],
    High: [0.1, 0.3, 0.8, 2, 6, 30, 60, 30, 6, 2, 0.8, 0.3]
  },
  16: {
    Low: [0.3, 0.6, 1, 1.5, 3, 6, 12, 20, 20, 12, 6, 3, 1.5, 1, 0.6, 0.3],
    Medium: [0.15, 0.4, 0.8, 1.5, 4, 10, 25, 50, 50, 25, 10, 4, 1.5, 0.8, 0.4, 0.15],
    High: [0.05, 0.2, 0.5, 1.2, 3, 10, 25, 100, 200, 100, 25, 10, 3, 1.2, 0.5, 0.2, 0.05]
  }
};

export function PlinkoGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  // Configuration
  const [rows, setRows] = useState<8 | 12 | 16>(16);
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [betAmount, setBetAmount] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyData, setVerifyData] = useState<any | null>(null);

  // Interactive UI multipliers
  const multipliers = PLINKO_MULTIPLIERS[rows][riskLevel];
  const totalBuckets = rows + 1;

  // Peg tracker for visual glowing on collision
  const [glowingPegs, setGlowingPegs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Setup Matter.js World
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 600;
    const height = 550;
    canvas.width = width;
    canvas.height = height;

    const engine = Matter.Engine.create({ gravity: { y: 0.8, scale: 0.001 } });
    const world = engine.world;
    engineRef.current = engine;

    // Create Peg pyramid positions
    const startY = 40;
    const rowGap = 24;
    const pegGap = 28;

    const pegBodies: Matter.Body[] = [];
    const pegMap: Record<string, { x: number; y: number }> = {};

    for (let r = 0; r < rows; r++) {
      const cols = r + 3; // rows starting with 3 pegs, expanding downward
      const rowXOffset = ((cols - 1) * pegGap) / 2;

      for (let c = 0; c < cols; c++) {
        const x = width / 2 - rowXOffset + c * pegGap;
        const y = startY + r * rowGap;
        
        const peg = Matter.Bodies.circle(x, y, 4, {
          isStatic: true,
          label: `peg-${r}-${c}`,
          restitution: 0.5,
          friction: 0.1,
        });

        pegBodies.push(peg);
        pegMap[`peg-${r}-${c}`] = { x, y };
      }
    }

    Matter.Composite.add(world, pegBodies);

    // Collision listener for glowing pegs
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        const peg = bodyA.label.startsWith('peg-') ? bodyA : bodyB.label.startsWith('peg-') ? bodyB : null;
        if (peg) {
          playSound('bounce');
          const key = peg.label;
          setGlowingPegs(prev => ({ ...prev, [key]: true }));
          setTimeout(() => {
            setGlowingPegs(prev => ({ ...prev, [key]: false }));
          }, 200);
        }
      });
    });

    // Run Engine
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    // Render loop
    let animFrame: number;
    const ctx = canvas.getContext('2d');

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Draw background vignette felt
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw pegs
      pegBodies.forEach((peg) => {
        const isGlow = glowingPegs[peg.label];
        ctx.beginPath();
        ctx.arc(peg.position.x, peg.position.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = isGlow ? '#fbbf24' : '#374151';
        ctx.shadowColor = isGlow ? '#fbbf24' : 'transparent';
        ctx.shadowBlur = isGlow ? 10 : 0;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
      });

      // Draw multiplier buckets at the bottom
      const bucketY = height - 40;
      const bucketWidth = width / totalBuckets;
      
      multipliers.forEach((mult, idx) => {
        const x = idx * bucketWidth;
        // Bucket color mapping based on risk multiplier
        let color = '#4b5563'; // gray fallback
        if (mult >= 10) color = '#ef4444'; // Red
        else if (mult >= 5) color = '#f97316'; // Orange
        else if (mult >= 2) color = '#eab308'; // Yellow
        else if (mult >= 1) color = '#3b82f6'; // Blue
        else color = '#374151'; // Dark gray

        ctx.fillStyle = color;
        ctx.fillRect(x + 2, bucketY, bucketWidth - 4, 25);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${mult}x`, x + bucketWidth / 2, bucketY + 16);
      });

      // Draw active balls in play
      const balls = Matter.Composite.allBodies(world).filter(b => b.label.startsWith('ball-'));
      balls.forEach((ball) => {
        // Retrieve target guidance values
        const data = (ball as any).gameData;
        if (data) {
          // Guided physics steering: apply gentle correcting force at each row level to land in data.targetBucket
          const targetCol = data.path.reduce((acc: number, dir: number) => acc + (dir === 0 ? -0.5 : 0.5), rows / 2);
          const bucketWidthSize = width / totalBuckets;
          const targetX = targetCol * bucketWidthSize + bucketWidthSize / 2;

          // Apply correction force proportional to horizontal displacement
          const dx = targetX - ball.position.x;
          Matter.Body.applyForce(ball, ball.position, { x: dx * 0.000025, y: 0 });
        }

        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#eab308';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Check if ball exited the bottom grid boundary
        if (ball.position.y > height - 30) {
          // Play settle sound, trigger payouts, remove body
          playSound('win');
          Matter.Composite.remove(world, ball);

          const payoutAmt = betAmount * data.multiplier;
          if (payoutAmt > betAmount) {
            triggerWin(data.multiplier);
          } else {
            triggerLose();
          }

          refresh();
          fetchTransactions();
        }
      });

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, [rows, riskLevel, glowingPegs]);

  const dropBall = async () => {
    if (balance < betAmount || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    playSound('click');

    try {
      const response = await fetch('/api/games/plinko/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, rows, riskLevel }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to draw Plinko ball');

      setRoundId(data.roundId);
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
        result: `${data.multiplier}x`,
      });

      // Spawn ball in Matter.js Composite World
      const engine = engineRef.current;
      if (engine) {
        // Spawn slightly off-center left/right for realistic random start velocity
        const spawnX = 300 + (Math.random() * 8 - 4);
        const ball = Matter.Bodies.circle(spawnX, 15, 6, {
          label: `ball-${data.roundId}`,
          restitution: 0.45,
          friction: 0.05,
          density: 0.001,
        });

        // Attach custom steering guide variables
        (ball as any).gameData = data;
        Matter.Composite.add(engine.world, ball);
      }

    } catch (err: any) {
      setError(err.message || 'Error occurred dropping Plinko ball');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GameViewportLayout
      gameId="plinko"
      gameName="🎱 Plinko Arena"
      rtp={96.0}
      verifyData={verifyData}
      controls={
        <div className="flex flex-col gap-4 w-full">
          {/* Config selection row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block">Rows</label>
              <div className="grid grid-cols-3 gap-2 bg-[#0b0f19] p-1 border border-white/5 rounded-lg">
                {[8, 12, 16].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRows(r as any)}
                    disabled={isSubmitting}
                    className={`py-2 rounded font-mono text-xs font-bold ${
                      rows === r ? 'bg-amber-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block">Risk</label>
              <div className="grid grid-cols-3 gap-2 bg-[#0b0f19] p-1 border border-white/5 rounded-lg">
                {['Low', 'Medium', 'High'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setRiskLevel(lvl as any)}
                    disabled={isSubmitting}
                    className={`py-2 rounded text-xs font-bold ${
                      riskLevel === lvl ? 'bg-amber-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Place Bet bottom controls */}
          <div className="flex gap-4 w-full">
            <div className="flex-1">
              <input 
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-center"
              />
            </div>
            <button
              onClick={dropBall}
              disabled={isSubmitting || balance < betAmount}
              className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition duration-150 active:scale-98 text-sm"
            >
              Drop Ball
            </button>
          </div>
        </div>
      }
    >
      <WinFlashOverlay />

      <div className="flex-1 w-full max-w-4xl flex flex-col justify-center items-center relative py-4">
        
        {/* Plinko Matter.js Rigid Canvas wrapper */}
        <div className="bg-[#090d16] border border-white/5 rounded-2xl relative shadow-inner overflow-hidden flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            className="rounded-xl"
            style={{ width: '100%', maxWidth: '520px', height: 'auto', maxHeight: '420px' }}
          />
        </div>

        {error && (
          <div className="p-2.5 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-[10px] font-semibold text-center z-10 max-w-sm mt-3">
            {error}
          </div>
        )}

      </div>
    </GameViewportLayout>
  );
}
