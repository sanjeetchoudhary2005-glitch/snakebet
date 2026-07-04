'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import * as THREE from 'three';

interface Coin3DProps {
  rotationX: number;
  rotationY: number;
  result: 'heads' | 'tails' | null;
}

function CoinMesh({ rotationX, rotationY, result }: Coin3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = rotationX;
      meshRef.current.rotation.y = rotationY;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      {/* Cylinder representing a thin disc coin */}
      <cylinderGeometry args={[1.6, 1.6, 0.15, 40]} />
      
      {/* Gold metallic coin material */}
      <meshStandardMaterial 
        color={result === 'tails' ? '#c0c0c0' : '#d4af37'} 
        roughness={0.15} 
        metalness={0.9} 
      />
    </mesh>
  );
}

export function Coin3D({ rotationX, rotationY, result }: Coin3DProps) {
  return (
    <div className="w-[280px] h-[280px] relative select-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} className="w-full h-full rounded-2xl bg-black/10">
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={1.5} castShadow />
        <spotLight position={[0, 0, 6]} angle={0.4} penumbra={0.3} intensity={2.5} castShadow />
        <Center>
          <CoinMesh rotationX={rotationX} rotationY={rotationY} result={result} />
        </Center>
      </Canvas>
    </div>
  );
}
