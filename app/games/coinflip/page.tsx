'use client'
import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import gsap from 'gsap'
import { GameSounds } from '@/lib/sounds'
import { WinEffect } from '@/components/WinEffect'

function Coin3D({ flipping, result, onFlipComplete }: {
  flipping: boolean, result: 'heads' | 'tails' | null, onFlipComplete: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (flipping && groupRef.current) {
      // Start spin
      gsap.killTweensOf(groupRef.current.rotation)
      groupRef.current.rotation.set(0, 0, 0)
      
      const targetY = result === 'heads' 
        ? Math.PI * 10 // Ends on front
        : Math.PI * 11 // Ends on back (rotated 180 deg)

      gsap.to(groupRef.current.rotation, {
        y: targetY,
        duration: 2.0,
        ease: 'power3.out',
        onComplete: () => {
          onFlipComplete()
        }
      })
    }
  }, [flipping, result, onFlipComplete])

  return (
    <group ref={groupRef}>
      {/* Coin Edge (Cylinder) */}
      <mesh>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
        <meshStandardMaterial color="#b8860b" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Heads Face (Gold) */}
      <mesh position={[0, 0, 0.051]}>
        <cylinderGeometry args={[1.45, 1.45, 0.01, 32]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Tails Face (Silver) */}
      <mesh position={[0, 0, -0.051]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[1.45, 1.45, 0.01, 32]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

export default function CoinFlipPage() {
  const [betAmount, setBetAmount] = useState(100)
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads')
  const [flipping, setFlipping] = useState(false)
  const [result, setResult] = useState<'heads' | 'tails' | null>(null)
  const [lastWon, setLastWon] = useState<boolean | null>(null)
  const [balance, setBalance] = useState(1000)
  const [showWinEffect, setShowWinEffect] = useState(false)
  const [history, setHistory] = useState<Array<{choice: string, result: string, won: boolean, payout: number}>>([])

  const potentialPayout = betAmount * 1.95

  const handleFlip = async () => {
    if (flipping || betAmount > balance) return
    setFlipping(true)
    setResult(null)
    setLastWon(null)
    setShowWinEffect(false)

    try {
      const res = await fetch('/api/games/coinflip/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, choice, clientSeed: crypto.randomUUID() })
      })
      const data = await res.json()

      // Set visual result for 3D coin flip
      setResult(data.result)
      GameSounds.bet()

      // The GSAP animation finishes in 2.0s, so we configure timeout to match
      setTimeout(() => {
        setLastWon(data.won)
        setBalance(data.newBalance)
        setHistory(prev => [{ choice, result: data.result, won: data.won, payout: data.payout }, ...prev.slice(0, 9)])
        setFlipping(false)

        if (data.won) {
          GameSounds.win()
          setShowWinEffect(true)
        } else {
          GameSounds.lose()
        }
      }, 2100)

    } catch (err) {
      setFlipping(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <WinEffect show={showWinEffect} amount={potentialPayout} />
      
      {/* 3D Canvas */}
      <div className="h-64 w-full relative">
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#ffd700" />
          <Environment preset="night" />
          <Coin3D flipping={flipping} result={result} onFlipComplete={() => {}} />
        </Canvas>

        {/* Result Overlay */}
        {lastWon !== null && !flipping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute top-4 right-4 px-4 py-2 rounded-xl font-bold text-lg ${
              lastWon ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {lastWon ? `+₹${potentialPayout}` : `-₹${betAmount}`}
          </motion.div>
        )}
      </div>

      {/* Game Controls */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
        {/* Choice Selection */}
        <div className="md:col-span-2 bg-[#12121a] rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4">Choose Side</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setChoice('heads')}
                className={`flex-1 py-6 rounded-xl font-bold text-lg transition-all border ${
                  choice === 'heads' 
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500 shadow-lg shadow-yellow-500/10' 
                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                }`}
              >
                🪙 Heads (Gold)
              </button>
              <button
                onClick={() => setChoice('tails')}
                className={`flex-1 py-6 rounded-xl font-bold text-lg transition-all border ${
                  choice === 'tails' 
                    ? 'bg-gray-500/20 text-gray-200 border-gray-400 shadow-lg shadow-gray-400/10' 
                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                }`}
              >
                🪙 Tails (Silver)
              </button>
            </div>
          </div>

          {/* History */}
          <div className="mt-6">
            <p className="text-gray-400 text-sm mb-2">History</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.map((h, i) => (
                <div key={i} className={`flex-shrink-0 w-16 h-8 rounded-lg flex items-center justify-center text-xs font-bold capitalize ${
                  h.won ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {h.result}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bet Panel */}
        <div className="bg-[#12121a] rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Bet Amount</label>
            <div className="flex gap-2">
              <input
                type="number" value={betAmount}
                onChange={e => setBetAmount(Number(e.target.value))}
                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-3 text-white text-lg focus:border-yellow-500 focus:outline-none"
              />
              <button onClick={() => setBetAmount(b => b / 2)} className="bg-white/10 px-3 rounded-xl text-gray-400 hover:bg-white/20">½</button>
              <button onClick={() => setBetAmount(b => b * 2)} className="bg-white/10 px-3 rounded-xl text-gray-400 hover:bg-white/20">2×</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[10, 50, 100, 500, 1000, 5000].map(amt => (
              <button key={amt} onClick={() => setBetAmount(amt)}
                className="bg-white/10 hover:bg-white/20 rounded-lg py-2 text-xs text-gray-300 transition-colors">
                ₹{amt}
              </button>
            ))}
          </div>

          <div className="bg-white/5 rounded-xl p-3 text-sm">
            <div className="flex justify-between text-gray-400 mb-1">
              <span>Balance</span>
              <span className="text-white font-bold">₹{balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Est. Payout</span>
              <span className="text-green-400 font-bold">₹{potentialPayout.toFixed(2)}</span>
            </div>
          </div>

          <motion.button
            onClick={handleFlip}
            disabled={flipping || betAmount > balance}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              flipping ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
              betAmount > balance ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
              'bg-yellow-500 hover:bg-yellow-400 text-black cursor-pointer'
            }`}
          >
            {flipping ? '🪙 Flipping...' : '🪙 Flip Coin'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
