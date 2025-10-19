import { DistributionType } from '../types';
import type { ChartDataItem } from '../types';

const POPULATION_SIZE = 10000;
const POPULATION_RANGE = { min: 0, max: 100 };

// --- Statistical Calculations ---

export const calculateMean = (data: number[]): number => {
  if (data.length === 0) return 0;
  return data.reduce((a, b) => a + b, 0) / data.length;
};

export const calculateStdDev = (data: number[], mean: number): number => {
  if (data.length < 2) return 0;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (data.length -1);
  return Math.sqrt(variance);
};

// --- Sample Size Calculation ---

const Z_SCORES: { [key: number]: number } = {
  90: 1.645,
  95: 1.96,
  99: 2.576,
};

export const calculateSampleSize = (
  populationSize: number | null,
  confidenceLevel: number,
  marginOfError: number,
  proportion: number
): number => {
  const z = Z_SCORES[confidenceLevel];
  if (!z) return 0;

  const p = proportion / 100;
  const e = marginOfError / 100;

  // Formula for infinite population
  const n0 = (z * z * p * (1 - p)) / (e * e);

  if (!populationSize || populationSize <= 0) {
    return Math.ceil(n0);
  }

  // Formula adjustment for finite population
  const n = n0 / (1 + (n0 - 1) / populationSize);

  return Math.ceil(n);
};


// --- Data Generation ---

// Uses Box-Muller transform to generate normally distributed random numbers
const generateNormalPair = (): [number, number] => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const R = Math.sqrt(-2.0 * Math.log(u));
  const theta = 2.0 * Math.PI * v;
  return [R * Math.cos(theta), R * Math.sin(theta)];
};

export const generateNormalData = (count: number, mean: number, stdDev: number): number[] => {
  const data = [];
  for (let i = 0; i < Math.ceil(count / 2); i++) {
    const [z1, z2] = generateNormalPair();
    data.push(z1 * stdDev + mean);
    data.push(z2 * stdDev + mean);
  }
  return data.slice(0, count);
};

const generateUniformData = (count: number, min: number, max: number): number[] => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(min + Math.random() * (max - min));
  }
  return data;
};

const generateSkewedData = (count: number, min: number, max: number, skew: number, direction: 'left' | 'right'): number[] => {
  const data = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    if (direction === 'right') {
        data.push(min + (max - min) * Math.pow(r, skew));
    } else {
        data.push(min + (max - min) * (1 - Math.pow(r, skew)));
    }
  }
  return data;
};

const generateBimodalData = (count: number, mean1: number, stdDev1: number, mean2: number, stdDev2: number): number[] => {
    const data1 = generateNormalData(Math.ceil(count/2), mean1, stdDev1);
    const data2 = generateNormalData(Math.floor(count/2), mean2, stdDev2);
    return [...data1, ...data2];
}

export const generatePopulation = (type: DistributionType): number[] => {
    const {min, max} = POPULATION_RANGE;
    const mid = (min+max)/2;
    switch(type) {
        case DistributionType.Normal:
            return generateNormalData(POPULATION_SIZE, mid, 15);
        case DistributionType.Uniform:
            return generateUniformData(POPULATION_SIZE, min, max);
        case DistributionType.SkewedRight:
            return generateSkewedData(POPULATION_SIZE, min, max, 4, 'right');
        case DistributionType.SkewedLeft:
            return generateSkewedData(POPULATION_SIZE, min, max, 4, 'left');
        case DistributionType.Bimodal:
            return generateBimodalData(POPULATION_SIZE, mid - 25, 10, mid + 25, 10);
        default:
            return [];
    }
};

export const drawSample = (population: number[], sampleSize: number): number[] => {
    const sample = [];
    for (let i=0; i < sampleSize; i++) {
        const randomIndex = Math.floor(Math.random() * population.length);
        sample.push(population[randomIndex]);
    }
    return sample;
};

// --- Chart Data Formatting ---

export const binDataForChart = (data: number[], numBins: number = 30): ChartDataItem[] => {
  if (data.length === 0) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);

  if (min === max) {
    return [{ name: `${min.toFixed(2)}`, value: data.length }];
  }

  const binWidth = (max - min) / numBins;
  const bins: number[] = new Array(numBins).fill(0);
  const binRanges: string[] = [];

  for (let i = 0; i < numBins; i++) {
    const rangeStart = min + i * binWidth;
    binRanges.push(rangeStart.toFixed(1));
  }

  for (const value of data) {
    if (value === max) {
        bins[numBins - 1]++;
    } else {
        const binIndex = Math.floor((value - min) / binWidth);
        if (binIndex >= 0 && binIndex < numBins) {
            bins[binIndex]++;
        }
    }
  }

  return bins.map((count, index) => ({
    name: binRanges[index],
    value: count,
  }));
};


// --- Classification Metrics ---

export const calculateClassificationMetrics = (tp: number, fp: number, fn: number, tn: number) => {
    const total = tp + fp + fn + tn;
    if (total === 0) {
        return {
            accuracy: 0, precision: 0, recall: 0, specificity: 0, f1Score: 0, mcc: 0, prevalence: 0,
        };
    }

    const accuracy = (tp + tn) / total;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0; // Sensitivity
    const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    const mccNumerator = (tp * tn) - (fp * fn);
    const mccDenominator = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
    const mcc = mccDenominator > 0 ? mccNumerator / mccDenominator : 0;

    const prevalence = (tp + fn) / total;

    return {
        accuracy,
        precision,
        recall,
        specificity,
        f1Score,
        mcc,
        prevalence
    };
};

// --- ROC AUC Calculation ---
export const calculateAuc = (rocPoints: { x: number; y: number }[]): number => {
    if (rocPoints.length < 2) {
        return 0;
    }
    // Assumes points are already sorted by x-value (FPR)
    let area = 0;
    for (let i = 1; i < rocPoints.length; i++) {
        const p1 = rocPoints[i - 1];
        const p2 = rocPoints[i];
        const height = (p1.y + p2.y) / 2;
        const width = p2.x - p1.x;
        area += height * width;
    }

    return area;
};