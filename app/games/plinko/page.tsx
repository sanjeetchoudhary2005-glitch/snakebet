'use client'
import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { motion } from 'framer-motion'
import { WinEffect } from '@/components/WinEffect'
import { GameSounds } from '@/lib/sounds'

export default function PlinkoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  
  const [betAmount, setBetAmount] = useState(100)
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium')
  const [rows, setRows] = useState<8 | 12 | 16>(8)
  
  const [balance, setBalance] = useState(1000)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [showWinEffect, setShowWinEffect] = useState(false)
  const [lastWinAmount, setLastWinAmount] = useState(0)

  // Autobet State
  const [isAuto, setIsAuto] = useState(false)
  const [autoRunning, setAutoRunning] = useState(false)
  const [ballsInFlight, setBallsInFlight] = useState(0)
  const [history, setHistory] = useState<Array<{multiplier: number}>>([])
  
  const [autoConfig, setAutoConfig] = useState({
    numBets: 0,
    dropRateMs: 500
  })
  
  const [autoState, setAutoState] = useState({
    betsRemaining: 0,
  })

  useEffect(() => {
    async function fetchInitialBalance() {
      try {
        const res = await fetch('/api/user/balance')
        if (res.ok) {
          const data = await res.json()
          setBalance(data.balance)
        }
      } catch (err) {
        console.error('Failed to fetch balance', err)
      } finally {
        setLoadingBalance(false)
      }
    }
    fetchInitialBalance()
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1, scale: 0.001 }
    })
    
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine,
      options: {
        width: 400, height: 500,
        wireframes: false,
        background: 'transparent',
      }
    })

    engineRef.current = engine

    // Create pegs
    const pegs: Matter.Body[] = []
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3
      const rowWidth = 380
      const spacing = rowWidth / pegsInRow
      const xOffset = (400 - rowWidth) / 2 + spacing / 2

      for (let col = 0; col < pegsInRow; col++) {
        const x = xOffset + col * spacing
        const y = 60 + row * (400 / rows)
        const peg = Matter.Bodies.circle(x, y, 4, {
          isStatic: true,
          render: { fillStyle: '#D4A647' }, // Gold pegs
          restitution: 0.4,
          friction: 0.001
        })
        pegs.push(peg)
      }
    }

    // Create bucket walls
    const buckets: Matter.Body[] = []
    const bucketCount = rows + 1
    const bucketWidth = 380 / bucketCount
    for (let i = 0; i <= bucketCount; i++) {
      const wall = Matter.Bodies.rectangle(
        (400 - 380) / 2 + i * bucketWidth, 490, 2, 30,
        { isStatic: true, render: { fillStyle: '#333' } }
      )
      buckets.push(wall)
    }

    const ground = Matter.Bodies.rectangle(200, 510, 400, 20, {
      isStatic: true, render: { fillStyle: '#111' }
    })

    Matter.Composite.add(engine.world, [...pegs, ...buckets, ground])
    Matter.Runner.run(Matter.Runner.create(), engine)
    Matter.Render.run(render)

    return () => {
      Matter.Render.stop(render)
      Matter.Engine.clear(engine)
    }
  }, [rows])

  const executeDrop = async () => {
    if (!engineRef.current || betAmount > balance) return false
    
    setBallsInFlight(prev => prev + 1)
    
    // Deduct optimistically for smooth UI
    setBalance(prev => prev - betAmount)

    try {
      const res = await fetch('/api/games/plinko/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, riskLevel: risk, rows, clientSeed: crypto.randomUUID() })
      })
      
      if (!res.ok) throw new Error('Failed to drop ball')
      
      const data = await res.json()
      
      // Calculate start position slightly off-center to force the deterministic path visually
      // Real implementations use deterministic physics, here we use standard for visual flare
      const startX = 200 + (Math.random() - 0.5) * 5

      const ball = Matter.Bodies.circle(startX, 10, 6, {
        restitution: 0.5,
        friction: 0.001,
        density: 1,
        render: { fillStyle: '#2DD4BF' }, // Teal balls
      })
      
      Matter.Composite.add(engineRef.current.world, ball)

      // Polling collision / off-screen removal (approx 4 seconds)
      setTimeout(() => {
        if (data.newBalance !== undefined) setBalance(data.newBalance)
        setHistory(prev => [{ multiplier: data.multiplier }, ...prev.slice(0, 9)])
        setBallsInFlight(prev => prev - 1)
        
        if (engineRef.current) {
          Matter.Composite.remove(engineRef.current.world, ball)
        }

        if (data.multiplier >= 10) {
           setLastWinAmount(betAmount * data.multiplier)
           setShowWinEffect(true)
           setTimeout(() => setShowWinEffect(false), 3000)
        }
      }, 3500)

      return true
    } catch (err) {
      console.error(err)
      setBallsInFlight(prev => prev - 1)
      setBalance(prev => prev + betAmount) // Refund
      return false
    }
  }

  // Auto bet loop
  useEffect(() => {
    if (!autoRunning) return

    const runAuto = async () => {
      if (autoState.betsRemaining === 0 && autoConfig.numBets > 0) {
        setAutoRunning(false)
        return
      }
      
      if (balance < betAmount) {
        setAutoRunning(false)
        return
      }

      const success = await executeDrop()
      if (success) {
        setAutoState(prev => ({
          ...prev,
          betsRemaining: prev.betsRemaining > 0 ? prev.betsRemaining - 1 : 0
        }))
      } else {
        setAutoRunning(false)
      }
    }

    const timer = setTimeout(() => {
      runAuto()
    }, autoConfig.dropRateMs)
    
    return () => clearTimeout(timer)
  }, [autoRunning, balance, autoState, autoConfig, betAmount])

  const toggleAuto = () => {
    if (autoRunning) {
      setAutoRunning(false)
    } else {
      setAutoState({ betsRemaining: autoConfig.numBets })
      setAutoRunning(true)
    }
  }

  const isControlsDisabled = (autoRunning || (ballsInFlight > 0 && !isAuto))

  return (
    <div className="min-h-screen bg-[#0D0B14] text-white flex flex-col items-center p-8">
      <WinEffect show={showWinEffect} amount={lastWinAmount} />

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto">
        {/* Physics Canvas */}
        <div className="flex-1 bg-[#161224] rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative flex items-center justify-center py-10">
          <canvas ref={canvasRef} className="rounded-2xl mx-auto block" />
          
          {/* History bar */}
          <div className="absolute right-4 top-4 bottom-4 w-12 flex flex-col gap-2 overflow-hidden justify-end pb-4">
             {history.map((h, i) => (
                <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className={`w-12 h-8 flex items-center justify-center font-bold text-[10px] rounded border ${
                      h.multiplier > 1 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                   }`}
                >
                   {h.multiplier}x
                </motion.div>
             ))}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full md:w-80 bg-[#161224] rounded-3xl p-6 border border-white/5 flex flex-col gap-6 shadow-2xl">
          
          <div className="flex bg-black/30 p-1 rounded-xl">
            <button 
              onClick={() => setIsAuto(false)} 
              disabled={autoRunning}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isAuto ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
            >
              Manual
            </button>
            <button 
              onClick={() => setIsAuto(true)} 
              disabled={autoRunning}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isAuto ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
            >
              Auto
            </button>
          </div>

          <div>
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">Bet Amount</label>
            <div className="flex gap-2">
              <input type="number" value={betAmount}
                onChange={e => setBetAmount(Number(e.target.value))}
                disabled={isControlsDisabled && !isAuto}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-3 text-white font-mono text-lg focus:border-teal-500 outline-none" />
              <button onClick={() => setBetAmount(b => b / 2)} disabled={isControlsDisabled && !isAuto} className="bg-white/5 px-3 rounded-xl text-gray-400 font-bold hover:bg-white/10">½</button>
              <button onClick={() => setBetAmount(b => b * 2)} disabled={isControlsDisabled && !isAuto} className="bg-white/5 px-3 rounded-xl text-gray-400 font-bold hover:bg-white/10">2×</button>
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">Risk Level</label>
            <div className="flex gap-1 bg-black/30 p-1 rounded-xl">
              {(['low', 'medium', 'high'] as const).map(r => (
                <button key={r} onClick={() => setRisk(r)}
                  disabled={isControlsDisabled}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize ${
                    risk === r ? 'bg-teal-500 text-black shadow-md' : 'text-gray-500 hover:text-white'
                  }`}>{r}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">Rows</label>
            <div className="flex gap-1 bg-black/30 p-1 rounded-xl">
              {([8, 12, 16] as const).map(r => (
                <button key={r} onClick={() => setRows(r)}
                  disabled={isControlsDisabled}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                    rows === r ? 'bg-teal-500 text-black shadow-md' : 'text-gray-500 hover:text-white'
                  }`}>{r}</button>
              ))}
            </div>
          </div>

          {isAuto && (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Number of Bets</label>
                  <input type="number" value={autoConfig.numBets} onChange={e => setAutoConfig({...autoConfig, numBets: Number(e.target.value)})} disabled={autoRunning} className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-2 font-mono text-sm text-white disabled:opacity-50" placeholder="0 = infinite" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Drop Speed</label>
                  <select value={autoConfig.dropRateMs} onChange={e => setAutoConfig({...autoConfig, dropRateMs: Number(e.target.value)})} disabled={autoRunning} className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-2 font-mono text-sm text-white disabled:opacity-50">
                     <option value={1000}>Normal (1s)</option>
                     <option value={500}>Fast (0.5s)</option>
                     <option value={150}>Instant (0.15s)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="bg-black/30 rounded-xl p-4 text-sm border border-white/5 mt-auto">
            <div className="flex justify-between text-gray-500 mb-1 font-bold uppercase tracking-widest text-[10px]">
              <span>Balance</span>
              <span className="text-teal-400 text-sm font-mono">₹{balance.toLocaleString()}</span>
            </div>
          </div>

          <motion.button 
            onClick={isAuto ? toggleAuto : executeDrop} 
            disabled={(isControlsDisabled && !isAuto) || betAmount > balance}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-4 uppercase tracking-widest text-lg font-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.4)] ${
               autoRunning ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
               ((isControlsDisabled && !isAuto) || betAmount > balance) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
               'bg-teal-500 hover:bg-teal-400 text-black shadow-[0_0_20px_rgba(45,212,191,0.3)]'
            }`}
          >
            {autoRunning ? 'Stop Autobet' : isAuto ? 'Start Autobet' : 'Drop Ball'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
