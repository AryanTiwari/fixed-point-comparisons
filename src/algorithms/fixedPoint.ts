import type { IterationResult, IterationStep, AlgorithmConfig, FixedPointFunction } from './types';

/**
 * Standard Fixed-Point Iteration
 * x_{n+1} = g(x_n)
 *
 * Converges when |g'(x*)| < 1 near the fixed point x*
 */
export function fixedPointIteration(
  g: FixedPointFunction,
  x0: number,
  config: AlgorithmConfig
): IterationResult {
  const { tolerance, maxIterations } = config;
  const steps: IterationStep[] = [];

  let x = x0;
  let converged = false;

  for (let i = 0; i < maxIterations; i++) {
    const fx = g(x);
    const residual = Math.abs(fx - x);

    steps.push({
      iteration: i,
      x,
      fx,
      residual
    });

    if (residual < tolerance) {
      converged = true;
      break;
    }

    x = fx;
  }

  return {
    steps,
    converged,
    finalX: steps[steps.length - 1]?.x ?? x0,
    totalIterations: steps.length
  };
}
