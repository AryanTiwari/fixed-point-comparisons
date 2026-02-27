import type { IterationResult, IterationStep, AlgorithmConfig, FixedPointFunction } from './types';

/**
 * Steffensen's Method
 *
 * Combines fixed-point iteration with Aitken's Δ² acceleration.
 * Achieves quadratic convergence (like Newton's method) without requiring derivatives.
 *
 * Given x_n, computes:
 *   x_{n+1} = g(x_n)
 *   x_{n+2} = g(x_{n+1})
 *   x_{n+3} = x_n - (x_{n+1} - x_n)² / (x_{n+2} - 2*x_{n+1} + x_n)  (Aitken's formula)
 */
export function steffensenMethod(
  g: FixedPointFunction,
  x0: number,
  config: AlgorithmConfig
): IterationResult {
  const { tolerance, maxIterations } = config;
  const steps: IterationStep[] = [];

  let x = x0;
  let converged = false;
  let iter = 0;

  while (iter < maxIterations) {
    const x1 = g(x);
    const residual0 = Math.abs(x1 - x);

    steps.push({
      iteration: iter,
      x,
      fx: x1,
      residual: residual0
    });

    if (residual0 < tolerance) {
      converged = true;
      break;
    }

    const x2 = g(x1);

    // Aitken's Δ² acceleration
    const denom = x2 - 2 * x1 + x;

    if (Math.abs(denom) < 1e-14) {
      // Denominator too small, fall back to standard step
      x = x1;
    } else {
      // Aitken's extrapolation
      const dx = x1 - x;
      x = x - (dx * dx) / denom;
    }

    iter++;
  }

  // Final check
  if (!converged && steps.length > 0) {
    const lastX = steps[steps.length - 1].x;
    const finalFx = g(lastX);
    if (Math.abs(finalFx - lastX) < tolerance) {
      converged = true;
    }
  }

  return {
    steps,
    converged,
    finalX: steps[steps.length - 1]?.x ?? x0,
    totalIterations: steps.length
  };
}
