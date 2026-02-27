# Anderson Acceleration Visualizer

An interactive React web application for visualizing and comparing fixed-point iteration methods, with a focus on Anderson Acceleration.

## Overview

This tool helps users understand how different fixed-point iteration algorithms converge to solutions, providing real-time visualization of the iteration process and comparative metrics between methods.

## Features

### Interactive Visualization
- **Real-time iteration display**: Watch algorithms converge step-by-step on an interactive graph
- **Staircase diagram**: Classic fixed-point visualization showing the path from x_n to g(x_n) to x_{n+1}
- **Draggable starting point**: Click and drag to change the initial guess x_0 directly on the graph
- **Color-coded paths**: Each algorithm has a distinct color for easy comparison

### Algorithm Comparison
Four iteration methods are implemented:

| Algorithm | Color | Convergence | Description |
|-----------|-------|-------------|-------------|
| Fixed-Point | Red | Linear | Standard iteration: x_{n+1} = g(x_n) |
| Anderson Acceleration | Green | Superlinear | Uses history of m previous iterates to extrapolate |
| Steffensen's Method | Blue | Quadratic | Aitken's delta-squared acceleration |
| Newton-Raphson | Amber | Quadratic | Uses derivative information |

### Configurable Parameters
- **Function selection**: Choose from 8 preset example functions
- **Starting point (x_0)**: Adjustable via slider or graph interaction
- **Anderson memory (m)**: Control how many previous iterates Anderson uses (1-10)
- **Tolerance**: Set convergence threshold (10^-3 to 10^-12)
- **Max iterations**: Limit iteration count (10-200)
- **Animation speed**: Control playback speed (50-1000ms per step)

### Metrics Dashboard
- **Iteration count**: Total iterations to convergence for each method
- **Speedup percentage**: Improvement over baseline fixed-point iteration
- **Convergence status**: Whether each method converged within tolerance
- **Current values**: Real-time display of each algorithm's current iterate
- **Residual chart**: Log-scale plot of |g(x) - x| over iterations

### Playback Controls
- **Run**: Execute all enabled algorithms
- **Play/Pause**: Animate through iterations automatically
- **Step Forward/Backward**: Move through iterations one at a time
- **Reset**: Clear results and start fresh

## Example Functions

| Function | Fixed Point | Description |
|----------|-------------|-------------|
| cos(x) | 0.739... (Dottie number) | Classic example, slow convergence |
| (x + 2/x) / 2 | sqrt(2) | Babylonian method, fast convergence |
| exp(-x) | 0.567... (Omega constant) | Exponential decay |
| 1 + 0.5*sin(x) | ~1.499 | Oscillatory convergence |
| (x^3 + 1) / 3 | ~0.682 | Cubic iteration |
| ln(x + 2) | ~1.146 | Logarithmic |
| arctan(x) + x/2 | 0 | Arctangent with linear term |
| 0.9x + 0.1 | 1 | Very slow linear convergence |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool and dev server |
| **Mafs** | Mathematical visualization library |
| **Tailwind CSS v4** | Utility-first styling |

## How It Works

### Fixed-Point Iteration
The standard method repeatedly applies g(x):
```
x_{n+1} = g(x_n)
```
Converges when |g'(x*)| < 1 near the fixed point.

### Anderson Acceleration
Uses the last m iterates to find a better approximation by minimizing the residual:
```
x_{new} = g(x_n) - sum(alpha_j * (g(x_{n-j}) - g(x_n)))
```
where coefficients alpha_j are computed via least squares to minimize ||f_n - sum(alpha_j * delta_f_j)||^2.

### Steffensen's Method
Applies Aitken's delta-squared acceleration to fixed-point iteration:
```
x_{n+1} = x_n - (g(x_n) - x_n)^2 / (g(g(x_n)) - 2*g(x_n) + x_n)
```
Achieves quadratic convergence without requiring derivatives.

### Newton-Raphson
For f(x) = g(x) - x = 0:
```
x_{n+1} = x_n - f(x_n) / f'(x_n)
```
Requires the derivative but converges quadratically near the root.

## Project Structure

```
anderson comparison/
├── src/
│   ├── algorithms/
│   │   ├── types.ts          # Type definitions
│   │   ├── fixedPoint.ts     # Standard fixed-point iteration
│   │   ├── anderson.ts       # Anderson acceleration
│   │   ├── steffensen.ts     # Steffensen's method
│   │   ├── newton.ts         # Newton-Raphson method
│   │   └── index.ts          # Exports
│   ├── components/
│   │   ├── IterationGraph.tsx   # Mafs visualization
│   │   ├── ControlPanel.tsx     # Settings and controls
│   │   ├── MetricsPanel.tsx     # Results and charts
│   │   └── index.ts
│   ├── functions/
│   │   └── examples.ts       # Preset test functions
│   ├── hooks/
│   │   └── useIterationRunner.ts  # Animation and execution logic
│   ├── App.tsx               # Main application
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+

### Installation
```bash
cd "anderson comparison"
npm install
```

### Development
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

### Production Build
```bash
npm run build
npm run preview
```

## Usage Guide

1. **Select a function** from the dropdown to explore different convergence behaviors
2. **Adjust the starting point** using the slider or by dragging on the graph
3. **Configure Anderson memory** to see how history depth affects acceleration
4. **Toggle algorithms** on/off to compare specific methods
5. **Click Run** to execute all enabled algorithms
6. **Use Play** to animate through iterations, or step manually
7. **Observe the metrics** panel for iteration counts, speedup percentages, and residual convergence

## References

- Anderson, D.G. (1965). "Iterative Procedures for Nonlinear Integral Equations". *Journal of the ACM*.
- Walker, H.F. & Ni, P. (2011). "Anderson Acceleration for Fixed-Point Iterations". *SIAM Journal on Numerical Analysis*.
- Steffensen, J.F. (1933). "Remarks on iteration". *Skandinavisk Aktuarietidskrift*.

## License

MIT
