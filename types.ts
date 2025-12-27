
export interface Stock {
  ticker: string;
  name: string;
  type: 'BR' | 'US';
}

export interface CustomBenchmark {
  id: string;
  name: string;
  value: number;
  color: string;
}

export interface SimulationParams {
  stocks: Stock[];
  startDate: string;
  endDate: string;
  initialInvestment: number;
  monthlyInvestment: number;
  reinvestDividends: boolean;
  customBenchmarks: CustomBenchmark[];
}

export interface DataPoint {
  date: string;
  [key: string]: string | number;
}

export interface ComparisonResult {
  ticker: string;
  finalValue: number;
  totalDividends: number;
  totalInvested: number;
  profitability: number;
  sharesAccumulated: number;
  history: DataPoint[];
  historyNoReinvest: DataPoint[];
}

export interface Benchmark {
  name: string;
  value: number;
  color: string;
}
