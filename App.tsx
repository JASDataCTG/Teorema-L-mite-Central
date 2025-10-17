import React, { useState } from 'react';
import Simulator from './components/Simulator';
import Calculator from './components/Calculator';
import { ChartBarIcon, CalculatorIcon } from './components/Icons';

type View = 'simulator' | 'calculator';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('simulator');

  const navButtonClasses = (view: View) => 
    `flex items-center justify-center space-x-2 w-full px-4 py-3 font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 rounded-t-lg
    ${activeView === view
      ? 'bg-slate-800/60 text-sky-400 border-b-2 border-sky-400'
      : 'bg-transparent text-slate-400 hover:bg-slate-800/30 hover:text-sky-400'}`;

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-sky-400">Herramientas Estadísticas Interactivas</h1>
        <h2 className="text-lg sm:text-xl font-semibold text-sky-500 mt-1">Desarrollado por: Ing. Jairo Acosta Solano</h2>
        <p className="max-w-3xl mx-auto mt-2 text-slate-400">
          {activeView === 'simulator' 
            ? 'Observa cómo la distribución de las medias muestrales se aproxima a una curva normal, independientemente de la distribución de la población.'
            : 'Calcula el tamaño de muestra necesario para tu investigación con base en el tamaño de la población, nivel de confianza y margen de error.'
          }
        </p>
      </header>

      <div className="max-w-7xl mx-auto">
        <nav className="flex space-x-2 border-b border-slate-700 mb-6">
          <button className={navButtonClasses('simulator')} onClick={() => setActiveView('simulator')}>
            <ChartBarIcon className="h-5 w-5" />
            <span>Simulador TLC</span>
          </button>
          <button className={navButtonClasses('calculator')} onClick={() => setActiveView('calculator')}>
            <CalculatorIcon className="h-5 w-5" />
            <span>Calculadora de Muestra</span>
          </button>
        </nav>

        <main>
          {activeView === 'simulator' && <Simulator />}
          {activeView === 'calculator' && <Calculator />}
        </main>
      </div>
    </div>
  );
};

export default App;
