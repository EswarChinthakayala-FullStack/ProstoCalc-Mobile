import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

const ParticleParams = {
    count: 2000,
    radius: 3,
    color: '#3b82f6', // blue-500
    size: 0.015,
}

function ParticleField(props) {
    const ref = useRef()
    
    // Generate random points in a sphere
    const positions = useMemo(() => {
        const positions = new Float32Array(ParticleParams.count * 3)
        for (let i = 0; i < ParticleParams.count; i++) {
            const r = ParticleParams.radius * Math.cbrt(Math.random())
            const theta = Math.random() * 2 * Math.PI
            const phi = Math.acos(2 * Math.random() - 1)
            
            const x = r * Math.sin(phi) * Math.cos(theta)
            const y = r * Math.sin(phi) * Math.sin(theta)
            const z = r * Math.cos(phi)
            
            positions[i * 3] = x
            positions[i * 3 + 1] = y
            positions[i * 3 + 2] = z
        }
        return positions
    }, [])

    useFrame((state, delta) => {
        if (ref.current) {
            // Constant slow rotation
            ref.current.rotation.x -= delta / 15
            ref.current.rotation.y -= delta / 20

            // Interactive mouse influence (adds velocity based on mouse position)
            // Normalized mouse coordinates are in state.pointer (-1 to 1)
            ref.current.rotation.x += (state.pointer.y * delta * 0.2)
            ref.current.rotation.y += (state.pointer.x * delta * 0.2)
        }
    })

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
                <PointMaterial 
                    transparent 
                    color={ParticleParams.color} 
                    size={ParticleParams.size} 
                    sizeAttenuation={true} 
                    depthWrite={false} 
                    opacity={0.6}
                />
            </Points>
        </group>
    )
}

const TechBackground = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <ParticleField />
                
                {/* Subtle fog to blend distant particles into the background color (typically the page bg) */}
                {/* We can't perfectly match the CSS gradient, so we keep fog minimal or off */}
            </Canvas>
        </div>
    )
}

export default TechBackground
