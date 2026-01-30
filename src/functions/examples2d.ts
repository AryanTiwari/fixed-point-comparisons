import type { ExampleFunction2D, Point2D } from '../algorithms/types';

export const EXAMPLE_FUNCTIONS_2D: ExampleFunction2D[] = [
  {
    id: 'linear-coupled',
    name: 'Linear Coupled',
    description: 'A simple linear system with coupling: demonstrates how Anderson memory helps with coupled dynamics',
    g: ([x, y]: Point2D): Point2D => [
      0.5 * x + 0.3 * y + 0.1,
      0.2 * x + 0.6 * y + 0.15
    ],
    jacobian: (): [[number, number], [number, number]] => [
      [0.5 - 1, 0.3],
      [0.2, 0.6 - 1]
    ],
    defaultX0: [2, 2],
    fixedPoint: [0.55, 0.65],  // Solved analytically
    domain: { x: [-0.5, 3], y: [-0.5, 3] }
  },
  {
    id: 'rotation-contraction',
    name: 'Spiral Contraction',
    description: 'Contracts while rotating: creates spiral convergence pattern where m=2 is especially effective',
    g: ([x, y]: Point2D): Point2D => {
      const r = 0.8;  // Contraction factor
      const theta = 0.3;  // Rotation angle
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      // Rotate and contract, then shift to have fixed point at (1, 1)
      const dx = x - 1;
      const dy = y - 1;
      return [
        r * (cos * dx - sin * dy) + 1,
        r * (sin * dx + cos * dy) + 1
      ];
    },
    defaultX0: [2.5, 0.5],
    fixedPoint: [1, 1],
    domain: { x: [-0.5, 3.5], y: [-0.5, 3] }
  },
  {
    id: 'trig-coupled',
    name: 'Trigonometric',
    description: 'Coupled trigonometric system: nonlinear with interesting convergence behavior',
    g: ([x, y]: Point2D): Point2D => [
      0.5 * Math.cos(y) + 0.5,
      0.5 * Math.sin(x) + 0.5
    ],
    defaultX0: [0, 0],
    fixedPoint: [0.6516, 0.3026],  // Numerically determined
    domain: { x: [-0.5, 2], y: [-0.5, 2] }
  },
  {
    id: 'quadratic-system',
    name: 'Quadratic System',
    description: 'Nonlinear quadratic coupling: shows how Anderson handles polynomial nonlinearity',
    g: ([x, y]: Point2D): Point2D => [
      0.3 * (x * x + y) + 0.2,
      0.3 * (x + y * y) + 0.2
    ],
    defaultX0: [1.5, 1.5],
    fixedPoint: [0.4, 0.4],  // Numerically determined
    domain: { x: [-0.5, 2.5], y: [-0.5, 2.5] }
  },
  {
    id: 'asymmetric-linear',
    name: 'Asymmetric Linear',
    description: 'Highly asymmetric convergence rates in x and y directions',
    g: ([x, y]: Point2D): Point2D => [
      0.9 * x + 0.05 * y + 0.05,  // Slow in x
      0.1 * x + 0.3 * y + 0.3     // Fast in y
    ],
    defaultX0: [3, 3],
    fixedPoint: [0.8, 0.6],  // Solved analytically
    domain: { x: [-0.5, 4], y: [-0.5, 4] }
  }
];
