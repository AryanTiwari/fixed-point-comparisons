import type { IterationResult, IterationStep, AndersonConfig, FixedPointFunction } from './types';

/**
 * Anderson Acceleration (Type I)
 *
 * Uses m previous iterates to compute an improved approximation.
 * At each step, minimizes ||F_k - sum(alpha_i * F_{k-i})|| where F_k = g(x_k) - x_k
 *
 * The key idea is to extrapolate from the residual history to accelerate convergence.
 */
export function andersonAcceleration(
  g: FixedPointFunction,
  x0: number,
  config: AndersonConfig
): IterationResult {
  const { tolerance, maxIterations, memory } = config;
  const steps: IterationStep[] = [];

  // History storage
  const xHistory: number[] = [];
  const fHistory: number[] = [];  // f(x) = g(x) - x (residuals)
  const gHistory: number[] = [];  // g(x) values

  let x = x0;
  let converged = false;

  for (let iter = 0; iter < maxIterations; iter++) {
    const gx = g(x);
    const fx = gx - x;  // Residual
    const residual = Math.abs(fx);

    steps.push({
      iteration: iter,
      x,
      fx: gx,
      residual
    });

    if (residual < tolerance) {
      converged = true;
      break;
    }

    // Store in history
    xHistory.push(x);
    fHistory.push(fx);
    gHistory.push(gx);

    // Number of previous iterates to use
    const m_k = Math.min(memory, iter);

    if (m_k === 0) {
      // First iteration: standard fixed-point step
      x = gx;
    } else {
      // Anderson acceleration step
      x = computeAndersonStep(xHistory, fHistory, gHistory, m_k);
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

/**
 * Compute the Anderson acceleration step using least squares
 */
function computeAndersonStep(
  xHistory: number[],
  fHistory: number[],
  gHistory: number[],
  m_k: number
): number {
  const n = xHistory.length;

  // Build the matrix of residual differences
  // ΔF_j = f_{n-1} - f_{n-1-j} for j = 1, ..., m_k
  const deltaF: number[] = [];
  const deltaG: number[] = [];

  for (let j = 1; j <= m_k; j++) {
    deltaF.push(fHistory[n - 1] - fHistory[n - 1 - j]);
    deltaG.push(gHistory[n - 1] - gHistory[n - 1 - j]);
  }

  // Solve the least squares problem: minimize ||f_n - sum(alpha_j * ΔF_j)||^2
  // For 1D, this simplifies significantly

  if (m_k === 1) {
    // Simple case: one coefficient
    const dF = deltaF[0];
    const f_n = fHistory[n - 1];

    // alpha = (f_n * dF) / (dF * dF)
    const denom = dF * dF;
    if (Math.abs(denom) < 1e-14) {
      // Fallback to standard iteration
      return gHistory[n - 1];
    }

    const alpha = (f_n * dF) / denom;

    // x_new = g_n - alpha * ΔG
    return gHistory[n - 1] - alpha * deltaG[0];
  } else {
    // General case: solve the normal equations
    // (ΔF^T ΔF) α = ΔF^T f_n

    // Build the Gram matrix (m_k x m_k)
    const gram: number[][] = [];
    for (let i = 0; i < m_k; i++) {
      gram[i] = [];
      for (let j = 0; j < m_k; j++) {
        gram[i][j] = deltaF[i] * deltaF[j];
      }
    }

    // Build the right-hand side
    const f_n = fHistory[n - 1];
    const rhs: number[] = [];
    for (let i = 0; i < m_k; i++) {
      rhs[i] = deltaF[i] * f_n;
    }

    // Solve using regularized pseudo-inverse (add small regularization for stability)
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
    let xNew = gHistory[n - 1];
    for (let j = 0; j < m_k; j++) {
      xNew -= alpha[j] * deltaG[j];
    }

    return xNew;
  }
}

/**
 * Solve a small linear system Ax = b using Gaussian elimination with partial pivoting
 */
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
