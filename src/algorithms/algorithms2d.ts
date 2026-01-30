import type {
  Point2D,
  IterationResult2D,
  IterationStep2D,
  AlgorithmConfig,
  AndersonConfig,
  FixedPointFunction2D,
  JacobianFunction2D
} from './types';

// Vector operations for 2D
function add(a: Point2D, b: Point2D): Point2D {
  return [a[0] + b[0], a[1] + b[1]];
}

function sub(a: Point2D, b: Point2D): Point2D {
  return [a[0] - b[0], a[1] - b[1]];
}

function scale(a: Point2D, s: number): Point2D {
  return [a[0] * s, a[1] * s];
}

function norm(a: Point2D): number {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
}

function dot(a: Point2D, b: Point2D): number {
  return a[0] * b[0] + a[1] * b[1];
}

// ============ Fixed-Point Iteration 2D ============

export function fixedPointIteration2D(
  g: FixedPointFunction2D,
  x0: Point2D,
  config: AlgorithmConfig
): IterationResult2D {
  const { tolerance, maxIterations } = config;
  const steps: IterationStep2D[] = [];

  let x: Point2D = [...x0];
  let converged = false;

  for (let iter = 0; iter < maxIterations; iter++) {
    const gx = g(x);
    const residual = norm(sub(gx, x));

    steps.push({
      iteration: iter,
      x: [...x],
      gx: [...gx],
      residual
    });

    if (residual < tolerance) {
      converged = true;
      break;
    }

    x = gx;
  }

  return {
    steps,
    converged,
    finalX: steps[steps.length - 1]?.x ?? x0,
    totalIterations: steps.length
  };
}

// ============ Anderson Acceleration 2D ============

export function andersonAcceleration2D(
  g: FixedPointFunction2D,
  x0: Point2D,
  config: AndersonConfig
): IterationResult2D {
  const { tolerance, maxIterations, memory } = config;
  const steps: IterationStep2D[] = [];

  // History storage
  const xHistory: Point2D[] = [];
  const fHistory: Point2D[] = [];  // f(x) = g(x) - x (residuals)
  const gHistory: Point2D[] = [];  // g(x) values

  let x: Point2D = [...x0];
  let converged = false;

  for (let iter = 0; iter < maxIterations; iter++) {
    const gx = g(x);
    const fx = sub(gx, x);  // Residual vector
    const residual = norm(fx);

    steps.push({
      iteration: iter,
      x: [...x],
      gx: [...gx],
      residual
    });

    if (residual < tolerance) {
      converged = true;
      break;
    }

    // Store in history
    xHistory.push([...x]);
    fHistory.push([...fx]);
    gHistory.push([...gx]);

    // Number of previous iterates to use
    const m_k = Math.min(memory, iter);

    if (m_k === 0) {
      // First iteration: standard fixed-point step
      x = gx;
    } else {
      // Anderson acceleration step
      x = computeAndersonStep2D(xHistory, fHistory, gHistory, m_k);
    }

    // Trim history to keep only memory entries
    while (xHistory.length > memory + 1) {
      xHistory.shift();
      fHistory.shift();
      gHistory.shift();
    }
  }

  return {
    steps,
    converged,
    finalX: steps[steps.length - 1]?.x ?? x0,
    totalIterations: steps.length
  };
}

function computeAndersonStep2D(
  xHistory: Point2D[],
  fHistory: Point2D[],
  gHistory: Point2D[],
  m_k: number
): Point2D {
  const n = xHistory.length;

  // Build the matrix of residual differences
  // ΔF_j = f_{n-1} - f_{n-1-j} for j = 1, ..., m_k
  const deltaF: Point2D[] = [];
  const deltaG: Point2D[] = [];

  for (let j = 1; j <= m_k; j++) {
    deltaF.push(sub(fHistory[n - 1], fHistory[n - 1 - j]));
    deltaG.push(sub(gHistory[n - 1], gHistory[n - 1 - j]));
  }

  // Solve the least squares problem: minimize ||f_n - sum(alpha_j * ΔF_j)||^2
  // Build the Gram matrix (m_k x m_k): G_ij = <ΔF_i, ΔF_j>
  const gram: number[][] = [];
  for (let i = 0; i < m_k; i++) {
    gram[i] = [];
    for (let j = 0; j < m_k; j++) {
      gram[i][j] = dot(deltaF[i], deltaF[j]);
    }
  }

  // Build the right-hand side: b_i = <ΔF_i, f_n>
  const f_n = fHistory[n - 1];
  const rhs: number[] = [];
  for (let i = 0; i < m_k; i++) {
    rhs[i] = dot(deltaF[i], f_n);
  }

  // Add regularization for numerical stability
  const reg = 1e-10;
  for (let i = 0; i < m_k; i++) {
    gram[i][i] += reg;
  }

  const alpha = solveLinearSystem(gram, rhs);

  if (!alpha) {
    // Fallback to standard iteration
    return gHistory[n - 1];
  }

  // x_new = g_n - sum(alpha_j * ΔG_j)
  let xNew: Point2D = [...gHistory[n - 1]];
  for (let j = 0; j < m_k; j++) {
    xNew = sub(xNew, scale(deltaG[j], alpha[j]));
  }

  return xNew;
}

// ============ Steffensen's Method 2D ============

export function steffensenMethod2D(
  g: FixedPointFunction2D,
  x0: Point2D,
  config: AlgorithmConfig
): IterationResult2D {
  const { tolerance, maxIterations } = config;
  const steps: IterationStep2D[] = [];

  let x: Point2D = [...x0];
  let converged = false;

  for (let iter = 0; iter < maxIterations; iter++) {
    const gx = g(x);
    const residual = norm(sub(gx, x));

    steps.push({
      iteration: iter,
      x: [...x],
      gx: [...gx],
      residual
    });

    if (residual < tolerance) {
      converged = true;
      break;
    }

    // Steffensen's method: use Aitken's delta-squared process
    // x1 = g(x), x2 = g(x1)
    const x1 = gx;
    const x2 = g(x1);

    // Apply Aitken acceleration component-wise
    const dx0 = sub(x1, x);
    const dx1 = sub(x2, x1);
    const ddx = sub(dx1, dx0);

    const ddxNormSq = dot(ddx, ddx);

    if (ddxNormSq < 1e-14) {
      // Denominator too small, fall back to standard iteration
      x = x1;
    } else {
      // Aitken extrapolation: x_new = x - (dx0 . dx0) / (ddx . dx0) * dx0
      // Generalized for 2D
      const dxNormSq = dot(dx0, dx0);
      const projection = dot(ddx, dx0);

      if (Math.abs(projection) < 1e-14) {
        x = x1;
      } else {
        const factor = dxNormSq / projection;
        x = sub(x, scale(dx0, factor));
      }
    }
  }

  return {
    steps,
    converged,
    finalX: steps[steps.length - 1]?.x ?? x0,
    totalIterations: steps.length
  };
}

// ============ Newton-Raphson 2D ============

export function newtonMethod2D(
  g: FixedPointFunction2D,
  x0: Point2D,
  config: AlgorithmConfig,
  jacobian?: JacobianFunction2D
): IterationResult2D {
  const { tolerance, maxIterations } = config;
  const steps: IterationStep2D[] = [];

  let x: Point2D = [...x0];
  let converged = false;

  // If no jacobian provided, use finite differences
  const getJacobian = jacobian || ((p: Point2D): [[number, number], [number, number]] => {
    const h = 1e-7;
    const gx = g(p);
    const gxh0 = g([p[0] + h, p[1]]);
    const gxh1 = g([p[0], p[1] + h]);

    // Jacobian of f(x) = g(x) - x
    // df/dx = dg/dx - I
    return [
      [(gxh0[0] - gx[0]) / h - 1, (gxh1[0] - gx[0]) / h],
      [(gxh0[1] - gx[1]) / h, (gxh1[1] - gx[1]) / h - 1]
    ];
  });

  for (let iter = 0; iter < maxIterations; iter++) {
    const gx = g(x);
    const fx = sub(gx, x);  // f(x) = g(x) - x
    const residual = norm(fx);

    steps.push({
      iteration: iter,
      x: [...x],
      gx: [...gx],
      residual
    });

    if (residual < tolerance) {
      converged = true;
      break;
    }

    // Newton step: x_new = x - J^{-1} * f(x)
    const J = getJacobian(x);
    const delta = solve2x2(J, fx);

    if (!delta) {
      // Jacobian is singular, fall back to fixed-point
      x = gx;
    } else {
      x = sub(x, delta);
    }
  }

  return {
    steps,
    converged,
    finalX: steps[steps.length - 1]?.x ?? x0,
    totalIterations: steps.length
  };
}

// Solve 2x2 linear system Ax = b
function solve2x2(A: [[number, number], [number, number]], b: Point2D): Point2D | null {
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];

  if (Math.abs(det) < 1e-14) {
    return null;
  }

  return [
    (A[1][1] * b[0] - A[0][1] * b[1]) / det,
    (A[0][0] * b[1] - A[1][0] * b[0]) / det
  ];
}

// General linear system solver (for Anderson with m > 2)
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;

  // Create augmented matrix
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }

    // Swap rows
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    // Check for singularity
    if (Math.abs(aug[col][col]) < 1e-14) {
      return null;
    }

    // Eliminate column
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Back substitution
  const x: number[] = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = aug[row][n];
    for (let col = row + 1; col < n; col++) {
      sum -= aug[row][col] * x[col];
    }
    x[row] = sum / aug[row][row];
  }

  return x;
}
