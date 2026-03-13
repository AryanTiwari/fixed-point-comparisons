import type { ExampleFunction2D, Point2D } from '../algorithms/types';

export const EXAMPLE_FUNCTIONS_2D: ExampleFunction2D[] = [
  {
    id: 'linear-coupled',
    name: 'Linear Coupled',
    description: 'A simple linear system with coupling: demonstrates how Anderson memory helps with coupled dynamics',
    formula: 'g(x,y) = \\begin{pmatrix} 0.5x + 0.3y + 0.1 \\\\ 0.2x + 0.6y + 0.15 \\end{pmatrix}',
    g: ([x, y]: Point2D): Point2D => [
      0.5 * x + 0.3 * y + 0.1,
      0.2 * x + 0.6 * y + 0.15
    ],
    jacobian: (): [[number, number], [number, number]] => [
      [0.5 - 1, 0.3],
      [0.2, 0.6 - 1]
    ],
    defaultX0: [2, 2],
    fixedPoint: [17/28, 19/28],  // Solved: (I-A)^-1 * b where A=[[0.5,0.3],[0.2,0.6]], b=[0.1,0.15]
    domain: { x: [-0.5, 3], y: [-0.5, 3] }
  },
  {
    id: 'rotation-contraction',
    name: 'Spiral Contraction',
    description: 'Contracts while rotating: creates spiral convergence pattern where m=2 is especially effective',
    formula: 'g(x,y) = 0.8 \\cdot R_{0.3} \\begin{pmatrix} x-1 \\\\ y-1 \\end{pmatrix} + \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}',
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
    formula: 'g(x,y) = \\begin{pmatrix} 0.5\\cos(y) + 0.5 \\\\ 0.5\\sin(x) + 0.5 \\end{pmatrix}',
    g: ([x, y]: Point2D): Point2D => [
      0.5 * Math.cos(y) + 0.5,
      0.5 * Math.sin(x) + 0.5
    ],
    defaultX0: [0, 0],
    fixedPoint: [0.82363, 0.86681],  // Numerically determined via iteration
    domain: { x: [-0.5, 2], y: [-0.5, 2] }
  },
  {
    id: 'quadratic-system',
    name: 'Quadratic System',
    description: 'Nonlinear quadratic coupling: has two fixed points at (⅓, ⅓) and (2, 2)',
    formula: 'g(x,y) = \\begin{pmatrix} 0.3(x^2 + y) + 0.2 \\\\ 0.3(x + y^2) + 0.2 \\end{pmatrix}',
    g: ([x, y]: Point2D): Point2D => [
      0.3 * (x * x + y) + 0.2,
      0.3 * (x + y * y) + 0.2
    ],
    defaultX0: [1.5, 1.5],
    fixedPoint: [1/3, 1/3],  // Stable fixed point
    secondaryFixedPoint: [2, 2],  // Unstable fixed point
    domain: { x: [-0.5, 2.5], y: [-0.5, 2.5] }
  },
  {
    id: 'asymmetric-linear',
    name: 'Asymmetric Linear',
    description: 'Highly asymmetric convergence rates in x and y directions',
    formula: 'g(x,y) = \\begin{pmatrix} 0.9x + 0.05y + 0.05 \\\\ 0.1x + 0.3y + 0.3 \\end{pmatrix}',
    g: ([x, y]: Point2D): Point2D => [
      0.9 * x + 0.05 * y + 0.05,  // Slow in x
      0.1 * x + 0.3 * y + 0.3     // Fast in y
    ],
    defaultX0: [3, 3],
    fixedPoint: [10/13, 7/13],  // Solved: (I-A)^-1 * b where A=[[0.9,0.05],[0.1,0.3]], b=[0.05,0.3]
    domain: { x: [-0.5, 4], y: [-0.5, 4] }
  }
];
