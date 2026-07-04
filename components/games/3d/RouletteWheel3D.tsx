'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import * as THREE from 'three';

const ROULETTE_POCKETS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
  11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
  22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

interface WheelProps {
  winningNumber: number | null;
  isSpinning: boolean;
  onSpinComplete: () => void;
}

function WheelScene({ winningNumber, isSpinning, onSpinComplete }: WheelProps) {
  const wheelRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  // Animation states
  const [spinProgress, setSpinProgress] = useState<'idle' | 'spinning' | 'dropping' | 'bouncing' | 'settled'>('idle');
  const spinTime = useRef(0);
  const duration = 4.0; // Total spin duration in seconds
  const currentWinningIndex = winningNumber !== null ? ROULETTE_POCKETS.indexOf(winningNumber) : 0;
  
  // Physics parameters tracked over time
  const wheelAngle = useRef(0);
  const ballAngle = useRef(0);
  const ballRadius = useRef(1.4);
  const ballHeight = useRef(0.2);
  const cameraShake = useRef(0);

  // Sound triggers
  const lastBounceTick = useRef(0);

  useEffect(() => {
    if (isSpinning) {
      setSpinProgress('spinning');
      spinTime.current = 0;
      ballRadius.current = 1.45;
      ballHeight.current = 0.22;
      ballAngle.current = Math.random() * Math.PI * 2;
    }
  }, [isSpinning]);

  useFrame((state, delta) => {
    // 1. Rotate the main wheel group
    if (wheelRef.current) {
      let wheelSpeed = 0.8; // Default idle rotation speed
      if (spinProgress === 'spinning') {
        wheelSpeed = 2.5;
      } else if (spinProgress === 'dropping' || spinProgress === 'bouncing') {
        wheelSpeed = 1.5;
      } else if (spinProgress === 'settled') {
        wheelSpeed = 0.6; // Slow down after landing
      }
      wheelAngle.current += wheelSpeed * delta;
      wheelRef.current.rotation.y = wheelAngle.current;
    }

    // 2. Animate the ball
    if (spinProgress !== 'idle' && ballRef.current) {
      spinTime.current += delta;
      const t = spinTime.current;

      if (t < duration * 0.5) {
        // High speed spin in opposite direction of the wheel
        setSpinProgress('spinning');
        ballAngle.current -= 5.0 * delta;
        ballRadius.current = 1.45;
        ballHeight.current = 0.22;
      } else if (t < duration * 0.8) {
        // Decelerating and dropping down towards the pockets
        setSpinProgress('dropping');
        const dropFactor = (t - duration * 0.5) / (duration * 0.3); // 0 to 1
        
        // Ball slows down and gets pulled in
        ballAngle.current -= (5.0 * (1 - dropFactor * 0.6)) * delta;
        ballRadius.current = 1.45 - 0.35 * dropFactor; // Outer rim to pocket radius
        ballHeight.current = 0.22 - 0.12 * dropFactor;
      } else if (t < duration) {
        // Bouncing inside the pocket partitions
        setSpinProgress('bouncing');
        const bounceFactor = (t - duration * 0.8) / (duration * 0.2); // 0 to 1
        
        // Target angle on wheel matching the winning pocket index
        const targetWheelAngle = currentWinningIndex * (Math.PI * 2 / 37);
        // Absolute angle of the winning pocket in world space
        const targetWorldAngle = -wheelAngle.current + targetWheelAngle;
        
        // Lerp the ball angle into alignment with the pocket
        const angleDiff = targetWorldAngle - ballAngle.current;
        ballAngle.current += angleDiff * delta * 12;

        // Visual bouncing bounce effect using sine wave
        const bounceAmplitude = Math.max(0, 0.08 * (1 - bounceFactor));
        ballRadius.current = 1.1 + Math.abs(Math.sin(t * 30)) * bounceAmplitude;
        ballHeight.current = 0.1 + Math.abs(Math.sin(t * 30)) * bounceAmplitude * 1.5;

        // Trigger a tiny rattle tick sound
        if (t - lastBounceTick.current > 0.07 && bounceAmplitude > 0.01) {
          lastBounceTick.current = t;
          console.log('[R3F Sound] Ball bounce tick');
        }
      } else {
        // Settled inside the pocket
        if (spinProgress !== 'settled') {
          setSpinProgress('settled');
          cameraShake.current = 0.04; // Trigger camera landing impact shake
          onSpinComplete();
        }
        
        // Keep ball locked inside the physical pocket index in world space
        const targetWheelAngle = currentWinningIndex * (Math.PI * 2 / 37);
        const targetWorldAngle = -wheelAngle.current + targetWheelAngle;
        ballAngle.current = targetWorldAngle;
        ballRadius.current = 1.1;
        ballHeight.current = 0.09;
      }

      // Position the ball in Cartesian 3D coordinates based on angle & radius
      ballRef.current.position.x = Math.cos(ballAngle.current) * ballRadius.current;
      ballRef.current.position.z = Math.sin(ballAngle.current) * ballRadius.current;
      ballRef.current.position.y = ballHeight.current;
    } else if (ballRef.current && spinProgress === 'idle') {
      // Idle state placement
      ballRef.current.position.x = 0;
      ballRef.current.position.z = 1.1;
      ballRef.current.position.y = 0.09;
    }

    // 3. Camera Lerp Orbit / Shake
    if (camera) {
      let targetCamX = 0;
      let targetCamY = 2.4;
      let targetCamZ = 2.4;

      if (spinProgress === 'spinning' || spinProgress === 'dropping') {
        // Action camera slightly orbits during active spin
        targetCamX = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.3;
        targetCamY = 2.6;
        targetCamZ = 2.6;
      } else if (spinProgress === 'bouncing' || spinProgress === 'settled') {
        // Zoom close-up on winning landing zone
        if (ballRef.current) {
          targetCamX = ballRef.current.position.x * 0.6;
          targetCamZ = ballRef.current.position.z * 0.6 + 1.2;
          targetCamY = 1.6;
        }
      }

      // Lerp camera
      camera.position.x += (targetCamX - camera.position.x) * delta * 4;
      camera.position.y += (targetCamY - camera.position.y) * delta * 4;
      camera.position.z += (targetCamZ - camera.position.z) * delta * 4;
      camera.lookAt(0, -0.1, 0);

      // Apply camera shake if any
      if (cameraShake.current > 0.001) {
        camera.position.x += (Math.random() - 0.5) * cameraShake.current;
        camera.position.y += (Math.random() - 0.5) * cameraShake.current;
        cameraShake.current *= 0.9; // Decays camera shake
      }
    }
  });

  return (
    <group>
      {/* Outer Wheel rim / base structure */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[1.7, 1.8, 0.3, 40]} />
        <meshStandardMaterial color="#2d1d18" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Rotating Wheel Group */}
      <group ref={wheelRef}>
        {/* Core Wood Cone */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 0.15, 64]} />
          <meshStandardMaterial color="#4a2618" roughness={0.4} metalness={0.1} />
        </mesh>
        
        {/* Inner golden decorative rim */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <torusGeometry args={[1.2, 0.03, 16, 64]} />
          <meshStandardMaterial color="#c5a880" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Pockets & Dividers */}
        {ROULETTE_POCKETS.map((num, i) => {
          const angle = i * (Math.PI * 2 / 37);
          const isRed = RED_NUMBERS.includes(num);
          const isZero = num === 0;
          const pocketColor = isZero ? '#15803d' : isRed ? '#b91c1c' : '#030712';

          return (
            <group key={num} rotation={[0, -angle, 0]}>
              {/* Pocket color badge */}
              <mesh position={[0, 0.065, 1.1]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.15, 0.22]} />
                <meshStandardMaterial color={pocketColor} roughness={0.6} />
              </mesh>
              {/* Metal divider spokes */}
              <mesh position={[0.09, 0.08, 1.1]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.015, 0.05, 0.25]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Center Metallic Turret Spindle */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.15, 0.22, 0.35, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* The Ball */}
      <mesh ref={ballRef} castShadow>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
}

export function RouletteWheel3D({ winningNumber, isSpinning, onSpinComplete }: WheelProps) {
  return (
    <div className="w-full h-80 md:h-[400px] bg-[#0b0f19] rounded-xl border border-white/5 relative shadow-inner overflow-hidden">
      {/* Visual Overlay: Single overhead spotlight highlight */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(3,7,18,0.7)_80%)] z-10" />

      <Canvas
        shadows
        camera={{ position: [0, 2.4, 2.4], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#090d16']} />
        
        {/* Lights */}
        <ambientLight intensity={0.6} />
        
        {/* High-contrast spotlight to render real shadows and wood grain shine */}
        <spotLight
          position={[0, 8, 2]}
          angle={0.3}
          penumbra={0.7}
          intensity={80}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />

        <Center>
          <WheelScene
            winningNumber={winningNumber}
            isSpinning={isSpinning}
            onSpinComplete={onSpinComplete}
          />
        </Center>
      </Canvas>
    </div>
  );
}
