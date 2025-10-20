import React, { useState, useEffect, useMemo } from 'react';
import { DistributionType, Statistics, ChartDataItem } from '../types';
import {
  generatePopulation,
  drawSample,
  calculateMean,
  calculateStdDev,
  binDataForChart,
} from '../utils/dataUtils';
import { ChartCard } from './ChartCard';
import { ControlPanel } from './ControlPanel';

const StatCard: React.FC<{ title: string; stats: Statistics }> = ({ title, stats }) => (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
        <h4 className="text-lg font-semibold text-orange-500">{title}</h4>
        <p className="text-2xl font-bold text-slate-100 mt-2">Media: {stats.mean.toFixed(2)}</p>
        <p className="text-2xl font-bold text-slate-100">Desv. Estándar: {stats.stdDev.toFixed(2)}</p>
    </div>
);


export const Simulator: React.FC = () => {
  const [distributionType, setDistributionType] = useState<DistributionType>(DistributionType.Normal);
  const [sampleSize, setSampleSize] = useState<number>(100);
  const [sample, setSample] = useState<number[]>([]);

  const population = useMemo(() => generatePopulation(distributionType), [distributionType]);

  const populationStats = useMemo<Statistics>(() => {
    const mean = calculateMean(population);
    const stdDev = calculateStdDev(population, mean);
    return { mean, stdDev };
  }, [population]);

  const sampleStats = useMemo<Statistics>(() => {
    if (sample.length === 0) return { mean: 0, stdDev: 0 };
    const mean = calculateMean(sample);
    const stdDev = calculateStdDev(sample, mean);
    return { mean, stdDev };
  }, [sample]);
  
  const handleRedrawSample = () => {
    setSample(drawSample(population, sampleSize));
  };
  
  useEffect(() => {
    handleRedrawSample();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [population, sampleSize]);

  const populationChartData = useMemo<ChartDataItem[]>(() => binDataForChart(population, 50), [population]);
  const sampleChartData = useMemo<ChartDataItem[]>(() => binDataForChart(sample, 30), [sample]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <ControlPanel
          distributionType={distributionType}
          setDistributionType={setDistributionType}
          sampleSize={sampleSize}
          setSampleSize={setSampleSize}
          onRedrawSample={handleRedrawSample}
        />
        <div className="mt-8 space-y-4">
             <StatCard title="Estadísticas de la Población" stats={populationStats} />
             <StatCard title="Estadísticas de la Muestra" stats={sampleStats} />
        </div>
      </div>
      <div className="lg:col-span-2 space-y-8">
        <ChartCard title="Distribución de la Población" data={populationChartData} barColor="#14b8a6" />
        <ChartCard title={`Distribución de la Muestra (n=${sampleSize})`} data={sampleChartData} barColor="#f97316" />
      </div>
    </div>
  );
};
