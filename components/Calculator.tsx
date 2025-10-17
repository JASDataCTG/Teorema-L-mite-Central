import React, { useState, useMemo } from 'react';
import { calculateSampleSize } from '../utils/dataUtils';
import { InfoIcon } from './Icons';

interface ParameterInputProps {
  label: string;
  tooltip: string;
  value: number;
  displayValue?: string;
  children: React.ReactNode;
}

const ParameterInput: React.FC<ParameterInputProps> = ({ label, tooltip, children, value, displayValue }) => (
  <div>
    <label className="block text-sm font-medium text-sky-300 mb-2">
      <div className="flex items-center space-x-2">
        <span>{label}</span>
        <div className="group relative">
          <InfoIcon className="h-4 w-4 text-slate-400" />
          <div className="absolute bottom-full mb-2 w-64 p-2 bg-slate-900 text-slate-300 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            {tooltip}
          </div>
        </div>
      </div>
    </label>
    <div className="flex items-center space-x-4">
      {children}
      <span className="font-mono text-sky-400 w-20 text-center bg-slate-700 py-1 rounded-md">
        {displayValue || value}
      </span>
    </div>
  </div>
);

const Calculator: React.FC = () => {
  const [populationSize, setPopulationSize] = useState<number | null>(100000);
  const [isFinite, setIsFinite] = useState<boolean>(true);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [marginOfError, setMarginOfError] = useState<number>(5);
  const [proportion, setProportion] = useState<number>(50);

  const sampleSize = useMemo(() => {
    return calculateSampleSize(
      isFinite ? populationSize : null,
      confidenceLevel,
      marginOfError,
      proportion
    );
  }, [populationSize, isFinite, confidenceLevel, marginOfError, proportion]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4 bg-slate-800/50 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="md:col-span-2 flex flex-col space-y-8">
        <div>
          <label className="block text-sm font-medium text-sky-300 mb-2">Tamaño de la Población (N)</label>
          <div className="flex items-center space-x-4">
             <input
              type="number"
              value={populationSize ?? ''}
              onChange={(e) => setPopulationSize(e.target.value ? Number(e.target.value) : null)}
              disabled={!isFinite}
              className="w-full bg-slate-700 text-white rounded-md p-2 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50"
              placeholder="Ej: 100000"
            />
            <div className="flex items-center space-x-2">
                <input type="checkbox" id="finite-pop" checked={!isFinite} onChange={() => setIsFinite(!isFinite)} className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-600 focus:ring-sky-500" />
                <label htmlFor="finite-pop" className="text-slate-300">Infinita</label>
            </div>
          </div>
        </div>
        
        <ParameterInput label="Nivel de Confianza (Z)" tooltip="La probabilidad de que la media de la muestra caiga dentro de un rango específico de la media poblacional. 95% es el estándar." value={confidenceLevel} displayValue={`${confidenceLevel}%`}>
          <select value={confidenceLevel} onChange={(e) => setConfidenceLevel(Number(e.target.value))} className="w-full bg-slate-700 text-white rounded-md p-2 focus:ring-sky-500 focus:border-sky-500">
            <option value={90}>90%</option>
            <option value={95}>95%</option>
            <option value={99}>99%</option>
          </select>
        </ParameterInput>

        <ParameterInput label="Margen de Error (E)" tooltip="La cantidad máxima permitida de error en los resultados. Un valor más bajo requiere una muestra más grande." value={marginOfError} displayValue={`${marginOfError}%`}>
          <input type="range" min="1" max="10" step="0.5" value={marginOfError} onChange={(e) => setMarginOfError(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
        </ParameterInput>

         <ParameterInput label="Proporción Esperada (p)" tooltip="La proporción estimada de la población que tiene el atributo de interés. Usa 50% si no tienes una estimación previa para obtener el tamaño de muestra más conservador." value={proportion} displayValue={`${proportion}%`}>
          <input type="range" min="1" max="99" value={proportion} onChange={(e) => setProportion(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
        </ParameterInput>
      </div>
      
      <div className="flex flex-col items-center justify-center bg-slate-900/50 p-6 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-slate-400 mb-2">Tamaño de Muestra Requerido</h3>
        <p className="text-5xl lg:text-6xl font-bold text-emerald-400 tracking-tight">
          {sampleSize.toLocaleString()}
        </p>
         <p className="text-slate-400 mt-4 text-sm">
           Este es el número mínimo de individuos que necesitas encuestar para obtener resultados que reflejen a la población con el nivel de confianza y margen de error seleccionados.
        </p>
      </div>
    </div>
  );
};

export default Calculator;
