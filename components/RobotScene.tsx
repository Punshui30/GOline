'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function ProceduralRobot(props: any) {
    const group = useRef<THREE.Group>(null);

    // Subtle breathing animation + Floating handled by parent
    useFrame((state) => {
        // Optional local animations
    });

    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: "#1a1a1a",
        roughness: 0.3,
        metalness: 0.8
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
        color: "#D4AF37", // Gold
        roughness: 0.2,
        metalness: 1
    });

    const glowMaterial = new THREE.MeshStandardMaterial({
        color: "#00ff88",
        emissive: "#00ff88",
        emissiveIntensity: 2,
        toneMapped: false
    });

    return (
        <group ref={group} {...props}>
            {/* HEAD */}
            <group position={[0, 1.8, 0]}>
                <RoundedBox args={[0.8, 0.9, 0.9]} radius={0.1}>
                    <primitive object={bodyMaterial} attach="material" />
                </RoundedBox>
                {/* Visor */}
                <mesh position={[0, 0.1, 0.45]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.7, 0.15, 0.05]} />
                    <primitive object={glowMaterial} attach="material" />
                </mesh>
                {/* Antenna */}
                <mesh position={[0.3, 0.5, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.5]} />
                    <primitive object={accentMaterial} attach="material" />
                </mesh>
            </group>

            {/* TORSO */}
            <group position={[0, 0.5, 0]}>
                {/* Main Body */}
                <RoundedBox args={[1.2, 1.5, 0.8]} radius={0.15}>
                    <primitive object={bodyMaterial} attach="material" />
                </RoundedBox>
                {/* Chest Plate - Gold */}
                <mesh position={[0, 0.3, 0.41]}>
                    <boxGeometry args={[0.8, 0.6, 0.05]} />
                    <primitive object={accentMaterial} attach="material" />
                </mesh>
                {/* Core Reactor */}
                <mesh position={[0, 0.3, 0.44]}>
                    <circleGeometry args={[0.15, 32]} />
                    <primitive object={glowMaterial} attach="material" />
                </mesh>
            </group>

            {/* SHOULDERS */}
            <group position={[-0.8, 1, 0]}>
                <sphereGeometry args={[0.35]} />
                <primitive object={bodyMaterial} attach="material" />
            </group>
            <group position={[0.8, 1, 0]}>
                <sphereGeometry args={[0.35]} />
                <primitive object={bodyMaterial} attach="material" />
            </group>

        </group>
    );
}

export default function RobotScene() {
    return (
        <div className="w-full h-full">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={40} />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <spotLight position={[5, 5, 5]} angle={0.25} penumbra={1} intensity={50} castShadow />
                <pointLight position={[-5, -5, 5]} intensity={20} color="#D4AF37" />

                <Environment preset="city" />

                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                    <ProceduralRobot />
                </Float>
            </Canvas>
        </div>
    );
}
