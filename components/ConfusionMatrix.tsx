import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Scatter, ZAxis } from 'recharts';
import { calculateClassificationMetrics } from '../utils/dataUtils';
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
    const [actualPositives, setActualPositives] = useState(500);
    const [sensitivity, setSensitivity] = useState(0.90); // Recall / TPR
    const [specificity, setSpecificity] = useState(0.95); // TNR

    const data = useMemo(() => {
        const actualNegatives = TOTAL_INSTANCES - actualPositives;

        const tp = Math.round(actualPositives * sensitivity);
        const fn = actualPositives - tp;

        const tn = Math.round(actualNegatives * specificity);
        const fp = actualNegatives - tn;

        const metrics = calculateClassificationMetrics(tp, fp, fn, tn);
        
        const predictedPositives = tp + fp;
        const predictedNegatives = tn + fn;

        return { tp, fn, tn, fp, metrics, predictedPositives, predictedNegatives, actualNegatives };
    }, [actualPositives, sensitivity, specificity]);

    const rocData = useMemo(() => {
        const fpr = 1 - data.metrics.specificity;
        const tpr = data.metrics.recall;
        return [{ x: fpr, y: tpr }];
    }, [data]);

    const estimatedAUC = useMemo(() => {
        // A common simple estimation for AUC from a single point
        return (data.metrics.recall + data.metrics.specificity) / 2;
    }, [data.metrics.recall, data.metrics.specificity]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* --- CONTROLS --- */}
            <div className="lg:col-span-1 xl:col-span-1 bg-slate-800/50 p-4 lg:p-6 rounded-lg shadow-lg flex flex-col space-y-8 backdrop-blur-sm">
                <div>
                    <label htmlFor="prevalence" className="block text-sm font-medium text-sky-300 mb-2">Prevalencia (Positivos Reales)</label>
                    <div className="flex items-center space-x-4">
                        <input id="prevalence" type="range" min="1" max={TOTAL_INSTANCES - 1} value={actualPositives} onChange={(e) => setActualPositives(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-mono text-sky-400 w-20 text-center bg-slate-700 py-1 rounded-md">{actualPositives}</span>
                    </div>
                </div>
                <div>
                    <label htmlFor="sensitivity" className="flex items-center space-x-2 text-sm font-medium text-sky-300 mb-2">
                         <span>Sensibilidad (Recall)</span>
                         <div className="group relative"><InfoIcon className="h-4 w-4 text-slate-400" /><div className="absolute bottom-full mb-2 w-64 p-2 bg-slate-900 text-slate-300 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">Proporción de positivos reales que son correctamente identificados (TP / (TP + FN)).</div></div>
                    </label>
                    <div className="flex items-center space-x-4">
                        <input id="sensitivity" type="range" min="0" max="1" step="0.01" value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-mono text-sky-400 w-20 text-center bg-slate-700 py-1 rounded-md">{(sensitivity * 100).toFixed(0)}%</span>
                    </div>
                </div>
                <div>
                    <label htmlFor="specificity" className="flex items-center space-x-2 text-sm font-medium text-sky-300 mb-2">
                        <span>Especificidad</span>
                        <div className="group relative"><InfoIcon className="h-4 w-4 text-slate-400" /><div className="absolute bottom-full mb-2 w-64 p-2 bg-slate-900 text-slate-300 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">Proporción de negativos reales que son correctamente identificados (TN / (TN + FP)).</div></div>
                    </label>
                    <div className="flex items-center space-x-4">
                        <input id="specificity" type="range" min="0" max="1" step="0.01" value={specificity} onChange={(e) => setSpecificity(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-mono text-sky-400 w-20 text-center bg-slate-700 py-1 rounded-md">{(specificity * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            {/* --- RESULTS --- */}
            <div className="lg:col-span-2 xl:col-span-3 grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* --- CONFUSION MATRIX & METRICS --- */}
                <div className="flex flex-col gap-6">
                    {/* Matrix */}
                    <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-sky-300 mb-4 text-center">Matriz de Confusión</h3>
                        <div className="grid grid-cols-3 gap-1 text-center text-sm">
                            <div></div>
                            <div className="font-bold text-slate-400 p-2">Predicho Positivo</div>
                            <div className="font-bold text-slate-400 p-2">Predicho Negativo</div>

                            <div className="font-bold text-slate-400 p-2 transform -rotate-90 my-auto">Real Positivo</div>
                            <div className="bg-emerald-500/30 p-4 rounded"><span className="block text-xs text-emerald-300">Verdadero Positivo</span><span className="text-2xl font-bold">{data.tp}</span></div>
                            <div className="bg-red-500/30 p-4 rounded"><span className="block text-xs text-red-300">Falso Negativo</span><span className="text-2xl font-bold">{data.fn}</span></div>

                            <div className="font-bold text-slate-400 p-2 transform -rotate-90 my-auto">Real Negativo</div>
                            <div className="bg-red-500/30 p-4 rounded"><span className="block text-xs text-red-300">Falso Positivo</span><span className="text-2xl font-bold">{data.fp}</span></div>
                            <div className="bg-emerald-500/30 p-4 rounded"><span className="block text-xs text-emerald-300">Verdadero Negativo</span><span className="text-2xl font-bold">{data.tn}</span></div>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-sky-300 mb-4 text-center">Métricas de Clasificación</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <MetricDisplay label="Exactitud" value={`${(data.metrics.accuracy * 100).toFixed(1)}%`} tooltip="Porcentaje de predicciones correctas del total ((TP+TN)/Total)." />
                            <MetricDisplay label="Precisión" value={`${(data.metrics.precision * 100).toFixed(1)}%`} tooltip="De todas las predicciones positivas, cuántas fueron correctas (TP/(TP+FP))." />
                            <MetricDisplay label="Recall" value={`${(data.metrics.recall * 100).toFixed(1)}%`} tooltip="De todos los positivos reales, cuántos fueron identificados (TP/(TP+FN)). También llamado Sensibilidad." />
                            <MetricDisplay label="Especificidad" value={`${(data.metrics.specificity * 100).toFixed(1)}%`} tooltip="De todos los negativos reales, cuántos fueron identificados (TN/(TN+FP))." />
                            <MetricDisplay label="F1-Score" value={data.metrics.f1Score.toFixed(3)} tooltip="Media armónica de Precisión y Recall. Buen indicador del balance entre ambos." />
                            <MetricDisplay label="MCC" value={data.metrics.mcc.toFixed(3)} tooltip="Coef. de Correlación de Matthews. Métrica robusta que considera las 4 celdas de la matriz (-1 a +1)." />
                        </div>
                    </div>
                </div>

                {/* --- ROC AUC CHART --- */}
                <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg backdrop-blur-sm flex flex-col">
                    <h3 className="text-lg font-bold text-sky-300 mb-2">Gráfico ROC y AUC</h3>
                    <p className="text-center text-sm text-slate-400 mb-2">AUC (Estimado): <span className="font-bold text-lg text-amber-400">{estimatedAUC.toFixed(3)}</span></p>
                    <div className="flex-grow min-h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                <XAxis 
                                    type="number" 
                                    dataKey="x" 
                                    name="1 - Especificidad (FPR)" 
                                    domain={[0, 1]} 
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    label={{ value: "1 - Especificidad (FPR)", position: 'insideBottom', offset: -10, fill: '#cbd5e1' }}
                                />
                                <YAxis 
                                    type="number" 
                                    dataKey="y" 
                                    name="Sensibilidad (TPR)" 
                                    domain={[0, 1]} 
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    label={{ value: 'Sensibilidad (TPR)', angle: -90, position: 'insideLeft', fill: '#cbd5e1', style: {textAnchor: 'middle'} }}
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#38bdf8' }}
                                    formatter={(value: number) => value.toFixed(3)}
                                />
                                <Line type="monotone" dataKey="y" data={[{x:0, y:0}, {x:1, y:1}]} stroke="#f87171" strokeWidth={2} dot={false} name="Clasificador Aleatorio" />
                                <Scatter dataKey="y" data={rocData} fill="#38bdf8" name="Punto Actual" />
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
