import type { ExampleFunction2D, Point2D } from '../algorithms/types';

// Compute fixed point using Newton's method (converges quadratically to machine precision)
function computeFixedPoint(
  g: (p: Point2D) => Point2D,
  initialGuess: Point2D,
  tolerance: number = 1e-14,
  maxIterations: number = 100
): Point2D {
  let x: Point2D = [...initialGuess];
  const h = 1e-8;  // Step for numerical Jacobian

  for (let iter = 0; iter < maxIterations; iter++) {
    const gx = g(x);
    const fx: Point2D = [gx[0] - x[0], gx[1] - x[1]];  // f(x) = g(x) - x

    const residual = Math.sqrt(fx[0] * fx[0] + fx[1] * fx[1]);
    if (residual < tolerance) {
      return gx;  // Return g(x) which is even closer to the fixed point
    }

    // Compute Jacobian of f(x) = g(x) - x numerically
    const gxh0 = g([x[0] + h, x[1]]);
    const gxh1 = g([x[0], x[1] + h]);

    // J_f = J_g - I
    const J: [[number, number], [number, number]] = [
      [(gxh0[0] - gx[0]) / h - 1, (gxh1[0] - gx[0]) / h],
      [(gxh0[1] - gx[1]) / h, (gxh1[1] - gx[1]) / h - 1]
    ];

    // Solve J * delta = f using Cramer's rule
    const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    if (Math.abs(det) < 1e-14) {
      // Jacobian singular, fall back to fixed-point step
      x = gx;
      continue;
    }

    const delta: Point2D = [
      (J[1][1] * fx[0] - J[0][1] * fx[1]) / det,
      (J[0][0] * fx[1] - J[1][0] * fx[0]) / det
    ];

    x = [x[0] - delta[0], x[1] - delta[1]];
  }

  // Return best estimate
  return g(x);
}

// Define g functions first so we can compute fixed points
const gLinearCoupled = ([x, y]: Point2D): Point2D => [
  0.5 * x + 0.3 * y + 0.1,
  0.2 * x + 0.6 * y + 0.15
];

const gRotationContraction = ([x, y]: Point2D): Point2D => {
  const r = 0.8;  // Contraction factor
  const theta = 0.3;  // Rotation angle
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const dx = x - 1;
  const dy = y - 1;
  return [
    r * (cos * dx - sin * dy) + 1,
    r * (sin * dx + cos * dy) + 1
  ];
};

const gTrigCoupled = ([x, y]: Point2D): Point2D => [
  0.5 * Math.cos(y) + 0.5,
  0.5 * Math.sin(x) + 0.5
];

const gQuadraticSystem = ([x, y]: Point2D): Point2D => [
  0.3 * (x * x + y) + 0.2,
  0.3 * (x + y * y) + 0.2
];

const gAsymmetricLinear = ([x, y]: Point2D): Point2D => [
  0.9 * x + 0.05 * y + 0.05,
  0.1 * x + 0.3 * y + 0.3
];

// Compute fixed points using Newton's method
const fpLinearCoupled = computeFixedPoint(gLinearCoupled, [0.5, 0.5]);
const fpRotationContraction = computeFixedPoint(gRotationContraction, [1, 1]);
const fpTrigCoupled = computeFixedPoint(gTrigCoupled, [0.8, 0.8]);
const fpQuadraticStable = computeFixedPoint(gQuadraticSystem, [0.3, 0.3]);
const fpQuadraticUnstable = computeFixedPoint(gQuadraticSystem, [2, 2]);
const fpAsymmetricLinear = computeFixedPoint(gAsymmetricLinear, [0.5, 0.5]);

export const EXAMPLE_FUNCTIONS_2D: ExampleFunction2D[] = [
  {
    id: 'linear-coupled',
    name: 'Linear Coupled',
    description: 'A simple linear system with coupling: demonstrates how Anderson memory helps with coupled dynamics',
    formula: 'g(x,y) = \\begin{pmatrix} 0.5x + 0.3y + 0.1 \\\\ 0.2x + 0.6y + 0.15 \\end{pmatrix}',
    g: gLinearCoupled,
    jacobian: (): [[number, number], [number, number]] => [
      [0.5 - 1, 0.3],
      [0.2, 0.6 - 1]
    ],
    defaultX0: [2, 2],
    fixedPoint: fpLinearCoupled,
    domain: { x: [-0.5, 3], y: [-0.5, 3] }
  },
  {
    id: 'rotation-contraction',
    name: 'Spiral Contraction',
    description: 'Contracts while rotating: creates spiral convergence pattern where m=2 is especially effective',
    formula: 'g(x,y) = 0.8 \\cdot R_{0.3} \\begin{pmatrix} x-1 \\\\ y-1 \\end{pmatrix} + \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}',
    g: gRotationContraction,
    defaultX0: [2.5, 0.5],
    fixedPoint: fpRotationContraction,
    domain: { x: [-0.5, 3.5], y: [-0.5, 3] }
  },
  {
    id: 'trig-coupled',
    name: 'Trigonometric',
    description: 'Coupled trigonometric system: nonlinear with interesting convergence behavior',
    formula: 'g(x,y) = \\begin{pmatrix} 0.5\\cos(y) + 0.5 \\\\ 0.5\\sin(x) + 0.5 \\end{pmatrix}',
    g: gTrigCoupled,
    defaultX0: [0, 0],
    fixedPoint: fpTrigCoupled,
    domain: { x: [-0.5, 2], y: [-0.5, 2] }
  },
  {
    id: 'quadratic-system',
    name: 'Quadratic System',
    description: 'Nonlinear quadratic coupling: has two fixed points at (⅓, ⅓) and (2, 2)',
    formula: 'g(x,y) = \\begin{pmatrix} 0.3(x^2 + y) + 0.2 \\\\ 0.3(x + y^2) + 0.2 \\end{pmatrix}',
    g: gQuadraticSystem,
    defaultX0: [1.5, 1.5],
    fixedPoint: fpQuadraticStable,
    secondaryFixedPoint: fpQuadraticUnstable,
    domain: { x: [-0.5, 2.5], y: [-0.5, 2.5] }
  },
  {
    id: 'asymmetric-linear',
    name: 'Asymmetric Linear',
    description: 'Highly asymmetric convergence rates in x and y directions',
    formula: 'g(x,y) = \\begin{pmatrix} 0.9x + 0.05y + 0.05 \\\\ 0.1x + 0.3y + 0.3 \\end{pmatrix}',
    g: gAsymmetricLinear,
    defaultX0: [3, 3],
    fixedPoint: fpAsymmetricLinear,
    domain: { x: [-0.5, 4], y: [-0.5, 4] }
  }
];
