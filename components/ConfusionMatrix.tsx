import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Scatter, ZAxis } from 'recharts';
import { calculateClassificationMetrics, generateNormalData, calculateAuc } from '../utils/dataUtils';
import { InfoIcon } from './Icons';

const TOTAL_INSTANCES = 1000;

interface MetricDisplayProps {
    label: string;
    value: string;
    tooltip: string;
}

const MetricDisplay: React.FC<MetricDisplayProps> = ({ label, value, tooltip }) => (
    <div className="bg-slate-800/50 p-3 rounded-lg text-center relative group">
        <span className="text-sm text-slate-400 block">{label}</span>
        <span className="text-lg font-bold text-sky-400">{value}</span>
        <div className="absolute bottom-full mb-2 w-56 p-2 bg-slate-900 text-slate-300 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            {tooltip}
        </div>
    </div>
);


const ConfusionMatrix: React.FC = () => {
    const [actualPositives, setActualPositives] = useState(200);
    const [threshold, setThreshold] = useState(0.5);
    const [simulatedScores, setSimulatedScores] = useState<{ score: number, isPositive: boolean }[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const negativeScores = generateNormalData(TOTAL_INSTANCES - actualPositives, 0.4, 0.15)
            .map(score => ({ score: Math.max(0, Math.min(1, score)), isPositive: false }));
        const positiveScores = generateNormalData(actualPositives, 0.6, 0.15)
            .map(score => ({ score: Math.max(0, Math.min(1, score)), isPositive: true }));
        setSimulatedScores([...negativeScores, ...positiveScores]);
    }, [actualPositives]);

    const confusionMatrixData = useMemo(() => {
        let tp = 0, fp = 0, fn = 0, tn = 0;
        for (const item of simulatedScores) {
            const predictedPositive = item.score >= threshold;
            if (item.isPositive) {
                if (predictedPositive) tp++;
                else fn++;
            } else {
                if (predictedPositive) fp++;
                else tn++;
            }
        }
        const metrics = calculateClassificationMetrics(tp, fp, fn, tn);
        return { tp, fp, fn, tn, metrics };
    }, [simulatedScores, threshold]);

    const rocCurveData = useMemo(() => {
        if (simulatedScores.length === 0) return [];
        const points = [];
        const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
        const positives = simulatedScores.filter(s => s.isPositive).length;
        const negatives = simulatedScores.length - positives;
        if (positives === 0 || negatives === 0) return [{x:0, y:0}, {x:1, y:1}];

        for (const t of thresholds) {
            let tp = 0, fp = 0;
            for (const item of simulatedScores) {
                if (item.score >= t) {
                    if (item.isPositive) tp++;
                    else fp++;
                }
            }
            points.push({ x: fp / negatives, y: tp / positives }); // x: FPR, y: TPR
        }
        return points.sort((a,b) => a.x - b.x);
    }, [simulatedScores]);

    const auc = useMemo(() => calculateAuc(rocCurveData), [rocCurveData]);
    
    const stopAnimation = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        setIsAnimating(false);
    }, []);

    const runAnimation = useCallback(() => {
        let start: number | null = null;
        const duration = 3000;
        const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percentage = Math.min(progress / duration, 1);
            setThreshold(percentage);
            if (progress < duration) {
                animationFrameId.current = requestAnimationFrame(step);
            } else {
                stopAnimation();
            }
        };
        animationFrameId.current = requestAnimationFrame(step);
    }, [stopAnimation]);
    
    const handleAnimateClick = () => {
        if (isAnimating) {
            stopAnimation();
        } else {
            setIsAnimating(true);
            runAnimation();
        }
    };
    
    useEffect(() => {
        return () => stopAnimation();
    }, [stopAnimation]);
    
    const currentRocPoint = [{ x: 1 - confusionMatrixData.metrics.specificity, y: confusionMatrixData.metrics.recall }];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="lg:col-span-1 xl:col-span-1 bg-slate-800/50 p-4 lg:p-6 rounded-lg shadow-lg flex flex-col space-y-8 backdrop-blur-sm">
                <div>
                    <label htmlFor="prevalence" className="block text-sm font-medium text-sky-300 mb-2">Prevalencia (Positivos Reales)</label>
                    <div className="flex items-center space-x-4">
                        <input id="prevalence" type="range" min="1" max={TOTAL_INSTANCES - 1} value={actualPositives} onChange={(e) => setActualPositives(Number(e.target.value))} disabled={isAnimating} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
                        <span className="font-mono text-sky-400 w-20 text-center bg-slate-700 py-1 rounded-md">{actualPositives}</span>
                    </div>
                </div>
                <div>
                    <label htmlFor="threshold" className="flex items-center space-x-2 text-sm font-medium text-sky-300 mb-2">
                         <span>Umbral de Clasificación</span>
                         <div className="group relative"><InfoIcon className="h-4 w-4 text-slate-400" /><div className="absolute bottom-full mb-2 w-64 p-2 bg-slate-900 text-slate-300 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">Un modelo predice 'Positivo' si la probabilidad es &gt;= a este valor. Moverlo cambia el balance entre sensibilidad y especificidad.</div></div>
                    </label>
                    <div className="flex items-center space-x-4">
                        <input id="threshold" type="range" min="0" max="1" step="0.01" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} disabled={isAnimating} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
                        <span className="font-mono text-sky-400 w-20 text-center bg-slate-700 py-1 rounded-md">{threshold.toFixed(2)}</span>
                    </div>
                </div>
                <div>
                    <button onClick={handleAnimateClick} className="w-full bg-indigo-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-indigo-500 transition duration-200 disabled:bg-indigo-500 disabled:opacity-50">
                        {isAnimating ? 'Detener Animación' : 'Animar Umbral'}
                    </button>
                </div>
            </div>

            <div className="lg:col-span-2 xl:col-span-3 grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="flex flex-col gap-6">
                    <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-sky-300 mb-4 text-center">Matriz de Confusión</h3>
                        <div className="grid grid-cols-[auto_1fr_1fr] grid-rows-[auto_1fr_1fr] gap-2 text-center text-sm">
                            <div />
                            <div className="font-bold text-slate-400 p-2">Predicho Positivo</div>
                            <div className="font-bold text-slate-400 p-2">Predicho Negativo</div>

                            <div className="font-bold text-slate-400 p-2 flex items-center justify-center">Real Positivo</div>
                            <div className="bg-emerald-500/30 p-4 rounded"><span className="block text-xs text-emerald-300">Verdadero Positivo</span><span className="text-2xl font-bold">{confusionMatrixData.tp}</span></div>
                            <div className="bg-red-500/30 p-4 rounded"><span className="block text-xs text-red-300">Falso Negativo</span><span className="text-2xl font-bold">{confusionMatrixData.fn}</span></div>
                            
                            <div className="font-bold text-slate-400 p-2 flex items-center justify-center">Real Negativo</div>
                            <div className="bg-red-500/30 p-4 rounded"><span className="block text-xs text-red-300">Falso Positivo</span><span className="text-2xl font-bold">{confusionMatrixData.fp}</span></div>
                            <div className="bg-emerald-500/30 p-4 rounded"><span className="block text-xs text-emerald-300">Verdadero Negativo</span><span className="text-2xl font-bold">{confusionMatrixData.tn}</span></div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-sky-300 mb-4 text-center">Métricas de Clasificación</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <MetricDisplay label="Exactitud" value={`${(confusionMatrixData.metrics.accuracy * 100).toFixed(1)}%`} tooltip="Porcentaje de predicciones correctas del total ((TP+TN)/Total)." />
                            <MetricDisplay label="Precisión" value={`${(confusionMatrixData.metrics.precision * 100).toFixed(1)}%`} tooltip="De todas las predicciones positivas, cuántas fueron correctas (TP/(TP+FP))." />
                            <MetricDisplay label="Sensibilidad (Recall)" value={`${(confusionMatrixData.metrics.recall * 100).toFixed(1)}%`} tooltip="De todos los positivos reales, cuántos fueron identificados (TP/(TP+FN))." />
                            <MetricDisplay label="Especificidad" value={`${(confusionMatrixData.metrics.specificity * 100).toFixed(1)}%`} tooltip="De todos los negativos reales, cuántos fueron identificados (TN/(TN+FP))." />
                            <MetricDisplay label="F1-Score" value={confusionMatrixData.metrics.f1Score.toFixed(3)} tooltip="Media armónica de Precisión y Recall. Buen indicador del balance entre ambos." />
                            <MetricDisplay label="MCC" value={confusionMatrixData.metrics.mcc.toFixed(3)} tooltip="Coef. de Correlación de Matthews. Métrica robusta que considera las 4 celdas de la matriz (-1 a +1)." />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm flex flex-col">
                    <h3 className="text-lg font-bold text-sky-300 mb-2">Curva ROC y AUC</h3>
                    <p className="text-center text-sm text-slate-400 mb-2">Área Bajo la Curva (AUC): <span className="font-bold text-lg text-amber-400">{auc.toFixed(3)}</span></p>
                    <div className="flex-grow min-h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                <XAxis 
                                    type="number" 
                                    dataKey="x" 
                                    name="Tasa de Falsos Positivos (FPR)" 
                                    domain={[0, 1]} 
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    label={{ value: "Tasa de Falsos Positivos (FPR)", position: 'insideBottom', offset: -10, fill: '#cbd5e1' }}
                                />
                                <YAxis 
                                    type="number" 
                                    dataKey="y" 
                                    name="Tasa de Verdaderos Positivos (TPR)" 
                                    domain={[0, 1]} 
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    label={{ value: 'Tasa de Verdaderos Positivos (TPR)', angle: -90, position: 'insideLeft', fill: '#cbd5e1', style: {textAnchor: 'middle'} }}
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#38bdf8' }}
                                    formatter={(value: number) => value.toFixed(3)}
                                />
                                <Line type="monotone" data={[{x:0, y:0}, {x:1, y:1}]} dataKey="y" stroke="#f87171" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Clasificador Aleatorio" />
                                <Line type="monotone" data={rocCurveData} dataKey="y" stroke="#a78bfa" strokeWidth={2} dot={false} name="Curva ROC" />
                                <Scatter data={currentRocPoint} dataKey="y" fill="#38bdf8" name="Umbral Actual" />
                                <ZAxis dataKey="z" range={[100, 101]}/>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfusionMatrix;