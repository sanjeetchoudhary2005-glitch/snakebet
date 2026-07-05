'use client'
import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Text } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import gsap from 'gsap'
import { GameSounds } from '@/lib/sounds'
import { WinEffect } from '@/components/WinEffect'

const SEGMENTS = [
  { multiplier: 1.5, color: '#4f46e5' }, // Blue
  { multiplier: 0,   color: '#ef4444' }, // Red
  { multiplier: 2.0, color: '#8b5cf6' }, // Purple
  { multiplier: 0.5, color: '#10b981' }, // Green
  { multiplier: 5.0, color: '#f59e0b' }, // Gold
  { multiplier: 0,   color: '#ef4444' }, // Red
  { multiplier: 1.2, color: '#4f46e5' }, // Blue
  { multiplier: 0.8, color: '#10b981' }, // Green
  { multiplier: 3.0, color: '#8b5cf6' }, // Purple
  { multiplier: 0,   color: '#ef4444' }, // Red
]

function Wheel3D({ spinning, targetIndex, onSpinComplete }: {
  spinning: boolean, targetIndex: number | null, onSpinComplete: () => void
}) {
  const wheelRef = useRef<THREE.Group>(null)
  const pointerRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (spinning && targetIndex !== null && wheelRef.current) {
      gsap.killTweensOf(wheelRef.current.rotation)
      wheelRef.current.rotation.z = 0

      const segmentAngle = (2 * Math.PI) / SEGMENTS.length
      // Target rotation is multiple spins + offset to align targetIndex with pointer (at top: Math.PI / 2)
      // Top pointer corresponds to angle = Math.PI / 2.
      // So final angle should be (Math.PI / 2) - (targetIndex * segmentAngle) - (segmentAngle / 2)
      const targetAngle = (Math.PI / 2) - (targetIndex * segmentAngle) - (segmentAngle / 2)
      const rotations = Math.PI * 12 // 6 full spins

      gsap.to(wheelRef.current.rotation, {
        z: rotations + targetAngle,
        duration: 4.0,
        ease: 'power4.out',
        onUpdate: () => {
          // Subtle pointer vibration as wheel spins past segments
          if (pointerRef.current && wheelRef.current) {
            const rot = wheelRef.current.rotation.z
            const slice = Math.floor(rot / ((2 * Math.PI) / SEGMENTS.length))
            pointerRef.current.rotation.z = Math.sin(slice * 10) * 0.15
          }
        },
        onComplete: () => {
          if (pointerRef.current) {
            pointerRef.current.rotation.z = 0
          }
          onSpinComplete()
        }
      })
    }
  }, [spinning, targetIndex, onSpinComplete])

  const segmentAngle = (2 * Math.PI) / SEGMENTS.length

  return (
    <group>
      {/* Spinning Wheel */}
      <group ref={wheelRef}>
        {/* Central Hub */}
        <mesh position={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Segments */}
        {SEGMENTS.map((seg, i) => {
          const startAngle = i * segmentAngle
          const midAngle = startAngle + segmentAngle / 2
          const textX = Math.cos(midAngle) * 1.3
          const textY = Math.sin(midAngle) * 1.3

          return (
            <group key={i}>
              <mesh>
                <circleGeometry args={[1.8, 32, startAngle, segmentAngle]} />
                <meshStandardMaterial color={seg.color} side={THREE.DoubleSide} roughness={0.2} />
              </mesh>
              {/* segment divider line */}
              <mesh rotation={[0, 0, startAngle]}>
                <boxGeometry args={[1.8, 0.02, 0.01]} />
                <meshStandardMaterial color="#1a1a2e" />
              </mesh>
              {/* Text Multiplier */}
              <Text
                position={[textX, textY, 0.05]}
                rotation={[0, 0, midAngle - Math.PI / 2]}
                fontSize={0.22}
                color="#ffffff"
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                {seg.multiplier}x
              </Text>
            </group>
          )
        })}
      </group>

      {/* Pointer at the top */}
      <mesh ref={pointerRef} position={[0, 2.0, 0.15]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.15, 0.4, 4]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

export default function WheelPage() {
  const [betAmount, setBetAmount] = useState(100)
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium')
  const [spinning, setSpinning] = useState(false)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const [result, setResult] = useState<number | null>(null)
  const [lastWon, setLastWon] = useState<boolean | null>(null)
  const [balance, setBalance] = useState(1000)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [showWinEffect, setShowWinEffect] = useState(false)
  const [history, setHistory] = useState<Array<{multiplier: number, won: boolean, payout: number}>>([])

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

  const handleSpin = async () => {
    if (spinning || betAmount > balance) return
    setSpinning(true)
    setTargetIndex(null)
    setResult(null)
    setLastWon(null)
    setShowWinEffect(false)

    try {
      const res = await fetch('/api/games/wheel/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, riskLevel: risk, clientSeed: crypto.randomUUID() })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to spin wheel')
      }
      const data = await res.json()

      // The backend returns the index of the segment
      setTargetIndex(data.segmentIndex)
      GameSounds.bet()

      setTimeout(() => {
        setResult(data.multiplier)
        setLastWon(data.won)
        if (data.newBalance !== undefined) {
          setBalance(data.newBalance)
        }
        setHistory(prev => [{ multiplier: data.multiplier, won: data.won, payout: data.payout }, ...prev.slice(0, 9)])
        setSpinning(false)

        if (data.won) {
          GameSounds.win()
          setShowWinEffect(true)
        } else {
          GameSounds.lose()
        }
      }, 4200)

    } catch (err) {
      console.error(err)
      setSpinning(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <WinEffect show={showWinEffect} amount={result ? betAmount * result : 0} />

      {/* 3D Canvas */}
      <div className="h-72 w-full relative">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <spotLight position={[0, 5, 5]} angle={0.4} penumbra={1} intensity={2} color="#ffffff" castShadow />
          <Environment preset="night" />
          <Wheel3D spinning={spinning} targetIndex={targetIndex} onSpinComplete={() => {}} />
        </Canvas>

        {/* Result Overlay */}
        {lastWon !== null && !spinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute top-4 right-4 px-4 py-2 rounded-xl font-bold text-lg ${
              lastWon ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {lastWon ? `+₹${(betAmount * (result ?? 0)).toFixed(2)}` : `-₹${betAmount}`}
          </motion.div>
        )}
      </div>

      {/* Game Controls */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
        {/* Description & History */}
        <div className="md:col-span-2 bg-[#12121a] rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">3D Wheel of Fortune</h2>
            <p className="text-gray-400 text-sm mb-4">Spin the premium segmented wheel. Multipliers range from 0.5x up to 5x!</p>

            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {SEGMENTS.map((s, idx) => (
                <div key={idx} className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}20`, border: `1px solid ${s.color}` }}>
                  <p className="font-bold" style={{ color: s.color }}>{s.multiplier}x</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-gray-400 text-sm mb-2">History</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.map((h, i) => (
                <div key={i} className={`flex-shrink-0 w-16 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  h.won ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {h.multiplier}x
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

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Risk Level</label>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as const).map(r => (
                <button key={r} onClick={() => setRisk(r)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize ${
                    risk === r ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}>
                  {r}
                </button>
              ))}
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
          </div>

          <motion.button
            onClick={handleSpin}
            disabled={spinning || betAmount > balance}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              spinning ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
              betAmount > balance ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
              'bg-yellow-500 hover:bg-yellow-400 text-black cursor-pointer'
            }`}
          >
            {spinning ? '🎡 Spinning...' : '🎡 Spin Wheel'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
