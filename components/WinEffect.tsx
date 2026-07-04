'use client'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'

export function WinEffect({ show, amount }: { show: boolean, amount: number }) {
  useEffect(() => {
    if (!show) return
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#00FF7F', '#00BFFF'],
    })
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: 2, duration: 0.5 }}
              className="text-8xl"
            >
              🎉
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-black text-yellow-400 mt-4 drop-shadow-lg"
            >
              +₹{amount.toLocaleString()}
            </motion.div>
            <div className="text-white text-xl font-bold mt-2">YOU WIN!</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
