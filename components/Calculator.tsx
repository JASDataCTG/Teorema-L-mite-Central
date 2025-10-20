import React, { useState, useMemo } from 'react';
import { calculateSampleSize } from '../utils/dataUtils';
import { InfoIcon } from './Icons';

export const Calculator: React.FC = () => {
  const [populationSize, setPopulationSize] = useState<number | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [marginOfError, setMarginOfError] = useState<number>(5);
  const [proportion, setProportion] = useState<number>(50);

  const sampleSize = useMemo(() => {
    return calculateSampleSize(populationSize, confidenceLevel, marginOfError, proportion);
  }, [populationSize, confidenceLevel, marginOfError, proportion]);

  const Tooltip: React.FC<{text: string, children: React.ReactNode}> = ({ text, children }) => (
    <div className="relative flex items-center group">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs text-white bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
            {text}
        </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">Calculadora de Tamaño de Muestra</h2>
            <div className="space-y-6">
                <div>
                    <label htmlFor="population-size" className="flex items-center text-sm font-medium text-slate-300 mb-2">
                        Tamaño de la Población
                         <Tooltip text="Dejar en blanco para una población desconocida o muy grande.">
                            <InfoIcon className="w-4 h-4 ml-1.5 text-slate-400" />
                        </Tooltip>
                    </label>
                    <input
                        id="population-size"
                        type="number"
                        placeholder="Ej: 20000"
                        value={populationSize ?? ''}
                        onChange={(e) => setPopulationSize(e.target.value ? Number(e.target.value) : null)}
                        className="mt-1 block w-full pl-3 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="confidence-level" className="flex items-center text-sm font-medium text-slate-300 mb-2">
                        Nivel de Confianza (%)
                        <Tooltip text="La probabilidad de que la muestra refleje con precisión a la población. 95% es el más común.">
                            <InfoIcon className="w-4 h-4 ml-1.5 text-slate-400" />
                        </Tooltip>
                    </label>
                    <select
                        id="confidence-level"
                        value={confidenceLevel}
                        onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                    >
                        <option value={90}>90%</option>
                        <option value={95}>95%</option>
                        <option value={99}>99%</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="margin-of-error" className="flex items-center text-sm font-medium text-slate-300 mb-2">
                        Margen de Error (%)
                        <Tooltip text="La cantidad aceptable de error en los resultados. Un margen de error más pequeño requiere una muestra más grande.">
                            <InfoIcon className="w-4 h-4 ml-1.5 text-slate-400" />
                        </Tooltip>
                    </label>
                    <input
                        id="margin-of-error"
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={marginOfError}
                        onChange={(e) => setMarginOfError(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="text-right text-sm text-slate-400">{marginOfError}%</div>
                </div>
                <div>
                    <label htmlFor="proportion" className="flex items-center text-sm font-medium text-slate-300 mb-2">
                        Proporción de la Población (%)
                        <Tooltip text="Una estimación de la proporción de la población con una cierta característica. Use 50% para el tamaño de muestra más conservador.">
                            <InfoIcon className="w-4 h-4 ml-1.5 text-slate-400" />
                        </Tooltip>
                    </label>
                    <input
                        id="proportion"
                        type="range"
                        min="1"
                        max="99"
                        step="1"
                        value={proportion}
                        onChange={(e) => setProportion(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="text-right text-sm text-slate-400">{proportion}%</div>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-700 text-center">
                <p className="text-lg font-medium text-slate-300">Tamaño de Muestra Recomendado:</p>
                <p className="text-5xl font-bold text-teal-400 mt-2">{sampleSize}</p>
            </div>
        </div>
    </div>
  );
};
