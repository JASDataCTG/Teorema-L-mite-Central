import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ControlPanel from './ControlPanel';
import ChartCard from './ChartCard';
import { DistributionType } from '../types';
import type { ChartDataItem, Statistics } from '../types';
import {
  generatePopulation,
  drawSample,
  calculateMean,
  calculateStdDev,
  binDataForChart,
} from '../utils/dataUtils';

const Simulator: React.FC = () => {
  const [distribution, setDistribution] = useState<DistributionType>(DistributionType.Normal);
  const [sampleSize, setSampleSize] = useState<number>(30);
  const [population, setPopulation] = useState<number[]>([]);
  const [sampleMeans, setSampleMeans] = useState<number[]>([]);
  const [latestSample, setLatestSample] = useState<number[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    setPopulation(generatePopulation(distribution));
    handleReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distribution]);

  const populationStats = useMemo<Statistics>(() => {
    const mean = calculateMean(population);
    const stdDev = calculateStdDev(population, mean);
    return { mean, stdDev };
  }, [population]);

  const latestSampleStats = useMemo<Statistics>(() => {
    const mean = calculateMean(latestSample);
    const stdDev = calculateStdDev(latestSample, mean);
    return { mean, stdDev };
  }, [latestSample]);

  const sampleMeansStats = useMemo<Statistics & { count: number }>(() => {
    const mean = calculateMean(sampleMeans);
    const stdDev = calculateStdDev(sampleMeans, mean);
    return { mean, stdDev, count: sampleMeans.length };
  }, [sampleMeans]);

  const populationChartData = useMemo<ChartDataItem[]>(() => binDataForChart(population), [population]);
  const latestSampleChartData = useMemo<ChartDataItem[]>(() => binDataForChart(latestSample), [latestSample]);
  const sampleMeansChartData = useMemo<ChartDataItem[]>(() => binDataForChart(sampleMeans), [sampleMeans]);

  const handleReset = useCallback(() => {
    setSampleMeans([]);
    setLatestSample([]);
  }, []);
  
  const runSimulation = useCallback((count: number) => {
    let newSampleMeans = [...sampleMeans];
    let lastSample: number[] = [];

    const step = (i: number) => {
      if (i >= count) {
        setSampleMeans(newSampleMeans);
        setIsSimulating(false);
        return;
      }

      const sample = drawSample(population, sampleSize);
      const mean = calculateMean(sample);
      newSampleMeans.push(mean);
      lastSample = sample;

      if (i % 50 === 0 || i === count - 1) { 
        setLatestSample(lastSample);
        setSampleMeans([...newSampleMeans]);
      }
      
      requestAnimationFrame(() => step(i + 1));
    };

    step(0);
  }, [population, sampleSize, sampleMeans]);

  const handleDrawSamples = useCallback((count: number) => {
    if (isSimulating || population.length === 0) return;
    setIsSimulating(true);
    runSimulation(count);
  }, [isSimulating, population, runSimulation]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div className="lg:col-span-1 xl:col-span-1">
        <ControlPanel
          distribution={distribution}
          setDistribution={setDistribution}
          sampleSize={sampleSize}
          setSampleSize={setSampleSize}
          onDrawSamples={handleDrawSamples}
          onReset={handleReset}
          isSimulating={isSimulating}
        />
      </div>

      <div className="lg:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard
          title="Distribución de la Población"
          data={populationChartData}
          stats={populationStats}
          barColor="#38bdf8"
        />
        <ChartCard
          title="Última Muestra Tomada"
          data={latestSampleChartData}
          stats={latestSampleStats}
          barColor="#a78bfa"
        />
        <ChartCard
          title="Distribución de las Medias Muestrales"
          data={sampleMeansChartData}
          stats={sampleMeansStats}
          barColor="#34d399"
        />
      </div>
    </div>
  );
};

export default Simulator;
