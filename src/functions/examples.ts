import type { ExampleFunction } from '../algorithms/types';

/**
 * Collection of example functions for demonstrating fixed-point iteration
 *
 * Each function is defined in both forms:
 * - g(x): Fixed-point form where we seek x such that g(x) = x
 * - f(x): Root form where f(x) = g(x) - x = 0
 * - df(x): Derivative of f for Newton's method
 */
export const EXAMPLE_FUNCTIONS: ExampleFunction[] = [
  {
    id: 'cos',
    name: 'cos(x)',
    latex: 'g(x) = \\cos(x)',
    description: 'Classic fixed-point: x = cos(x). Converges slowly (linear).',
    g: (x) => Math.cos(x),
    f: (x) => Math.cos(x) - x,
    df: (x) => -Math.sin(x) - 1,
    defaultX0: 0.5,
    fixedPoint: 0.7390851332151607,  // Dottie number
    domain: [-1, 2]
  },
  {
    id: 'sqrt2',
    name: '(x + 2/x) / 2',
    latex: 'g(x) = \\frac{x + \\frac{2}{x}}{2}',
    description: 'Babylonian method for √2. Fast convergence.',
    g: (x) => (x + 2 / x) / 2,
    f: (x) => (x + 2 / x) / 2 - x,
    df: (x) => (1 - 2 / (x * x)) / 2 - 1,
    defaultX0: 1.0,
    fixedPoint: Math.SQRT2,
    domain: [0.5, 3]
  },
  {
    id: 'exp-decay',
    name: 'e⁻ˣ',
    latex: 'g(x) = e^{-x}',
    description: 'Exponential decay: x = e^(-x). Moderate convergence.',
    g: (x) => Math.exp(-x),
    f: (x) => Math.exp(-x) - x,
    df: (x) => -Math.exp(-x) - 1,
    defaultX0: 0.5,
    fixedPoint: 0.5671432904097838,  // Omega constant
    domain: [-0.5, 2]
  },
  {
    id: 'sine-offset',
    name: '1 + ½sin(x)',
    latex: 'g(x) = 1 + \\frac{1}{2}\\sin(x)',
    description: 'Oscillatory convergence: x = 1 + 0.5sin(x).',
    g: (x) => 1 + 0.5 * Math.sin(x),
    f: (x) => 1 + 0.5 * Math.sin(x) - x,
    df: (x) => 0.5 * Math.cos(x) - 1,
    defaultX0: 0.5,
    fixedPoint: 1.4987011335178285,
    domain: [-0.5, 3]
  },
  {
    id: 'cubic',
    name: '(x³ + 1) / 3',
    latex: 'g(x) = \\frac{x^3 + 1}{3}',
    description: 'Cubic iteration: slower convergence near fixed point.',
    g: (x) => (x * x * x + 1) / 3,
    f: (x) => (x * x * x + 1) / 3 - x,
    df: (x) => x * x - 1,
    defaultX0: 0.5,
    fixedPoint: 0.6823278038280193,
    domain: [-0.5, 2]
  },
  {
    id: 'log-shift',
    name: 'ln(x + 2)',
    latex: 'g(x) = \\ln(x + 2)',
    description: 'Logarithmic: x = ln(x + 2). Gentle convergence.',
    g: (x) => Math.log(x + 2),
    f: (x) => Math.log(x + 2) - x,
    df: (x) => 1 / (x + 2) - 1,
    defaultX0: 1.0,
    fixedPoint: 1.1461932206205825,
    domain: [0, 3]
  },
  {
    id: 'atan',
    name: 'arctan(x) + x/2',
    latex: 'g(x) = \\arctan(x) + \\frac{x}{2}',
    description: 'Arctangent iteration with linear term.',
    g: (x) => Math.atan(x) + x / 2,
    f: (x) => Math.atan(x) + x / 2 - x,
    df: (x) => 1 / (1 + x * x) - 0.5,
    defaultX0: 0.5,
    fixedPoint: 0,  // x = 0 is the fixed point
    domain: [-2, 2]
  },
  {
    id: 'slow-linear',
    name: '0.9x + 0.1',
    latex: 'g(x) = 0.9x + 0.1',
    description: 'Very slow linear convergence (|g\'| = 0.9).',
    g: (x) => 0.9 * x + 0.1,
    f: (x) => 0.9 * x + 0.1 - x,
    df: (_x) => -0.1,
    defaultX0: 0.0,
    fixedPoint: 1.0,
    domain: [-0.5, 2]
  }
];

export function getFunctionById(id: string): ExampleFunction | undefined {
  return EXAMPLE_FUNCTIONS.find(f => f.id === id);
}
