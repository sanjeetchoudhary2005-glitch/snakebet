'use client'
import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Environment } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { WinEffect } from '@/components/WinEffect'

// 3D Dice component
function Dice3D({ rolling, result }: {
  rolling: boolean, result: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const rotationSpeed = useRef({ x: 0, y: 0, z: 0 })
  const targetRotation = useRef(new THREE.Euler())

  // Face rotations for each dice value
  const FACE_ROTATIONS: Record<number, [number, number, number]> = {
    1: [0, 0, 0],
    2: [Math.PI / 2, 0, 0],
    3: [0, -Math.PI / 2, 0],
    4: [0, Math.PI / 2, 0],
    5: [-Math.PI / 2, 0, 0],
    6: [Math.PI, 0, 0],
  }

  useEffect(() => {
    if (rolling) {
      rotationSpeed.current = {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.5,
      }
    } else if (result > 0) {
      const [rx, ry, rz] = FACE_ROTATIONS[result] ?? [0, 0, 0]
      targetRotation.current = new THREE.Euler(rx, ry, rz)
    }
  }, [rolling, result])

  useFrame(() => {
    if (!meshRef.current) return
    if (rolling) {
      meshRef.current.rotation.x += rotationSpeed.current.x
      meshRef.current.rotation.y += rotationSpeed.current.y
      meshRef.current.rotation.z += rotationSpeed.current.z
      rotationSpeed.current.x *= 0.99
      rotationSpeed.current.y *= 0.99
      rotationSpeed.current.z *= 0.99
    } else {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x, targetRotation.current.x, 0.1
      )
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y, targetRotation.current.y, 0.1
      )
    }
  })

  return (
    <RoundedBox ref={meshRef} args={[2, 2, 2]} radius={0.2} smoothness={4}>
      <meshStandardMaterial color="#1a1a2e" roughness={0.1} metalness={0.8} />
    </RoundedBox>
  )
}

export default function DiceGame() {
  const [betAmount, setBetAmount] = useState(100)
  const [target, setTarget] = useState(50)
  const [direction, setDirection] = useState<'under' | 'over'>('under')
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [lastWon, setLastWon] = useState<boolean | null>(null)
  const [balance, setBalance] = useState(1000)
  const [history, setHistory] = useState<Array<{roll: number, won: boolean, payout: number}>>([])
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [showWinEffect, setShowWinEffect] = useState(false)

  // Auto bet state
  const [isAuto, setIsAuto] = useState(false)
  const [autoRunning, setAutoRunning] = useState(false)
  const [autoConfig, setAutoConfig] = useState({
    numBets: 0,
    stopProfit: 0,
    stopLoss: 0,
    onWinIncrease: 0,
    onLossIncrease: 0
  })
  
  const [autoState, setAutoState] = useState({
    betsRemaining: 0,
    startingBalance: 0,
    currentBet: 0
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

  const winChance = direction === 'under' ? target : 100 - target
  const multiplier = parseFloat(((100 / winChance) * 0.97).toFixed(4))
  const potentialPayout = parseFloat((betAmount * multiplier).toFixed(2))

  const executeRoll = async (currentBetAmt: number) => {
    if (currentBetAmt > balance) throw new Error("Insufficient funds")
    
    setRolling(true)
    setResult(null)
    setShowWinEffect(false)
    setLastWon(null)

    const res = await fetch('/api/games/dice/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betAmount: currentBetAmt, target, direction, clientSeed: crypto.randomUUID() })
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to roll dice')
    }
    
    const data = await res.json()
    
    // Simulate dice rolling time
    await new Promise(resolve => setTimeout(resolve, 800))
    
    setResult(Math.ceil(data.roll / 10) || 1)
    setLastWon(data.won)
    if (data.newBalance !== undefined) setBalance(data.newBalance)
    setHistory(prev => [{ roll: data.roll, won: data.won, payout: data.payout }, ...prev.slice(0, 9)])
    setRolling(false)

    if (data.won && potentialPayout >= currentBetAmt * 10) {
      setShowWinEffect(true)
    }

    return data
  }

  const handleRoll = async () => {
    if (rolling || betAmount > balance) return
    try {
      await executeRoll(betAmount)
    } catch (err) {
      console.error(err)
      setRolling(false)
    }
  }

  // Auto bet loop
  useEffect(() => {
    if (!autoRunning || rolling) return

    const runAuto = async () => {
      // Check stop conditions
      const profit = balance - autoState.startingBalance
      const loss = autoState.startingBalance - balance

      if (autoState.betsRemaining === 0 && autoConfig.numBets > 0) {
        setAutoRunning(false)
        return
      }
      if (autoConfig.stopProfit > 0 && profit >= autoConfig.stopProfit) {
        setAutoRunning(false)
        return
      }
      if (autoConfig.stopLoss > 0 && loss >= autoConfig.stopLoss) {
        setAutoRunning(false)
        return
      }

      try {
        const data = await executeRoll(autoState.currentBet)
        
        let nextBet = autoState.currentBet
        if (data.won && autoConfig.onWinIncrease > 0) {
          nextBet += nextBet * (autoConfig.onWinIncrease / 100)
        } else if (!data.won && autoConfig.onLossIncrease > 0) {
          nextBet += nextBet * (autoConfig.onLossIncrease / 100)
        } else {
          nextBet = betAmount // reset to base
        }

        setAutoState(prev => ({
          ...prev,
          betsRemaining: prev.betsRemaining > 0 ? prev.betsRemaining - 1 : 0,
          currentBet: nextBet
        }))

      } catch (err) {
        console.error("Auto bet error:", err)
        setAutoRunning(false)
      }
    }

    // Delay slightly between autobets
    const timer = setTimeout(() => {
      runAuto()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [autoRunning, rolling, balance, autoState, autoConfig, betAmount])

  const toggleAuto = () => {
    if (autoRunning) {
      setAutoRunning(false)
    } else {
      setAutoState({
        betsRemaining: autoConfig.numBets,
        startingBalance: balance,
        currentBet: betAmount
      })
      setAutoRunning(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0B14] text-white flex flex-col">
      <WinEffect show={showWinEffect} amount={potentialPayout} />
      
      {/* 3D Canvas */}
      <div className="h-72 w-full relative">
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#2DD4BF" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#D4A647" />
          <Environment preset="night" />
          <Dice3D rolling={rolling} result={result ?? 0} />
        </Canvas>

        {/* Result overlay */}
        {lastWon !== null && !rolling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`absolute top-4 right-4 px-4 py-2 rounded-xl font-bold text-lg ${
              lastWon ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {lastWon ? `+₹${potentialPayout}` : `-₹${betAmount}`}
          </motion.div>
        )}
      </div>

      {/* Game Controls */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto w-full">
        {/* Slider & Info */}
        <div className="md:col-span-2 bg-[#161224] rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between mb-8">
              <button
                onClick={() => setDirection('under')}
                disabled={autoRunning}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  direction === 'under' ? 'bg-teal-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Roll Under
              </button>
              <div className="text-center relative group">
                <p className="text-5xl font-black text-yellow-400 drop-shadow-md">{target}</p>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Target</p>
              </div>
              <button
                onClick={() => setDirection('over')}
                disabled={autoRunning}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  direction === 'over' ? 'bg-teal-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Roll Over
              </button>
            </div>

            <div className="relative pt-4 pb-8">
              <input
                type="range" min={2} max={98} value={target}
                onChange={e => setTarget(Number(e.target.value))}
                disabled={autoRunning}
                className="w-full h-3 rounded-full appearance-none cursor-pointer bg-white/10 accent-teal-400"
              />
              <div className="absolute top-10 left-0 text-xs font-mono text-gray-500">0</div>
              <div className="absolute top-10 right-0 text-xs font-mono text-gray-500">100</div>
              {/* Marker thumb value */}
              <div 
                className="absolute top-[-10px] w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center text-black font-bold text-xs pointer-events-none transform -translate-x-1/2 shadow-[0_0_15px_rgba(45,212,191,0.5)]"
                style={{ left: \`calc(\${(target - 2) / 96 * 100}%)_ - _\${((target - 2) / 96 * 16) - 8}px)\` }}
              >
                {target}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 text-center">
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Win Chance</p>
                <p className="text-white font-black text-2xl">{winChance}%</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Multiplier</p>
                <p className="text-yellow-400 font-black text-2xl">{multiplier}x</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Payout</p>
                <p className="text-green-400 font-black text-2xl">₹{potentialPayout}</p>
              </div>
            </div>
          </div>

          {/* Roll history */}
          <div className="mt-8">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">History</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.map((h, i) => (
                <div key={i} className={`flex-shrink-0 w-12 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  h.won ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {h.roll.toFixed(0)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bet Panel */}
        <div className="bg-[#161224] rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
          
          <div className="flex bg-black/30 p-1 rounded-xl mb-2">
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
            <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Bet Amount</label>
            <div className="flex gap-2">
              <input
                type="number" value={betAmount}
                onChange={e => setBetAmount(Number(e.target.value))}
                disabled={autoRunning}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-3 font-mono text-white text-lg focus:border-teal-500 focus:outline-none disabled:opacity-50"
              />
              <button onClick={() => setBetAmount(b => b / 2)} disabled={autoRunning} className="bg-white/5 px-3 rounded-xl text-gray-400 hover:bg-white/10 font-bold">½</button>
              <button onClick={() => setBetAmount(b => b * 2)} disabled={autoRunning} className="bg-white/5 px-3 rounded-xl text-gray-400 hover:bg-white/10 font-bold">2×</button>
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
                  <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Stop on Profit</label>
                  <input type="number" value={autoConfig.stopProfit} onChange={e => setAutoConfig({...autoConfig, stopProfit: Number(e.target.value)})} disabled={autoRunning} className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-2 font-mono text-sm text-white disabled:opacity-50" placeholder="₹0" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">On Win (Inc %)</label>
                  <input type="number" value={autoConfig.onWinIncrease} onChange={e => setAutoConfig({...autoConfig, onWinIncrease: Number(e.target.value)})} disabled={autoRunning} className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-2 font-mono text-sm text-white disabled:opacity-50" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">On Loss (Inc %)</label>
                  <input type="number" value={autoConfig.onLossIncrease} onChange={e => setAutoConfig({...autoConfig, onLossIncrease: Number(e.target.value)})} disabled={autoRunning} className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-2 font-mono text-sm text-white disabled:opacity-50" />
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
            onClick={isAuto ? toggleAuto : handleRoll}
            disabled={(!isAuto && rolling) || betAmount > balance}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.4)] ${
              autoRunning ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
              (!isAuto && rolling) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
              betAmount > balance ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
              'bg-teal-500 hover:bg-teal-400 text-black shadow-[0_0_20px_rgba(45,212,191,0.3)]'
            }`}
          >
            {autoRunning ? 'Stop Autobet' : isAuto ? 'Start Autobet' : 'Roll Dice'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
