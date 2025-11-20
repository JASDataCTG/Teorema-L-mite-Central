import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { InfoIcon } from './Icons';

// --- Math Logic ---
const calculateHeight = (x: number, z: number) => 0.1 * (x * x + z * z);
const calculateGradient = (x: number, z: number) => ({ dx: 0.2 * x, dz: 0.2 * z });

// --- 3D Components ---

const GridSurface: React.FC = () => {
  const size = 20;
  const divisions = 30;
  
  const { positions, indices } = useMemo(() => {
    const pos = [];
    const idx = [];
    const halfSize = size / 2;
    const step = size / divisions;
    
    for (let i = 0; i <= divisions; i++) {
      for (let j = 0; j <= divisions; j++) {
        const x = -halfSize + i * step;
        const z = -halfSize + j * step;
        const y = calculateHeight(x, z);
        pos.push(x, y, z);
      }
    }

    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions; j++) {
        const a = i * (divisions + 1) + j;
        const b = i * (divisions + 1) + (j + 1);
        const c = (i + 1) * (divisions + 1) + (j + 1);
        const d = (i + 1) * (divisions + 1) + j;
        
        idx.push(a, b, d);
        idx.push(b, c, d);
      }
    }
    return { positions: new Float32Array(pos), indices: idx };
  }, []);

  return (
    <group>
      {/* Surface Mesh */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={positions}
            count={positions.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="index"
            array={new Uint16Array(indices)}
            count={indices.length}
            itemSize={1}
          />
        </bufferGeometry>
        <meshStandardMaterial color="#1e293b" wireframe={false} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Wireframe Overlay */}
      <mesh>
        <bufferGeometry>
            <bufferAttribute
                attach="attributes-position"
                array={positions}
                count={positions.length / 3}
                itemSize={3}
            />
            <bufferAttribute
                attach="index"
                array={new Uint16Array(indices)}
                count={indices.length}
                itemSize={1}
            />
        </bufferGeometry>
        <meshBasicMaterial color="#38bdf8" wireframe={true} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// Logic component that handles the animation loop
const SimulationController = ({ 
  isRunning, 
  learningRate, 
  onUpdateStats,
  resetTrigger 
}: { 
  isRunning: boolean;
  learningRate: number;
  onUpdateStats: (pos: {x: number, z: number}, iter: number) => void;
  resetTrigger: number;
}) => {
    const ballRef = useRef<THREE.Mesh>(null);
    const lineRef = useRef<THREE.Line>(null);
    
    // Simulation state held in refs to avoid re-renders
    const currentPos = useRef(new THREE.Vector3(8, calculateHeight(8,8), 8));
    const pathPoints = useRef<THREE.Vector3[]>([currentPos.current.clone()]);
    const iteration = useRef(0);
    const lastUpdateRef = useRef(0);

    // Handle Reset
    useEffect(() => {
        const startX = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 4);
        const startZ = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 4);
        currentPos.current.set(startX, calculateHeight(startX, startZ), startZ);
        pathPoints.current = [currentPos.current.clone()];
        iteration.current = 0;

        // Visual sync
        if (ballRef.current) ballRef.current.position.copy(currentPos.current);
        if (lineRef.current) lineRef.current.geometry.setFromPoints(pathPoints.current);
        onUpdateStats({ x: startX, z: startZ }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetTrigger]);

    useFrame((state) => {
        if (!isRunning) return;

        const { x, z } = currentPos.current;
        
        // Calculate Gradient Step
        const grad = calculateGradient(x, z);
        const newX = x - learningRate * grad.dx;
        const newZ = z - learningRate * grad.dz;

        // Check convergence/divergence
        if (Math.abs(newX) > 20 || Math.abs(newZ) > 20) return; // Prevent flying off
        if (Math.abs(newX) < 0.01 && Math.abs(newZ) < 0.01 && iteration.current > 0) return; // Converged

        // Update State
        currentPos.current.set(newX, calculateHeight(newX, newZ), newZ);
        pathPoints.current.push(currentPos.current.clone());
        iteration.current += 1;

        // Update Visuals directly
        if (ballRef.current) {
            ballRef.current.position.copy(currentPos.current);
        }
        if (lineRef.current) {
            // setFromPoints is expensive but okay for < 2000 points. 
            // For production large datasets, use buffer attributes directly.
            lineRef.current.geometry.setFromPoints(pathPoints.current);
        }

        // Throttle UI updates to ~10 times per second
        if (state.clock.elapsedTime - lastUpdateRef.current > 0.1) {
            onUpdateStats({ x: newX, z: newZ }, iteration.current);
            lastUpdateRef.current = state.clock.elapsedTime;
        }
    });

    return (
        <>
            <mesh ref={ballRef} position={[8, calculateHeight(8,8), 8]}>
                <sphereGeometry args={[0.4, 32, 32]} />
                <meshStandardMaterial color="#f97316" emissive="#c2410c" emissiveIntensity={0.5} />
            </mesh>
            <line ref={lineRef as any}>
                <bufferGeometry />
                <lineBasicMaterial color="#facc15" linewidth={3} />
            </line>
        </>
    );
}

export const GradientDescentSimulator: React.FC = () => {
  const [learningRate, setLearningRate] = useState(0.1);
  const [isRunning, setIsRunning] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0); // Increment to trigger reset
  
  // UI State (Updated less frequently)
  const [stats, setStats] = useState({ x: 8, z: 8, iter: 0 });

  const handleReset = () => {
    setIsRunning(false);
    setResetTrigger(prev => prev + 1);
  };

  const currentError = calculateHeight(stats.x, stats.z);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[800px] lg:h-[600px]">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-slate-100">Controles</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tasa de Aprendizaje (α): <span className="text-orange-400 font-bold">{learningRate}</span>
            </label>
            <input
              type="range"
              min="0.01"
              max="1.2"
              step="0.01"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
             <p className="text-xs text-slate-400 mt-2">
              Valores altos pueden causar oscilación o divergencia. Valores bajos son lentos.
            </p>
          </div>

          <div className="flex space-x-3 mb-6">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 py-2 px-4 rounded-md font-bold text-white transition ${
                isRunning 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isRunning ? 'Pausar' : 'Iniciar Descenso'}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-2 px-4 rounded-md font-bold text-slate-200 bg-slate-600 hover:bg-slate-500 transition"
            >
              Reiniciar
            </button>
          </div>
          
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Estado Actual</h4>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-400">Iteración:</span>
                    <span className="text-white font-mono">{stats.iter}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Error (Costo):</span>
                    <span className="text-orange-400 font-mono font-bold">{currentError.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Posición X:</span>
                    <span className="text-slate-200 font-mono">{stats.x.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Posición Z:</span>
                    <span className="text-slate-200 font-mono">{stats.z.toFixed(4)}</span>
                </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                <InfoIcon className="w-5 h-5 mr-2 text-blue-400"/> ¿Qué está pasando?
            </h3>
            <p className="text-sm text-slate-300 mb-2">
                El <strong>Descenso de Gradiente</strong> es un algoritmo de optimización utilizado para entrenar modelos de Machine Learning.
            </p>
            <p className="text-sm text-slate-300">
                La bola naranja representa los parámetros del modelo. El objetivo es llegar al fondo del "valle" (el centro azul), donde el error es mínimo, dando pasos proporcionales al negativo del gradiente (la pendiente) en ese punto.
            </p>
        </div>
      </div>

      <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden relative shadow-2xl">
        <Canvas>
            <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={50} />
            <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2 - 0.1} minDistance={5} maxDistance={40} />
            
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            
            <GridSurface />
            <SimulationController 
                isRunning={isRunning} 
                learningRate={learningRate} 
                onUpdateStats={(pos, iter) => setStats({ ...pos, iter })}
                resetTrigger={resetTrigger}
            />

            <Text position={[0, -2, 8]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
                Minimo Global (Error ≈ 0)
            </Text>
             
             <gridHelper args={[20, 20, 0x475569, 0x1e293b]} position={[0, -0.1, 0]} />
             <axesHelper args={[2]} position={[-10, 0, -10]} />
        </Canvas>
        <div className="absolute top-4 right-4 pointer-events-none bg-black/50 p-2 rounded text-xs text-white">
            Click y arrastra para rotar la vista 3D
        </div>
      </div>
    </div>
  );
};