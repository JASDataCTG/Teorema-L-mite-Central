import React, { useState } from 'react';
import { Simulator } from './components/Simulator';
import { Calculator } from './components/Calculator';
import { ConfusionMatrix } from './components/ConfusionMatrix';
import { ChartBarIcon, CalculatorIcon, ConfusionMatrixIcon } from './components/Icons';

type Tab = 'simulator' | 'calculator' | 'confusionMatrix';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('simulator');

  const renderContent = () => {
    switch (activeTab) {
      case 'simulator':
        return <Simulator />;
      case 'calculator':
        return <Calculator />;
      case 'confusionMatrix':
        return <ConfusionMatrix />;
      default:
        return <Simulator />;
    }
  };

  // FIX: Replaced JSX.Element with React.ReactNode to resolve "Cannot find namespace 'JSX'" error.
  const tabs: { id: Tab; name: string; icon: React.ReactNode }[] = [
    { id: 'simulator', name: 'Simulador TLC', icon: <ChartBarIcon className="w-5 h-5 mr-2" /> },
    { id: 'calculator', name: 'Calculadora de Muestra', icon: <CalculatorIcon className="w-5 h-5 mr-2" /> },
    { id: 'confusionMatrix', name: 'Simulador Matriz de Confusión', icon: <ConfusionMatrixIcon className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="min-h-screen font-sans text-slate-200">
      <header className="bg-slate-800 shadow-lg">
        <div className="container mx-auto px-4 py-5">
          <h1 className="text-3xl font-bold text-white">Explorador de Conceptos Estadísticos</h1>
          <h2 className="text-3xl font-bold text-white">Desarrollado por: Ing. Jairo Acosta Solano</h2>
          <p className="text-slate-300 mt-1">Una herramienta interactiva para explorar el Teorema del Límite Central, calcular tamaños de muestra y analizar métricas de clasificación.</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="border-b border-slate-700 mb-8">
            <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto pb-2" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center whitespace-nowrap px-3 py-4 text-sm sm:text-base font-medium transition-colors duration-200 ease-in-out
                        ${activeTab === tab.id
                        ? 'border-b-2 border-orange-500 text-orange-500'
                        : 'border-transparent text-slate-400 hover:text-orange-500'
                        }
                    `}
                    >
                    {tab.icon}
                    {tab.name}
                    </button>
                ))}
            </nav>
        </div>
        <div>
          {renderContent()}
        </div>
      </main>
       <footer className="text-center py-6 text-slate-500 text-sm">
            <p>Construido con fines educativos y de demostración.</p>
        </footer>
    </div>
  );
};

export default App;