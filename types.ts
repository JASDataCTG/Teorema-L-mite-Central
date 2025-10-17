export enum DistributionType {
  Normal = 'Normal',
  Uniform = 'Uniforme',
  SkewedRight = 'Sesgada a la Derecha',
  SkewedLeft = 'Sesgada a la Izquierda',
  Bimodal = 'Bimodal',
}

export interface Statistics {
  mean: number;
  stdDev: number;
}

export type ChartDataItem = {
  name: string;
  value: number;
};