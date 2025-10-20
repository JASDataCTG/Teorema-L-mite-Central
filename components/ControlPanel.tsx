import React from 'react';
import { DistributionType } from '../types';

interface ControlPanelProps {
  distributionType: DistributionType;
  setDistributionType: (type: DistributionType) => void;
  sampleSize: number;
  setSampleSize: (size: number) => void;
  onRedrawSample: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  distributionType,
  setDistributionType,
  sampleSize,
  setSampleSize,
  onRedrawSample,
}) => {
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-6 text-slate-100">Controles</h3>
      <div className="space-y-6">
        <div>
          <label htmlFor="distribution-type" className="block text-sm font-medium text-slate-300 mb-2">
            Distribución de la Población
          </label>
          <select
            id="distribution-type"
            value={distributionType}
            onChange={(e) => setDistributionType(e.target.value as DistributionType)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
          >
            {Object.values(DistributionType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sample-size" className="block text-sm font-medium text-slate-300 mb-2">
            Tamaño de Muestra: {sampleSize}
          </label>
          <input
            id="sample-size"
            type="range"
            min="10"
            max="2000"
            step="10"
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
        <button
          onClick={onRedrawSample}
          className="w-full bg-orange-500 text-white font-bold py-2.5 px-4 rounded-md hover:bg-orange-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-orange-500"
        >
          Generar Nueva Muestra
        </button>
      </div>
    </div>
  );
};
