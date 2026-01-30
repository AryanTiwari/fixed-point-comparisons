export const FORMULAS = {
  'fixed-point': {
    name: 'Fixed-Point Iteration',
    iteration: 'x_{n+1} = g(x_n)',
    convergence: '|g\'(x^*)| < 1'
  },
  'anderson': {
    name: 'Anderson Acceleration',
    iteration: 'x_{n+1} = \\sum_{j=0}^{m} \\alpha_j g(x_{n-m+j})',
    short: 'x_{n+1} = \\sum \\alpha_j g(x_j)'
  },
  'steffensen': {
    name: "Steffensen's Method",
    iteration: 'x_{n+1} = x_n - \\frac{(g(x_n) - x_n)^2}{g(g(x_n)) - 2g(x_n) + x_n}',
    short: 'x_{n+1} = x_n - \\frac{\\Delta x^2}{\\Delta^2 x}'
  },
  'newton': {
    name: 'Newton-Raphson',
    iteration: "x_{n+1} = x_n - \\frac{f(x_n)}{f'(x_n)}",
    convergence: 'O(h^2)'
  }
} as const;

export type FormulaKey = keyof typeof FORMULAS;
