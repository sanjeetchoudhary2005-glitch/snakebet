'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import * as THREE from 'three';

interface Wheel3DProps {
  rotation: number; // Radian rotation
  segments: { multiplier: number; color: string; label: string }[];
  isSpinning: boolean;
  tickSound: () => void;
}

function WheelMesh({ rotation, segments, tickSound }: { rotation: number; segments: any[]; tickSound: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const prevAngle = useRef(0);

  // Sync animation frame rotation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z = rotation;

      // Pointer tick calculation: detects when a segment boundary crosses the top pointer position (1.5707 rad or Math.PI / 2)
      const currentAngle = rotation % (2 * Math.PI);
      const segmentAngle = (2 * Math.PI) / segments.length;
      
      const prevSegment = Math.floor(prevAngle.current / segmentAngle);
      const curSegment = Math.floor(currentAngle / segmentAngle);

      if (prevSegment !== curSegment) {
        tickSound();
      }
      prevAngle.current = currentAngle;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D Wheel Base Disc */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.25, 40]} />
        <meshStandardMaterial color="#1f2937" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Extruded Segments */}
      {segments.map((seg, idx) => {
        const theta = (2 * Math.PI) / segments.length;
        const startAngle = idx * theta;

        // Create 2D shape for the pie segment
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.arc(0, 0, 2.45, startAngle, startAngle + theta, false);
        shape.lineTo(0, 0);

        const extrudeSettings = {
          depth: 0.1,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.02,
          bevelThickness: 0.02,
        };

        return (
          <mesh 
            key={`seg-${idx}`} 
            position={[0, 0, 0.1]} 
            castShadow
          >
            <extrudeGeometry args={[shape, extrudeSettings]} />
            <meshStandardMaterial 
              color={seg.color} 
              roughness={0.4} 
              metalness={0.5} 
            />
          </mesh>
        );
      })}

      {/* Center Cap Dome */}
      <mesh position={[0, 0, 0.22]}>
        <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#facc15" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
}

export function Wheel3D({ rotation, segments, isSpinning, tickSound }: Wheel3DProps) {
  return (
    <div className="w-[300px] h-[300px] relative select-none">
      {/* Pointer Pin at top */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-8 bg-yellow-400 border border-yellow-600 rounded-b-full shadow-lg z-20 flex items-center justify-center animate-[bounce_1s_infinite]"
        style={{
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          transform: isSpinning ? 'rotate(5deg)' : 'rotate(0deg)',
          transition: 'transform 0.1s ease',
        }}
      />

      <Canvas shadows camera={{ position: [0, 0, 6], fov: 50 }} className="w-full h-full rounded-2xl bg-black/10">
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 5]} intensity={1.5} castShadow />
        <spotLight position={[0, 0, 8]} angle={0.6} penumbra={0.5} intensity={2} castShadow />
        
        <Center>
          <WheelMesh rotation={rotation} segments={segments} tickSound={tickSound} />
        </Center>
      </Canvas>
    </div>
  );
}
