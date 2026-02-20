import { ALGORITHMS } from '../algorithms/types';
import type { ExampleFunction2D, AlgorithmType, Point2D } from '../algorithms/types';

// Steffensen's method doesn't generalize well to 2D (Aitken's delta-squared is for scalar sequences)
const ALGORITHMS_2D = ALGORITHMS.filter(a => a.id !== 'steffensen');
import { EXAMPLE_FUNCTIONS_2D } from '../functions/examples2d';

interface ControlPanel2DProps {
  selectedFunction: ExampleFunction2D;
  onFunctionChange: (func: ExampleFunction2D) => void;
  x0: Point2D;
  onX0Change: (x0: Point2D) => void;
  tolerance: number;
  onToleranceChange: (tol: number) => void;
  maxIterations: number;
  onMaxIterationsChange: (max: number) => void;
  andersonMemory: number;
  onAndersonMemoryChange: (m: number) => void;
  enabledAlgorithms: Set<AlgorithmType>;
  onToggleAlgorithm: (algo: AlgorithmType) => void;
  isDark: boolean;
}

export function ControlPanel2D({
  selectedFunction,
  onFunctionChange,
  x0,
  onX0Change,
  tolerance,
  onToleranceChange,
  maxIterations,
  onMaxIterationsChange,
  andersonMemory,
  onAndersonMemoryChange,
  enabledAlgorithms,
  onToggleAlgorithm,
  isDark
}: ControlPanel2DProps) {
  return (
    <div className={`rounded-2xl backdrop-blur-sm border p-6 space-y-5 ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'
    }`}>
      <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        2D Controls
      </h2>

      {/* Function Selection */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Function</label>
        <select
          value={selectedFunction.id}
          onChange={(e) => {
            const func = EXAMPLE_FUNCTIONS_2D.find(f => f.id === e.target.value);
            if (func) onFunctionChange(func);
          }}
          className={`w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all cursor-pointer ${
            isDark
              ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50'
          }`}
        >
          {EXAMPLE_FUNCTIONS_2D.map(f => (
            <option key={f.id} value={f.id} className={isDark ? 'bg-slate-900' : 'bg-white'}>
              {f.name}
            </option>
          ))}
        </select>
        <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{selectedFunction.description}</p>
      </div>

      {/* Starting Point X */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Starting X: <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{x0[0].toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={selectedFunction.domain.x[0]}
          max={selectedFunction.domain.x[1]}
          step={0.05}
          value={x0[0]}
          onChange={(e) => onX0Change([parseFloat(e.target.value), x0[1]])}
          className="w-full slider"
        />
        <div className={`flex justify-between text-xs mt-1 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>{selectedFunction.domain.x[0]}</span>
          <span>{selectedFunction.domain.x[1]}</span>
        </div>
      </div>

      {/* Starting Point Y */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Starting Y: <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{x0[1].toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={selectedFunction.domain.y[0]}
          max={selectedFunction.domain.y[1]}
          step={0.05}
          value={x0[1]}
          onChange={(e) => onX0Change([x0[0], parseFloat(e.target.value)])}
          className="w-full slider"
        />
        <div className={`flex justify-between text-xs mt-1 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>{selectedFunction.domain.y[0]}</span>
          <span>{selectedFunction.domain.y[1]}</span>
        </div>
      </div>

      {/* Anderson Memory - EMPHASIZED for 2D */}
      <div className={`p-3 rounded-lg border ${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
          Anderson Memory (m): <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{andersonMemory}</span>
        </label>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={andersonMemory}
          onChange={(e) => onAndersonMemoryChange(parseInt(e.target.value))}
          className="w-full slider"
        />
        <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span className="font-mono">0</span>
          <span className="font-mono">3</span>
        </div>
        <p className={`text-xs mt-2 ${isDark ? 'text-green-400/80' : 'text-green-600'}`}>
          In 2D, memory &gt; 1 allows combining residual directions for faster convergence!
        </p>
      </div>

      {/* Tolerance */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Tolerance: <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>10<sup>{Math.log10(tolerance).toFixed(0)}</sup></span>
        </label>
        <input
          type="range"
          min={-12}
          max={-3}
          step={1}
          value={Math.log10(tolerance)}
          onChange={(e) => onToleranceChange(Math.pow(10, parseInt(e.target.value)))}
          className="w-full slider"
        />
        <div className={`flex justify-between text-xs mt-1 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>10<sup>-12</sup></span>
          <span>10<sup>-3</sup></span>
        </div>
      </div>

      {/* Max Iterations */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Max Iterations: <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{maxIterations}</span>
        </label>
        <input
          type="range"
          min={10}
          max={100}
          step={10}
          value={maxIterations}
          onChange={(e) => onMaxIterationsChange(parseInt(e.target.value))}
          className="w-full slider"
        />
        <div className={`flex justify-between text-xs mt-1 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>10</span>
          <span>100</span>
        </div>
      </div>

      {/* Algorithm Selection */}
      <div>
        <label className={`block text-sm mb-3 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Algorithms</label>
        <div className="grid grid-cols-1 gap-2">
          {ALGORITHMS_2D.map(algo => (
            <label
              key={algo.id}
              className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border transition-all ${
                enabledAlgorithms.has(algo.id)
                  ? isDark
                    ? 'bg-white/10 border-white/20'
                    : 'bg-slate-100 border-slate-300'
                  : isDark
                    ? 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'
                    : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
              }`}
            >
              <input
                type="checkbox"
                checked={enabledAlgorithms.has(algo.id)}
                onChange={() => onToggleAlgorithm(algo.id)}
                className="sr-only"
              />
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: algo.color,
                  boxShadow: enabledAlgorithms.has(algo.id) ? `0 0 8px ${algo.color}60` : 'none'
                }}
              />
              <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{algo.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
