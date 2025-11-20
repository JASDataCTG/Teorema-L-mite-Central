import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { InfoIcon } from './Icons';

interface DataPoint {
  x: number;
  y: number; // 0 or 1
  id: number;
}

// Sigmoid Function
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

const generateData = (count: number): DataPoint[] => {
  const data: DataPoint[] = [];
  for (let i = 0; i < count; i++) {
    // Generate two clusters
    const isClass1 = Math.random() > 0.5;
    // Class 0 centered at -2, Class 1 centered at 2, with some noise
    const center = isClass1 ? 2.5 : -2.5;
    const noise = (Math.random() - 0.5) * 4; // Random spread
    const x = center + noise;
    data.push({
      id: i,
      x: parseFloat(x.toFixed(2)),
      y: isClass1 ? 1 : 0,
    });
  }
  return data;
};

export const LogisticRegressionSimulator: React.FC = () => {
  // Model Parameters
  const [weight, setWeight] = useState(0.5);
  const [bias, setBias] = useState(0);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const trainingRef = useRef<number | null>(null);

  // Initialize Data
  useEffect(() => {
    setDataPoints(generateData(40));
  }, []);

  // Calculate Curve Points for Visualization
  const curveData = useMemo(() => {
    const points = [];
    // Generate points from -8 to 8 for the smooth line
    for (let x = -8; x <= 8; x += 0.5) {
      const z = weight * x + bias;
      const prob = sigmoid(z);
      points.push({ x, prob });
    }
    return points;
  }, [weight, bias]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    let logLoss = 0;
    let correct = 0;
    const epsilon = 1e-15; // Prevent log(0)

    dataPoints.forEach(p => {
      const z = weight * p.x + bias;
      const pred = sigmoid(z);
      const safePred = Math.max(epsilon, Math.min(1 - epsilon, pred));
      
      // Log Loss
      logLoss += - (p.y * Math.log(safePred) + (1 - p.y) * Math.log(1 - safePred));

      // Accuracy (Threshold 0.5)
      const classification = pred >= 0.5 ? 1 : 0;
      if (classification === p.y) correct++;
    });

    return {
      cost: dataPoints.length > 0 ? logLoss / dataPoints.length : 0,
      accuracy: dataPoints.length > 0 ? (correct / dataPoints.length) * 100 : 0
    };
  }, [dataPoints, weight, bias]);

  // Gradient Descent Step
  const trainStep = () => {
    const learningRate = 0.1;
    let dw = 0;
    let db = 0;
    const m = dataPoints.length;

    dataPoints.forEach(p => {
        const z = weight * p.x + bias;
        const pred = sigmoid(z);
        const error = pred - p.y;
        
        dw += error * p.x;
        db += error;
    });

    dw /= m;
    db /= m;

    setWeight(w => w - learningRate * dw);
    setBias(b => b - learningRate * db);
  };

  // Animation Loop
  useEffect(() => {
    if (isTraining) {
        trainingRef.current = window.setInterval(trainStep, 50);
    } else if (trainingRef.current) {
        clearInterval(trainingRef.current);
    }
    return () => {
        if (trainingRef.current) clearInterval(trainingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTraining, weight, bias, dataPoints]); // Dependency on weight/bias is technical needed for closure but handled by setState functional update


  const handleGenerateData = () => {
    setIsTraining(false);
    setDataPoints(generateData(40));
    setWeight(0); // Reset params slightly
    setBias(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Controls */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Parámetros del Modelo</h2>
          
          {/* Math Display */}
          <div className="bg-slate-900 p-4 rounded-md mb-6 border border-slate-700 font-mono text-sm text-center">
            <div className="text-slate-400 mb-2">Función Sigmoide</div>
            <div className="text-orange-400 text-lg">
                P(y=1) = 1 / (1 + e<sup>-z</sup>)
            </div>
            <div className="text-teal-400 mt-2">
                z = <span className="font-bold">{weight.toFixed(2)}</span>x + <span className="font-bold">{bias.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                <span>Peso (Weight, w)</span>
                <span className="text-orange-400">{weight.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="-5" max="5" step="0.1"
                value={weight}
                onChange={(e) => { setIsTraining(false); setWeight(parseFloat(e.target.value)); }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                <span>Sesgo (Bias, b)</span>
                <span className="text-orange-400">{bias.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="-5" max="5" step="0.1"
                value={bias}
                onChange={(e) => { setIsTraining(false); setBias(parseFloat(e.target.value)); }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-8">
            <button
                onClick={() => setIsTraining(!isTraining)}
                className={`flex-1 py-2.5 px-4 rounded-md font-bold text-white transition ${
                    isTraining ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
            >
                {isTraining ? 'Detener' : 'Auto-Ajustar (Entrenar)'}
            </button>
            <button
                onClick={handleGenerateData}
                className="flex-1 py-2.5 px-4 rounded-md font-bold text-slate-200 bg-slate-600 hover:bg-slate-500 transition"
            >
                Nuevos Datos
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Métricas de Rendimiento</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                    <div className="text-slate-400 text-sm mb-1">Log Loss (Costo)</div>
                    <div className={`text-2xl font-bold ${metrics.cost < 0.3 ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {metrics.cost.toFixed(4)}
                    </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                    <div className="text-slate-400 text-sm mb-1">Exactitud</div>
                    <div className={`text-2xl font-bold ${metrics.accuracy > 90 ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {metrics.accuracy.toFixed(1)}%
                    </div>
                </div>
            </div>
             <p className="text-xs text-slate-400 mt-4">
                <strong>Log Loss:</strong> Mide qué tan lejos está la probabilidad predicha del valor real (0 o 1). Queremos que sea cercano a 0.
            </p>
        </div>
      </div>

      {/* Visualization */}
      <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-semibold text-slate-100">Visualización Clasificación Binaria</h3>
             <div className="flex items-center text-sm text-slate-400">
                 <div className="flex items-center mr-4">
                     <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Clase 0
                 </div>
                 <div className="flex items-center mr-4">
                     <span className="w-3 h-3 rounded-full bg-teal-400 mr-2"></span> Clase 1
                 </div>
                 <div className="flex items-center">
                     <span className="w-4 h-0.5 bg-orange-500 mr-2"></span> Modelo
                 </div>
             </div>
        </div>
        
        <div className="flex-grow min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                        type="number" 
                        dataKey="x" 
                        domain={[-8, 8]} 
                        allowDataOverflow={false}
                        tick={{ fill: '#94a3b8' }}
                        label={{ value: 'Variable Independiente (Característica X)', position: 'bottom', offset: 0, fill: '#94a3b8' }}
                    />
                    <YAxis 
                        type="number" 
                        domain={[-0.1, 1.1]} 
                        ticks={[0, 0.5, 1]}
                        tick={{ fill: '#94a3b8' }}
                        label={{ value: 'Probabilidad P(Y=1)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                    />
                    <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                        labelFormatter={() => ''}
                        formatter={(value: number, name: string) => {
                            if (name === 'Probabilidad') return [value.toFixed(3), name];
                            return [value, name === 'Clase 1' || name === 'Clase 0' ? 'Y (Real)' : name];
                        }}
                    />
                    <ReferenceLine y={0.5} stroke="#64748b" strokeDasharray="5 5" label={{ value: 'Umbral Decisión', position: 'insideRight', fill: '#64748b', fontSize: 12 }} />
                    
                    {/* Class 0 Points */}
                    <Scatter 
                        name="Clase 0" 
                        data={dataPoints.filter(d => d.y === 0)} 
                        fill="#ef4444" 
                        shape="circle"
                    />
                     {/* Class 1 Points */}
                    <Scatter 
                        name="Clase 1" 
                        data={dataPoints.filter(d => d.y === 1)} 
                        fill="#2dd4bf" 
                        shape="circle"
                    />

                    {/* Sigmoid Curve */}
                    <Line 
                        data={curveData} 
                        type="monotone" 
                        dataKey="prob" 
                        stroke="#f97316" 
                        strokeWidth={3} 
                        dot={false} 
                        name="Probabilidad"
                        activeDot={false}
                        isAnimationActive={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
        
        <div className="mt-4 bg-slate-700/30 p-4 rounded border border-slate-700 text-sm text-slate-300">
            <div className="flex items-start gap-3">
                <InfoIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="mb-2">
                        <strong>Interpretación:</strong> La Regresión Logística busca la curva "S" que mejor separe los puntos rojos (0) de los verdes (1).
                    </p>
                    <ul className="list-disc ml-4 space-y-1 text-slate-400">
                        <li>Si <strong>Probabilidad &gt; 0.5</strong> (encima de la línea punteada), el modelo predice Clase 1.</li>
                        <li>El <strong>Peso (w)</strong> controla qué tan empinada es la curva (qué tan rápido cambia la decisión).</li>
                        <li>El <strong>Sesgo (b)</strong> mueve la curva a la izquierda o derecha.</li>
                    </ul>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};