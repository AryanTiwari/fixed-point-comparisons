import type {
  IterationResult,
  IterationStep,
  AlgorithmConfig,
  FixedPointFunction,
  DerivativeFunction
} from './types';

/**
 * Newton-Raphson Method
 *
 * For finding roots of f(x) = 0:
 *   x_{n+1} = x_n - f(x_n) / f'(x_n)
 *
 * For fixed-point problems where we want g(x) = x:
 *   Define f(x) = g(x) - x
 *   Then f'(x) = g'(x) - 1
 *   x_{n+1} = x_n - (g(x_n) - x_n) / (g'(x_n) - 1)
 *
 * Achieves quadratic convergence near the root.
 */
export function newtonMethod(
  f: FixedPointFunction,   // f(x) = g(x) - x, we want f(x) = 0
  df: DerivativeFunction,  // f'(x) = g'(x) - 1
  x0: number,
  config: AlgorithmConfig,
  g?: FixedPointFunction   // Optional g for display purposes
): IterationResult {
  const { tolerance, maxIterations } = config;
  const steps: IterationStep[] = [];

  let x = x0;
  let converged = false;

  for (let iter = 0; iter < maxIterations; iter++) {
    const fx = f(x);
    const dfx = df(x);
    const residual = Math.abs(fx);

    steps.push({
      iteration: iter,
      x,
      fx: g ? g(x) : x - fx,  // Store g(x) if available, otherwise x - f(x)
      residual
    });

    if (residual < tolerance) {
      converged = true;
      break;
    }

    // Check for zero derivative
    if (Math.abs(dfx) < 1e-14) {
      // Can't continue - derivative is zero
      break;
    }

    // Newton step
    x = x - fx / dfx;
  }

  return {
    steps,
    converged,
    finalX: steps[steps.length - 1]?.x ?? x0,
    totalIterations: steps.length
  };
}
