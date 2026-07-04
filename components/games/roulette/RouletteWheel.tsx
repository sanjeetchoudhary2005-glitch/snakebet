"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import * as THREE from "three";

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33,
  1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

interface RouletteWheelProps {
  spinning: boolean;
  resultNumber: number | null;
  onSpinComplete: () => void;
}

const WheelModel = ({ spinning, resultNumber, onSpinComplete }: RouletteWheelProps) => {
  const wheelRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const [spinPhase, setSpinPhase] = useState<"idle" | "spinning" | "settling">("idle");
  const spinTimeRef = useRef(0);
  const initialWheelRotation = useRef(0);
  const targetPocketAngle = useRef(0);

  useEffect(() => {
    if (spinning && spinPhase === "idle") {
      setSpinPhase("spinning");
      spinTimeRef.current = 0;
      initialWheelRotation.current = wheelRef.current?.rotation.y || 0;
      
      if (resultNumber !== null) {
        const index = ROULETTE_NUMBERS.indexOf(resultNumber);
        const segmentAngle = (Math.PI * 2) / 37;
        targetPocketAngle.current = index * segmentAngle;
      }
    }
  }, [spinning, resultNumber, spinPhase]);

  useFrame((state, delta) => {
    if (!wheelRef.current || !ballRef.current) return;

    // Constantly rotate wheel slowly
    const baseWheelSpeed = 1.5; // rad/s
    wheelRef.current.rotation.y -= baseWheelSpeed * delta;

    if (spinPhase === "spinning" || spinPhase === "settling") {
      spinTimeRef.current += delta;
      const t = spinTimeRef.current;
      const totalSpinTime = 5.0; // 5 seconds spin

      if (t < totalSpinTime) {
        // Ball spirals inward
        const progress = t / totalSpinTime;
        // Fast rotation initially, slowing down
        const ballSpeed = 15 * Math.max(0.1, 1 - progress * 0.9);
        const radius = 4.5 - (progress * 1.5); // Moves from 4.5 to 3.0
        
        // Ball rotates opposite to wheel
        const ballAngle = t * ballSpeed;
        
        ballRef.current.position.x = Math.cos(ballAngle) * radius;
        ballRef.current.position.z = Math.sin(ballAngle) * radius;
        ballRef.current.position.y = 0.5 - (progress * 0.5); // drops slightly

        // When almost done, align ball with the target pocket on the spinning wheel
        if (progress > 0.95 && resultNumber !== null) {
            setSpinPhase("settling");
        }
      } else {
        // Settled into pocket
        if (spinPhase === "settling") {
          onSpinComplete();
          setSpinPhase("idle");
        }
        
        // Pin ball to the winning pocket on the wheel
        if (resultNumber !== null) {
           // We need the absolute world position of the target pocket
           // wheelRef.current.rotation.y gives us current wheel angle
           const finalAngle = wheelRef.current.rotation.y + targetPocketAngle.current;
           const settleRadius = 3.0;
           ballRef.current.position.x = Math.cos(finalAngle) * settleRadius;
           ballRef.current.position.z = Math.sin(finalAngle) * settleRadius;
           ballRef.current.position.y = 0.1;
        }
      }
    } else if (spinPhase === "idle" && resultNumber !== null) {
       // Keep ball pinned
       const finalAngle = wheelRef.current.rotation.y + targetPocketAngle.current;
       const settleRadius = 3.0;
       ballRef.current.position.x = Math.cos(finalAngle) * settleRadius;
       ballRef.current.position.z = Math.sin(finalAngle) * settleRadius;
       ballRef.current.position.y = 0.1;
    }
  });

  const getPocketColor = (num: number) => {
    if (num === 0) return "#22c55e"; // green
    return RED_NUMBERS.includes(num) ? "#ef4444" : "#1f2937"; // red / dark gray
  };

  return (
    <group>
      {/* Outer wooden bowl */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <cylinderGeometry args={[5.5, 5, 1, 64]} />
        <meshStandardMaterial color="#3E2723" roughness={0.8} />
      </mesh>

      <group ref={wheelRef}>
        {/* Inner spinning track */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <cylinderGeometry args={[4.5, 4.5, 0.2, 64]} />
          <meshStandardMaterial color="#111" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Pockets */}
        {ROULETTE_NUMBERS.map((num, i) => {
          const angle = (i * Math.PI * 2) / 37;
          return (
            <group key={num} rotation={[0, -angle, 0]}>
              <mesh position={[3.2, 0.15, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[0.6, 0.4]} />
                <meshStandardMaterial color={getPocketColor(num)} />
              </mesh>
            </group>
          );
        })}

        {/* Center Spindle */}
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 1.5, 1, 32]} />
          <meshStandardMaterial color="#D4A647" metalness={0.9} roughness={0.2} />
        </mesh>
        
        {/* Decorative center cross */}
        <mesh position={[0, 1, 0]}>
           <boxGeometry args={[1.5, 0.1, 0.2]} />
           <meshStandardMaterial color="#D4A647" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1, 0]} rotation={[0, Math.PI/2, 0]}>
           <boxGeometry args={[1.5, 0.1, 0.2]} />
           <meshStandardMaterial color="#D4A647" metalness={1} roughness={0.1} />
        </mesh>
      </group>

      {/* The Ball */}
      <mesh ref={ballRef} position={[4.5, 0.5, 0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.1} />
      </mesh>
    </group>
  );
};

export const RouletteWheel = ({ spinning, resultNumber, onSpinComplete }: RouletteWheelProps) => {
  return (
    <div className="w-full h-full relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 8, 8]} fov={45} rotation={[-Math.PI / 4, 0, 0]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={1} color="#2DD4BF" />
        
        <WheelModel spinning={spinning} resultNumber={resultNumber} onSpinComplete={onSpinComplete} />
        
        <Environment preset="studio" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={spinning} autoRotateSpeed={-1.0} />
      </Canvas>
      
      {/* 2D Overlay for Result */}
      {resultNumber !== null && !spinning && (
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-500">
           <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Winning Number</span>
           <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-black shadow-inner ${resultNumber === 0 ? 'bg-green-500 text-black' : RED_NUMBERS.includes(resultNumber) ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
             {resultNumber}
           </div>
        </div>
      )}
    </div>
  );
};
