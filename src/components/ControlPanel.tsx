import { ALGORITHMS } from '../algorithms/types';
import type { ExampleFunction, AlgorithmType } from '../algorithms/types';
import { EXAMPLE_FUNCTIONS } from '../functions/examples';

interface ControlPanelProps {
  selectedFunction: ExampleFunction;
  onFunctionChange: (func: ExampleFunction) => void;
  x0: number;
  onX0Change: (x0: number) => void;
  tolerance: number;
  onToleranceChange: (tol: number) => void;
  maxIterations: number;
  onMaxIterationsChange: (max: number) => void;
  andersonMemory: number;
  onAndersonMemoryChange: (m: number) => void;
  enabledAlgorithms: Set<AlgorithmType>;
  onToggleAlgorithm: (algo: AlgorithmType) => void;
  animationSpeed: number;
  onSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  currentStep: number;
  maxSteps: number;
  onRun: () => void;
  onReset: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  isDark: boolean;
}

export function ControlPanel({
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
  animationSpeed,
  onSpeedChange,
  isPlaying,
  currentStep,
  maxSteps,
  onRun,
  onReset,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  isDark
}: ControlPanelProps) {
  return (
    <div className={`rounded-2xl backdrop-blur-sm border p-6 space-y-5 ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'
    }`}>
      <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Controls
      </h2>

      {/* Function Selection */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Function</label>
        <select
          value={selectedFunction.id}
          onChange={(e) => {
            const func = EXAMPLE_FUNCTIONS.find(f => f.id === e.target.value);
            if (func) onFunctionChange(func);
          }}
          className={`w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all cursor-pointer ${
            isDark
              ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50'
          }`}
        >
          {EXAMPLE_FUNCTIONS.map(f => (
            <option key={f.id} value={f.id} className={isDark ? 'bg-slate-900' : 'bg-white'}>
              x = {f.name}
            </option>
          ))}
        </select>
        <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{selectedFunction.description}</p>
      </div>

      {/* Starting Point */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Starting Point (x<sub>0</sub>): <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{x0.toFixed(3)}</span>
        </label>
        <input
          type="range"
          min={selectedFunction.domain[0]}
          max={selectedFunction.domain[1]}
          step={0.01}
          value={x0}
          onChange={(e) => onX0Change(parseFloat(e.target.value))}
          className="w-full slider"
        />
        <div className={`flex justify-between text-xs mt-1 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>{selectedFunction.domain[0]}</span>
          <span>{selectedFunction.domain[1]}</span>
        </div>
      </div>

      {/* Anderson Memory */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Anderson Memory (m): <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{andersonMemory}</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={andersonMemory}
          onChange={(e) => onAndersonMemoryChange(parseInt(e.target.value))}
          className="w-full slider"
        />
        <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span className="font-mono">1</span>
          <span className={`${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Previous iterates for acceleration</span>
          <span className="font-mono">10</span>
        </div>
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
        <div className="grid grid-cols-2 gap-2">
          {ALGORITHMS.map(algo => (
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

      {/* Animation Speed */}
      <div>
        <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Animation Speed: <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{animationSpeed}ms</span>
        </label>
        <input
          type="range"
          min={50}
          max={1000}
          step={50}
          value={animationSpeed}
          onChange={(e) => onSpeedChange(parseInt(e.target.value))}
          className="w-full slider"
        />
        <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span className="font-mono">50ms</span>
          <span>faster ← → slower</span>
          <span className="font-mono">1000ms</span>
        </div>
      </div>

      {/* Run/Reset Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onRun}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200 hover:-translate-y-0.5"
        >
          Run
        </button>
        <button
          onClick={onReset}
          className={`flex-1 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 ${
            isDark
              ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white'
              : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
          }`}
        >
          Reset
        </button>
      </div>

      {/* Playback Controls */}
      {maxSteps > 0 && (
        <div className={`space-y-3 pt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between text-sm">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Step</span>
            <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentStep + 1} / {maxSteps}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onStepBackward}
              disabled={currentStep === 0}
              className={`flex-1 font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
                  : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <button
              onClick={isPlaying ? onPause : onPlay}
              disabled={currentStep >= maxSteps - 1 && !isPlaying}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-lg shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1"
            >
              {isPlaying ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </>
              )}
            </button>
            <button
              onClick={onStepForward}
              disabled={currentStep >= maxSteps - 1}
              className={`flex-1 font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
                  : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
