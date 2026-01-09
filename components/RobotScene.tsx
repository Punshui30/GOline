'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls, useGLTF, Float } from '@react-three/drei';
import * as THREE from 'three';

// Fallback Placeholder Robot (if GLB missing)
function PlaceholderRobot(props: any) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });

    return (
        <mesh ref={meshRef} {...props}>
            <boxGeometry args={[1.5, 2, 1]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.8} />
            <mesh position={[0, 0.5, 0.6]}>
                <boxGeometry args={[1.2, 0.5, 0.2]} />
                <meshBasicMaterial color="#00ff00" />
            </mesh>
        </mesh>
    );
}

// Basic Error Boundary to catch 404s
class ErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

// GLB Loader Component
function RobotModel({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} scale={2} />;
}

export default function RobotScene({ modelUrl }: { modelUrl?: string }) {
    return (
        <div className="w-full h-full">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />

                {/* Environment & Lighting */}
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={100} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={50} color="blue" />
                <Environment preset="city" />

                {/* Floating Animation Wrapper */}
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <Suspense fallback={<PlaceholderRobot />}>
                        <ErrorBoundary fallback={<PlaceholderRobot />}>
                            {modelUrl ? <RobotModel url={modelUrl} /> : <PlaceholderRobot />}
                        </ErrorBoundary>
                    </Suspense>
                </Float>
            </Canvas>
        </div>
    );
}
