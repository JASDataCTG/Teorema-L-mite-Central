import React from 'react';
import { DistributionType } from '../types';

interface ControlPanelProps {
  distribution: DistributionType;
  setDistribution: (dist: DistributionType) => void;
  sampleSize: number;
  setSampleSize: (size: number) => void;
  onDrawSamples: (count: number) => void;
  onReset: () => void;
  isSimulating: boolean;
}

const distributionOptions = Object.values(DistributionType);

const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
  </svg>
);

const ResetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201-4.42 5.5 5.5 0 011.663-1.44l-.805.805a.75.75 0 01-1.06-1.06l1.5-1.5a.75.75 0 011.06 0l1.5 1.5a.75.75 0 11-1.06 1.06l-.805-.805a4 4 0 00-1.206 3.242 4 4 0 006.67 2.785.75.75 0 011.246.828zM4.688 8.576a5.5 5.5 0 019.201 4.42 5.5 5.5 0 01-1.663 1.44l.805-.805a.75.75 0 011.06 1.06l-1.5 1.5a.75.75 0 01-1.06 0l-1.5-1.5a.75.75 0 111.06-1.06l.805.805a4 4 0 001.206-3.242 4 4 0 00-6.67-2.785a.75.75 0 01-1.246-.828z" clipRule="evenodd" />
  </svg>
);

const ControlPanel: React.FC<ControlPanelProps> = ({
  distribution,
  setDistribution,
  sampleSize,
  setSampleSize,
  onDrawSamples,
  onReset,
  isSimulating
}) => {
  return (
    <div className="bg-slate-800/50 p-4 lg:p-6 rounded-lg shadow-lg flex flex-col space-y-6 backdrop-blur-sm">
      <div>
        <label className="block text-sm font-medium text-sky-300 mb-2">Distribución de la Población</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
          {distributionOptions.map((dist) => (
            <button
              key={dist}
              onClick={() => setDistribution(dist)}
              disabled={isSimulating}
              className={`px-2 py-2 text-xs font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500
                ${distribution === dist
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:bg-slate-700 disabled:opacity-50'}`}
            >
              {dist}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="sampleSize" className="block text-sm font-medium text-sky-300 mb-2">
          Tamaño de Muestra (n)
        </label>
        <div className="flex items-center space-x-4">
          <input
            id="sampleSize"
            type="range"
            min="2"
            max="100"
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
            disabled={isSimulating}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
          />
          <span className="font-mono text-sky-400 w-8 text-center bg-slate-700 py-1 rounded-md">{sampleSize}</span>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-sky-300 mb-2">Control de Simulación</label>
        <div className="grid grid-cols-2 gap-2">
           {[1, 10, 100, 1000].map((count) => (
                <button
                    key={count}
                    onClick={() => onDrawSamples(count)}
                    disabled={isSimulating}
                    className="flex items-center justify-center space-x-2 bg-indigo-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-indigo-500 transition duration-200 disabled:bg-indigo-500 disabled:opacity-50 disabled:cursor-wait"
                >
                    <PlayIcon className="h-4 w-4" />
                    <span>{`Tomar ${count}`}</span>
                </button>
           ))}
        </div>
        <button
            onClick={onReset}
            disabled={isSimulating}
            className="mt-2 w-full flex items-center justify-center space-x-2 bg-red-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-red-500 transition duration-200 disabled:bg-red-500 disabled:opacity-50"
        >
            <ResetIcon className="h-4 w-4" />
            <span>Reiniciar</span>
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;