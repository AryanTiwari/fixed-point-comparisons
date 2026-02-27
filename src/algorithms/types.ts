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
  latex?: string;                  // LaTeX formula for display
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

// ============ 2D Types ============

export type Point2D = [number, number];

export interface IterationStep2D {
  iteration: number;
  x: Point2D;           // Current point (x, y)
  gx: Point2D;          // g(x, y) value
  residual: number;     // ||g(x) - x||
}

export interface IterationResult2D {
  steps: IterationStep2D[];
  converged: boolean;
  finalX: Point2D;
  totalIterations: number;
}

export type FixedPointFunction2D = (p: Point2D) => Point2D;
export type JacobianFunction2D = (p: Point2D) => [[number, number], [number, number]];

export interface ExampleFunction2D {
  id: string;
  name: string;
  description: string;
  formula?: string;                  // Mathematical formula for display
  g: FixedPointFunction2D;          // Fixed-point form: x = g(x)
  jacobian?: JacobianFunction2D;    // Jacobian for Newton's method (optional)
  defaultX0: Point2D;
  fixedPoint: Point2D;              // Known solution for reference
  secondaryFixedPoint?: Point2D;    // Optional second fixed point (for systems with multiple)
  domain: { x: [number, number]; y: [number, number] };  // Visualization domain
}

export interface AlgorithmResults2D {
  'fixed-point': IterationResult2D | null;
  'anderson': IterationResult2D | null;
  'steffensen': IterationResult2D | null;
  'newton': IterationResult2D | null;
}

// ============ Algorithm Constants ============

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
