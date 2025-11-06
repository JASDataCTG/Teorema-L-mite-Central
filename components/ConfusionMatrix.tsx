import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateClassificationMetrics, generateNormalData, calculateAuc } from '../utils/dataUtils';
import { InfoIcon } from './Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, Dot } from 'recharts';

const TOTAL_INSTANCES = 1000;

type Scenario = {
  id: string;
  name: string;
  params: {
    prevalence: number;
    posMean: number;
    posStdDev: number;
    negMean: number;
    negStdDev: number;
  };
  description: string;
};

const scenarios: Scenario[] = [
  {
    id: 'cancer',
    name: 'Diagnóstico de Cáncer (Prueba Preliminar)',
    params: { prevalence: 0.05, posMean: 0.80, posStdDev: 0.15, negMean: 0.20, negStdDev: 0.18, },
    description: 'Un modelo de IA analiza imágenes médicas para una detección temprana de cáncer. Un "positivo" significa que el modelo cree que hay cáncer. Es crucial no pasar por alto casos reales (alta sensibilidad), incluso si eso significa tener algunos falsos positivos que luego serán descartados por un especialista.',
  },
  {
    id: 'fraud',
    name: 'Detección de Fraude con Tarjetas',
    params: { prevalence: 0.01, posMean: 0.90, posStdDev: 0.12, negMean: 0.10, negStdDev: 0.10, },
    description: 'Un sistema monitorea transacciones en tiempo real para identificar posibles fraudes. Un "positivo" es una transacción marcada como fraudulenta. Una alta precisión es vital para no molestar a los clientes bloqueando transacciones legítimas. Un falso positivo significa bloquear la tarjeta de un cliente inocente.',
  },
  {
    id: 'spam',
    name: 'Filtro de Correo no Deseado (Spam)',
    params: { prevalence: 0.30, posMean: 0.85, posStdDev: 0.10, negMean: 0.15, negStdDev: 0.15,},
    description: 'Un algoritmo clasifica los correos entrantes como "Spam" (positivo) o "No Spam" (negativo). Es muy importante no clasificar un correo importante como spam (evitar falsos positivos). Por lo tanto, se prioriza una alta precisión, a veces a costa de dejar pasar algo de spam a la bandeja de entrada (menor sensibilidad).',
  },
];

const generateStaticExplanation = (
    scenario: Scenario,
    metrics: any,
    auc: number,
    { tp, fp, fn, tn }: { tp: number, fp: number, fn: number, tn: number }
): string => {
    const formatPercent = (val: number) => (val * 100).toFixed(1);

    const createCodeBlock = (title: string, formula: string, calculation: string, result: string) => {
        return `
            <details class="code-details">
                <summary class="code-summary">${title}</summary>
                <pre class="code-block"><code><span class="code-comment"># Fórmula</span>
<span class="code-keyword">${title}</span> = ${formula}

<span class="code-comment"># Cálculo con valores actuales</span>
<span class="code-keyword">${title}</span> = ${calculation}
<span class="code-keyword">${title}</span> = <span class="code-number">${result}</span></code></pre>
            </details>
        `;
    };

    const total = tp + fp + fn + tn;
    const codeExamples = `
        <h4 style="font-weight: bold; font-size: 1.1em; margin-top: 1.5em; margin-bottom: 0.75em; border-top: 1px solid #475569; padding-top: 1em;">Ejemplos de Cálculo de Métricas</h4>
        <style>
            .code-details { background-color: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; margin-bottom: 0.5rem; overflow: hidden; }
            .code-summary { cursor: pointer; padding: 0.5rem 1rem; font-weight: bold; color: #cbd5e1; list-style-position: inside; }
            .code-summary:focus { outline: none; box-shadow: inset 0 0 0 2px #f97316; }
            .code-block { background-color: #0f172a; padding: 1rem; margin: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 0.875em; color: #e2e8f0; }
            .code-keyword { color: #f97316; }
            .code-number { color: #34d399; }
            .code-comment { color: #64748b; }
        </style>
        ${createCodeBlock(
            'Exactitud (Accuracy)',
            '(VP + VN) / Total',
            `(${tp} + ${tn}) / ${total}`,
            metrics.accuracy.toFixed(4)
        )}
        ${createCodeBlock(
            'Precisión (Precision)',
            'VP / (VP + FP)',
            `${tp} / (${tp} + ${fp})`,
            metrics.precision.toFixed(4)
        )}
        ${createCodeBlock(
            'Sensibilidad (Recall)',
            'VP / (VP + FN)',
            `${tp} / (${tp} + ${fn})`,
            metrics.recall.toFixed(4)
        )}
        ${createCodeBlock(
            'Especificidad (Specificity)',
            'VN / (VN + FP)',
            `${tn} / (${tn} + ${fp})`,
            metrics.specificity.toFixed(4)
        )}
        ${createCodeBlock(
            'Puntuación F1 (F1-Score)',
            '2 * (Precisión * Sensibilidad) / (Precisión + Sensibilidad)',
            `2 * (${metrics.precision.toFixed(3)} * ${metrics.recall.toFixed(3)}) / (${metrics.precision.toFixed(3)} + ${metrics.recall.toFixed(3)})`,
            metrics.f1Score.toFixed(4)
        )}
    `;

    const commonPart = `
        <p>La <strong>Puntuación F1 (${metrics.f1Score.toFixed(3)})</strong> y el <strong>AUC (${auc.toFixed(4)})</strong> son métricas generales que evalúan el rendimiento global del modelo. Un AUC cercano a 1.0 indica una excelente capacidad para distinguir entre clases.</p>
        <p>Ajustar el <strong>umbral de clasificación</strong> permite encontrar el equilibrio deseado entre las diferentes métricas para optimizar el modelo según las necesidades específicas del problema.</p>
        ${codeExamples}
    `;

    switch(scenario.id) {
        case 'cancer':
            return `
                <h4 style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.5em;">Análisis del Modelo de Diagnóstico de Cáncer</h4>
                <p>En este escenario, el objetivo principal es <strong>no pasar por alto ningún caso real de cáncer</strong>. Por lo tanto, se prioriza una alta <strong>Sensibilidad (Recall)</strong>.</p>
                <ul style="list-style-type: disc; margin-left: 20px; margin-top: 1em; margin-bottom: 1em;">
                    <li><strong>Sensibilidad actual (${metrics.recall.toFixed(3)})</strong>: El modelo identifica correctamente al <strong>${formatPercent(metrics.recall)}%</strong> de los tumores malignos reales. ${metrics.recall > 0.9 ? 'Esto es excelente, minimizando los casos no detectados.' : 'Un valor más bajo aquí es riesgoso, ya que implica que casos reales no son detectados.'}</li>
                    <li><strong>Precisión actual (${metrics.precision.toFixed(3)})</strong>: De todas las alertas positivas generadas, el <strong>${formatPercent(metrics.precision)}%</strong> son realmente cáncer. ${metrics.precision < 0.5 ? 'Una precisión baja significa más "falsas alarmas", pero es un compromiso a menudo aceptable para maximizar la detección.' : 'Un buen valor que reduce la cantidad de estudios adicionales para pacientes sanos.'}</li>
                </ul>
                ${commonPart}
            `;
        case 'fraud':
            return `
                <h4 style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.5em;">Análisis del Modelo de Detección de Fraude</h4>
                <p>Aquí, es crucial <strong>no molestar a los clientes bloqueando transacciones legítimas</strong>. Por lo tanto, se prioriza una alta <strong>Precisión</strong>.</p>
                <ul style="list-style-type: disc; margin-left: 20px; margin-top: 1em; margin-bottom: 1em;">
                    <li><strong>Precisión actual (${metrics.precision.toFixed(3)})</strong>: De todas las transacciones marcadas como fraudulentas, el <strong>${formatPercent(metrics.precision)}%</strong> lo son realmente. ${metrics.precision > 0.9 ? 'Un valor alto es ideal, ya que asegura que la mayoría de las alertas son correctas y se minimizan las molestias a los clientes.' : 'Una precisión más baja podría causar una mala experiencia al cliente al bloquear compras válidas.'}</li>
                    <li><strong>Sensibilidad actual (${metrics.recall.toFixed(3)})</strong>: El modelo detecta el <strong>${formatPercent(metrics.recall)}%</strong> de todas las transacciones fraudulentas reales. Es el equilibrio: un recall muy alto podría lograrse a costa de una menor precisión, marcando muchas transacciones legítimas como sospechosas.</li>
                </ul>
                ${commonPart}
            `;
        case 'spam':
            return `
                <h4 style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.5em;">Análisis del Filtro de Correo no Deseado</h4>
                <p>El objetivo principal es <strong>evitar que correos importantes sean clasificados como spam</strong> (falsos positivos). Por lo tanto, se busca una alta <strong>Precisión</strong>.</p>
                <ul style="list-style-type: disc; margin-left: 20px; margin-top: 1em; margin-bottom: 1em;">
                    <li><strong>Precisión actual (${metrics.precision.toFixed(3)})</strong>: De todos los correos que el filtro envía a la carpeta de spam, el <strong>${formatPercent(metrics.precision)}%</strong> son realmente spam. ${metrics.precision > 0.9 ? 'Un valor alto es fundamental para garantizar que los usuarios no pierdan correos importantes.' : 'Una precisión baja significaría que muchos correos legítimos van a spam, lo cual es muy problemático.'}</li>
                    <li><strong>Sensibilidad actual (${metrics.recall.toFixed(3)})</strong>: El filtro captura el <strong>${formatPercent(metrics.recall)}%</strong> de todo el spam recibido. ${metrics.recall < 0.9 ? 'Una sensibilidad menor es aceptable si a cambio se obtiene una precisión muy alta. Es preferible que algún correo de spam llegue a la bandeja de entrada a que uno importante se pierda.' : 'Un buen valor que mantiene la bandeja de entrada limpia.'}</li>
                </ul>
                ${commonPart}
            `;
        default:
            return '<p>Selecciona un escenario para ver un análisis detallado.</p>';
    }
};

// Custom Dot for the active point on ROC curve
const ActiveDot = (props: any) => {
    const { cx, cy, stroke, payload, value } = props;
    if (payload.isActive) {
        return <Dot cx={cx} cy={cy} r={5} fill={stroke} stroke="#fff" strokeWidth={2} />;
    }
    return null;
};

const MetricDisplay: React.FC<{ label: string; value: number | string; tooltip: string }> = ({ label, value, tooltip }) => (
    <div className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
        <div className="flex items-center">
            <h4 className="font-semibold text-slate-300 text-sm">{label}</h4>
            <div className="relative group ml-2">
                <InfoIcon className="w-4 h-4 text-slate-400 cursor-pointer" />
                <div className="absolute bottom-full mb-2 w-64 p-2 text-xs text-white bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                    {tooltip}
                </div>
            </div>
        </div>
        <p className="text-xl font-bold text-teal-400">{typeof value === 'number' ? value.toFixed(3) : value}</p>
    </div>
);

const SliderControl: React.FC<{label: string; value: number; min: number; max: number; step: number; onChange: (v:number)=>void}> = ({label, value, min, max, step, onChange}) => (
    <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
            {label}: <span className="font-bold text-orange-400">{value.toFixed(2)}</span>
        </label>
        <input
            type="range"
            min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
    </div>
);


export const ConfusionMatrix: React.FC = () => {
    const [prevalence, setPrevalence] = useState(0.5);
    const [threshold, setThreshold] = useState(0.5);
    
    const [posMean, setPosMean] = useState(0.65);
    const [posStdDev, setPosStdDev] = useState(0.15);
    const [negMean, setNegMean] = useState(0.35);
    const [negStdDev, setNegStdDev] = useState(0.15);

    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef<number | null>(null);

    const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
    const [explanation, setExplanation] = useState<string>('');

    const scores = useMemo(() => {
        const numPositive = Math.round(TOTAL_INSTANCES * prevalence);
        const numNegative = TOTAL_INSTANCES - numPositive;
        const positiveScores = generateNormalData(numPositive, posMean, posStdDev).map(s => Math.max(0, Math.min(1, s)));
        const negativeScores = generateNormalData(numNegative, negMean, negStdDev).map(s => Math.max(0, Math.min(1, s)));
        return [
            ...positiveScores.map(score => ({ score, isPositive: true })),
            ...negativeScores.map(score => ({ score, isPositive: false })),
        ];
    }, [prevalence, posMean, posStdDev, negMean, negStdDev]);

    const { tp, fp, fn, tn } = useMemo(() => {
        let tp = 0, fp = 0, fn = 0, tn = 0;
        scores.forEach(({ score, isPositive }) => {
            const predictedPositive = score >= threshold;
            if (isPositive && predictedPositive) tp++;
            else if (!isPositive && predictedPositive) fp++;
            else if (isPositive && !predictedPositive) fn++;
            else if (!isPositive && !predictedPositive) tn++;
        });
        return { tp, fp, fn, tn };
    }, [scores, threshold]);
    
    const metrics = useMemo(() => {
        return calculateClassificationMetrics(tp, fp, fn, tn);
    }, [tp, fp, fn, tn]);

    const rocCurveData = useMemo(() => {
        const points = [];
        const numActualPositive = scores.filter(s => s.isPositive).length;
        const numActualNegative = scores.length - numActualPositive;
        
        if (numActualPositive === 0 || numActualNegative === 0) return [{fpr: 0, tpr: 0, isActive: false}, {fpr: 1, tpr: 1, isActive: false}];

        for (let t = 0; t <= 1.01; t += 0.01) {
            let tp_roc = 0, fp_roc = 0;
            scores.forEach(({ score, isPositive }) => {
                if (score >= t) {
                    if (isPositive) tp_roc++;
                    else fp_roc++;
                }
            });
            const tpr = tp_roc / numActualPositive;
            const fpr = fp_roc / numActualNegative;
            
            const currentFpr = fp / numActualNegative;
            const distance = Math.sqrt(Math.pow(fpr - currentFpr, 2));

            points.push({ fpr, tpr, threshold: t, distance });
        }

        const activePointFpr = fp / numActualNegative;
        let minDistance = Infinity;
        let activeIndex = -1;

        points.forEach((p, index) => {
            const dist = Math.abs(p.fpr - activePointFpr);
             if (dist < minDistance) {
                minDistance = dist;
                activeIndex = index;
            }
        });

        const currentTpr = numActualPositive > 0 ? tp / numActualPositive : 0;
        const currentFpr = numActualNegative > 0 ? fp / numActualNegative : 0;
        
        const finalPoints = [...points.map(p => ({...p, isActive: false})), {fpr: currentFpr, tpr: currentTpr, isActive: true, threshold: threshold}];
        finalPoints.sort((a,b) => a.fpr - b.fpr);

        return [{fpr:0, tpr:0, isActive: false}, ...finalPoints, {fpr:1, tpr:1, isActive: false}].filter((v,i,a)=>a.findIndex(t=>(t.fpr === v.fpr && t.tpr === v.tpr))===i);

    }, [scores, threshold, tp, fp]);

    const auc = useMemo(() => calculateAuc(rocCurveData.map(p => ({x: p.fpr, y: p.tpr}))), [rocCurveData]);

    const scoreDistributionData = useMemo(() => {
        const bins = Array.from({ length: 51 }, (_, i) => ({
            name: (i * 0.02).toFixed(2),
            positive: 0,
            negative: 0,
        }));
        scores.forEach(({ score, isPositive }) => {
            const index = Math.min(50, Math.floor(score / 0.02));
            if (isPositive) bins[index].positive++;
            else bins[index].negative++;
        });
        return bins;
    }, [scores]);

    useEffect(() => {
        if (isAnimating) {
            setThreshold(0);
            animationRef.current = window.setInterval(() => {
                setThreshold(prev => {
                    if (prev >= 1) {
                        clearInterval(animationRef.current!);
                        setIsAnimating(false);
                        return 1;
                    }
                    return prev + 0.01;
                });
            }, 50);
        } else if (animationRef.current) {
            clearInterval(animationRef.current);
        }
        return () => {
            if (animationRef.current) clearInterval(animationRef.current);
        };
    }, [isAnimating]);

    const handleScenarioChange = (id: string) => {
        const scenario = scenarios.find(s => s.id === id);
        setSelectedScenarioId(id);
        if (scenario) {
            const { prevalence, posMean, posStdDev, negMean, negStdDev } = scenario.params;
            setPrevalence(prevalence);
            setPosMean(posMean);
            setPosStdDev(posStdDev);
            setNegMean(negMean);
            setNegStdDev(negStdDev);
        }
    };
    
    useEffect(() => {
        const scenario = scenarios.find(s => s.id === selectedScenarioId);
        if (scenario) {
            const explanationHtml = generateStaticExplanation(scenario, metrics, auc, { tp, fp, fn, tn });
            setExplanation(explanationHtml);
        } else {
            setExplanation('');
        }
    }, [selectedScenarioId, metrics, auc, tp, fp, fn, tn]);


    const MatrixCell: React.FC<{ label: string; value: number; bgColor: string; textColor: string; description: string }> = ({ label, value, bgColor, textColor, description }) => (
        <div className={`${bgColor} ${textColor} p-4 rounded-lg text-center flex flex-col justify-center shadow-md min-h-[120px]`}>
            <div className="font-semibold">{label}</div>
            <div className="text-sm opacity-80 mb-1">{description}</div>
            <div className="text-4xl font-bold mt-1">{value}</div>
        </div>
    );
    
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
                 <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-100 mb-4">Controles del Modelo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <SliderControl label="Prevalencia Clase (+)" value={prevalence} min={0.01} max={0.99} step={0.01} onChange={setPrevalence}/>
                        <SliderControl label="Umbral Clasificación" value={threshold} min={0} max={1} step={0.01} onChange={setThreshold}/>
                        <SliderControl label="Media Puntuación (+)" value={posMean} min={0} max={1} step={0.01} onChange={setPosMean}/>
                        <SliderControl label="Desv. Est. Puntuación (+)" value={posStdDev} min={0.01} max={0.5} step={0.01} onChange={setPosStdDev}/>
                        <SliderControl label="Media Puntuación (-)" value={negMean} min={0} max={1} step={0.01} onChange={setNegMean}/>
                        <SliderControl label="Desv. Est. Puntuación (-)" value={negStdDev} min={0.01} max={0.5} step={0.01} onChange={setNegStdDev}/>
                    </div>
                     <button
                        onClick={() => setIsAnimating(prev => !prev)}
                        className="w-full mt-6 bg-orange-500 text-white font-bold py-2.5 px-4 rounded-md hover:bg-orange-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-orange-500"
                        >
                        {isAnimating ? 'Detener Animación' : 'Animar Umbral'}
                    </button>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-slate-100">Distribución de Puntuaciones</h3>
                    <ResponsiveContainer width="100%" height={200}>
                         <AreaChart data={scoreDistributionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                             <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 1]} />
                             <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                             <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                             <Area type="monotone" dataKey="negative" stackId="1" stroke="#f87171" fill="#f87171" fillOpacity={0.6} name="Clase Negativa" />
                             <Area type="monotone" dataKey="positive" stackId="1" stroke="#4ade80" fill="#4ade80" fillOpacity={0.6} name="Clase Positiva"/>
                             <ReferenceLine x={threshold.toFixed(2)} stroke="white" strokeWidth={2} label={{ value: "Umbral", position: "insideBottom", fill: 'white' }} />
                         </AreaChart>
                     </ResponsiveContainer>
                </div>

                 <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Matriz de Confusión</h2>
                    <div className="relative pt-10 pl-10 mt-2">
                        {/* Axis Labels */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-base font-semibold text-slate-300 tracking-wider">Predicho</div>
                        <div className="absolute top-1/2 left-2 -translate-y-1/2 -rotate-90 text-base font-semibold text-slate-300 tracking-wider">Real</div>

                        {/* The matrix grid itself */}
                        <div className="grid grid-cols-[auto_1fr_1fr] grid-rows-[auto_1fr_1fr] gap-x-3 gap-y-3 items-stretch">
                            {/* Column Labels */}
                            <div></div> {/* Top-left corner */}
                            <div className="text-center font-medium text-slate-400 pb-1">Positivo</div>
                            <div className="text-center font-medium text-slate-400 pb-1">Negativo</div>

                            {/* Row 1: Actual Positive */}
                            <div className="flex items-center justify-end font-medium text-slate-400 pr-2">Positivo</div>
                            <MatrixCell label="Verdadero Positivo (VP)" value={tp} bgColor="bg-teal-800" textColor="text-teal-100" description="Acierto Positivo" />
                            <MatrixCell label="Falso Negativo (FN)" value={fn} bgColor="bg-orange-900" textColor="text-orange-100" description="Error Tipo II" />

                            {/* Row 2: Actual Negative */}
                            <div className="flex items-center justify-end font-medium text-slate-400 pr-2">Negativo</div>
                            <MatrixCell label="Falso Positivo (FP)" value={fp} bgColor="bg-red-900" textColor="text-red-100" description="Error Tipo I" />
                            <MatrixCell label="Verdadero Negativo (VN)" value={tn} bgColor="bg-teal-800" textColor="text-teal-100" description="Acierto Negativo" />
                        </div>
                    </div>
                </div>
            </div>
             <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                     <h3 className="text-xl font-semibold mb-4 text-slate-100">Curva ROC / AUC</h3>
                     <ResponsiveContainer width="100%" height={300}>
                         <LineChart data={rocCurveData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fontSize: 12, fill: '#94a3b8' }} label={{ value: 'Tasa de Falsos Positivos (1 - Especificidad)', position: 'insideBottom', offset: -15, fill: '#94a3b8' }}/>
                            <YAxis dataKey="tpr" type="number" domain={[0, 1]} tick={{ fontSize: 12, fill: '#94a3b8' }} label={{ value: 'Tasa de Verdaderos Positivos (Sensibilidad)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8' }}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} labelFormatter={(value) => `FPR: ${value.toFixed(3)}`} />
                            <Line type="monotone" dataKey="tpr" stroke="#f97316" strokeWidth={2} dot={false} name="Sensibilidad" />
                            <Line dataKey="tpr" stroke="transparent" dot={<ActiveDot/>} isAnimationActive={false}/>
                            <Line dataKey={ (payload) => payload.fpr } stroke="#94a3b8" strokeWidth={1} dot={false} name="Aleatorio" strokeDasharray="3 3"/>
                         </LineChart>
                     </ResponsiveContainer>
                     <p className="text-center text-slate-200 mt-2">Área Bajo la Curva (AUC): <span className="font-bold text-2xl text-orange-400">{auc.toFixed(4)}</span></p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Métricas de Clasificación</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <MetricDisplay label="Exactitud" value={metrics.accuracy} tooltip="Porcentaje de predicciones correctas. (VP+VN)/Total" />
                        <MetricDisplay label="Precisión" value={metrics.precision} tooltip="De las predicciones positivas, ¿cuántas fueron correctas? VP/(VP+FP)" />
                        <MetricDisplay label="Sensibilidad (Recall)" value={metrics.recall} tooltip="De todos los positivos reales, ¿cuántos se identificaron? VP/(VP+FN)" />
                        <MetricDisplay label="Especificidad" value={metrics.specificity} tooltip="De todos los negativos reales, ¿cuántos se identificaron? VN/(VN+FP)" />
                        <MetricDisplay label="Puntuación F1" value={metrics.f1Score} tooltip="Media armónica de Precisión y Sensibilidad." />
                        <MetricDisplay label="MCC" value={metrics.mcc} tooltip="Coeficiente de Correlación de Matthews. Medida robusta para clasificación binaria." />
                        <MetricDisplay label="Prevalencia" value={metrics.prevalence} tooltip="¿Con qué frecuencia ocurre la clase positiva? (VP+FN)/Total" />
                        <MetricDisplay label="Total" value={`${TOTAL_INSTANCES}`} tooltip="Número total de instancias simuladas." />
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Análisis de Resultados</h2>
                     <div>
                        <label htmlFor="scenario-select" className="block text-sm font-medium text-slate-300 mb-2">
                            Selecciona un Escenario de Aplicación:
                        </label>
                        <select
                            id="scenario-select"
                            value={selectedScenarioId}
                            onChange={(e) => handleScenarioChange(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                        >
                            <option value="" disabled>Elige un caso de uso...</option>
                            {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    {selectedScenarioId && (
                        <div className="mt-4">
                            <p className="text-sm text-slate-400 bg-slate-900/50 p-3 rounded-md border border-slate-700">
                                {scenarios.find(s => s.id === selectedScenarioId)?.description}
                            </p>
                            <div className="mt-4">
                                {explanation && (
                                    <div className="prose prose-sm prose-invert bg-slate-900/50 p-4 rounded-md border border-slate-700 max-w-none" dangerouslySetInnerHTML={{ __html: explanation }}></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
