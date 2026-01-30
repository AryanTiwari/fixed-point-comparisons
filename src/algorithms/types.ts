// Core types for iteration algorithms

export interface IterationStep {
  iteration: number;
  x: number;
  fx: number;           // g(x) for fixed-point, or f(x) for Newton
  residual: number;     // |g(x) - x| or |f(x)|
}

export interface IterationResult {
  steps: IterationStep[];
  converged: boolean;
  finalX: number;
  totalIterations: number;
}

export interface AlgorithmConfig {
  tolerance: number;
  maxIterations: number;
}

export interface AndersonConfig extends AlgorithmConfig {
  memory: number;  // m parameter - number of previous iterates to use
}

export type FixedPointFunction = (x: number) => number;
export type DerivativeFunction = (x: number) => number;

export interface ExampleFunction {
  id: string;
  name: string;
  description: string;
  g: FixedPointFunction;          // Fixed-point form: x = g(x)
  f: FixedPointFunction;          // Root form: f(x) = 0 (where f(x) = g(x) - x)
  df: DerivativeFunction;         // Derivative of f for Newton's method
  defaultX0: number;
  fixedPoint: number;             // Known solution for reference
  domain: [number, number];       // Visualization domain
}

export type AlgorithmType = 'fixed-point' | 'anderson' | 'steffensen' | 'newton';

export interface AlgorithmInfo {
  id: AlgorithmType;
  name: string;
  color: string;
  description: string;
}

export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: 'fixed-point',
    name: 'Fixed-Point',
    color: '#ef4444',  // red
    description: 'Standard fixed-point iteration: x_{n+1} = g(x_n)'
  },
  {
    id: 'anderson',
    name: 'Anderson',
    color: '#22c55e',  // green
    description: 'Anderson acceleration with configurable memory'
  },
  {
    id: 'steffensen',
    name: 'Steffensen',
    color: '#3b82f6',  // blue
    description: "Steffensen's method with Aitken's Δ² acceleration"
  },
  {
    id: 'newton',
    name: 'Newton',
    color: '#f59e0b',  // amber
    description: "Newton-Raphson method (requires derivative)"
  }
];
