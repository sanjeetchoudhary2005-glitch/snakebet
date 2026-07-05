'use client';
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Dice = ({ value, rolling }: { value: number; rolling: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [rotationTarget, setRotationTarget] = useState(new THREE.Euler(0, 0, 0));
  
  const faceRotations = [
    new THREE.Euler(0, 0, 0), // 1
    new THREE.Euler(Math.PI / 2, 0, 0), // 2
    new THREE.Euler(0, Math.PI / 2, 0), // 3
    new THREE.Euler(0, -Math.PI / 2, 0), // 4
    new THREE.Euler(-Math.PI / 2, 0, 0), // 5
    new THREE.Euler(Math.PI, 0, 0) // 6
  ];
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      if (rolling) {
        meshRef.current.rotation.x += delta * 5;
        meshRef.current.rotation.y += delta * 7;
        meshRef.current.rotation.z += delta * 3;
      } else {
        meshRef.current.rotation.x += (rotationTarget.x - meshRef.current.rotation.x) * delta * 8;
        meshRef.current.rotation.y += (rotationTarget.y - meshRef.current.rotation.y) * delta * 8;
        meshRef.current.rotation.z += (rotationTarget.z - meshRef.current.rotation.z) * delta * 8;
      }
    }
  });
  
  const updateTarget = (newValue: number) => {
    setRotationTarget(faceRotations[newValue - 1]);
  };
  
  useEffect(() => {
    updateTarget(value);
  }, [value]);
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#ff0000" />
      {/* We'd need to add texture or decals for the dots, but for now let's use a simple material */}
    </mesh>
  );
};

export function Dice3D({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div className="w-64 h-64">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Dice value={value} rolling={rolling} />
      </Canvas>
    </div>
  );
}
