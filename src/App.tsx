import { useState, useCallback } from 'react';
import { GraphGrid, ControlPanel, MetricsPanel, Formula } from './components';
import { useIterationRunner } from './hooks/useIterationRunner';
import { EXAMPLE_FUNCTIONS } from './functions/examples';
import { FORMULAS } from './constants/formulas';
import { useTheme } from './contexts/ThemeContext';
import type { AlgorithmType, ExampleFunction } from './algorithms/types';

function App() {
  const { theme, toggleTheme } = useTheme();

  // State for configuration
  const [selectedFunction, setSelectedFunction] = useState<ExampleFunction>(EXAMPLE_FUNCTIONS[0]);
  const [x0, setX0] = useState(selectedFunction.defaultX0);
  const [tolerance, setTolerance] = useState(1e-8);
  const [maxIterations, setMaxIterations] = useState(100);
  const [andersonMemory, setAndersonMemory] = useState(3);
  const [enabledAlgorithms, setEnabledAlgorithms] = useState<Set<AlgorithmType>>(
    new Set(['fixed-point', 'anderson', 'steffensen', 'newton'])
  );

  // Iteration runner hook
  const runner = useIterationRunner({
    func: selectedFunction,
    x0,
    tolerance,
    maxIterations,
    andersonMemory,
    enabledAlgorithms
  });

  // Handlers
  const handleFunctionChange = useCallback((func: ExampleFunction) => {
    setSelectedFunction(func);
    setX0(func.defaultX0);
    runner.reset();
  }, [runner]);

  const handleX0Change = useCallback((newX0: number) => {
    setX0(newX0);
  }, []);

  const handleToggleAlgorithm = useCallback((algo: AlgorithmType) => {
    setEnabledAlgorithms(prev => {
      const next = new Set(prev);
      if (next.has(algo)) {
        next.delete(algo);
      } else {
        next.add(algo);
      }
      return next;
    });
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${isDark ? 'bg-[#0a0a0f] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'}`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'}`} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className={`text-4xl font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-white via-purple-200 to-purple-400' : 'from-slate-800 via-purple-600 to-purple-800'}`}>
              Anderson Acceleration Visualizer
            </h1>
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Compare fixed-point iteration methods: Standard, Anderson Acceleration,
              Steffensen's method, and Newton-Raphson
            </p>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition-all duration-200 ${
              isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white'
                : 'bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 shadow-sm'
            }`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </header>

        {/* Function Info */}
        <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Function:</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>g(x) = {selectedFunction.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-purple-500 rounded"></div>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>g(x) curve</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-500 border-t border-dashed border-gray-500"></div>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>y = x line</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Fixed point x*</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Starting point x₀</span>
            </div>
          </div>
        </div>

        {/* Main Content: Graphs + Controls */}
        <div className="flex gap-6">
          {/* 2x2 Graph Grid */}
          <div className="flex-1">
            <GraphGrid
              func={selectedFunction}
              results={runner.results}
              currentStep={runner.animation.currentStep}
              enabledAlgorithms={enabledAlgorithms}
              x0={x0}
              isDark={isDark}
            />
          </div>

          {/* Controls Panel - Right Side */}
          <div className="w-80 flex-shrink-0">
            <ControlPanel
              selectedFunction={selectedFunction}
              onFunctionChange={handleFunctionChange}
              x0={x0}
              onX0Change={handleX0Change}
              tolerance={tolerance}
              onToleranceChange={setTolerance}
              maxIterations={maxIterations}
              onMaxIterationsChange={setMaxIterations}
              andersonMemory={andersonMemory}
              onAndersonMemoryChange={setAndersonMemory}
              enabledAlgorithms={enabledAlgorithms}
              onToggleAlgorithm={handleToggleAlgorithm}
              animationSpeed={runner.animation.speed}
              onSpeedChange={runner.setSpeed}
              isPlaying={runner.animation.isPlaying}
              currentStep={runner.animation.currentStep}
              maxSteps={runner.maxSteps}
              onRun={runner.runAll}
              onReset={runner.reset}
              onPlay={runner.play}
              onPause={runner.pause}
              onStepForward={runner.stepForward}
              onStepBackward={runner.stepBackward}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Metrics Panel - Below Graphs */}
        <div className="mt-6">
          <MetricsPanel
            results={runner.results}
            enabledAlgorithms={enabledAlgorithms}
            currentStep={runner.animation.currentStep}
            fixedPoint={selectedFunction.fixedPoint}
            isDark={isDark}
          />
        </div>

        {/* Algorithm Formula Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AlgorithmCard
            title="Fixed-Point"
            color="#ef4444"
            formula={FORMULAS['fixed-point'].iteration}
            description="Standard fixed-point iteration. Linear convergence when |g'(x*)| < 1."
            isDark={isDark}
          />
          <AlgorithmCard
            title="Anderson Acceleration"
            color="#22c55e"
            formula={FORMULAS['anderson'].iteration}
            description="Uses m previous iterates to extrapolate, achieving faster convergence."
            isDark={isDark}
          />
          <AlgorithmCard
            title="Steffensen's Method"
            color="#3b82f6"
            formula={FORMULAS['steffensen'].short || FORMULAS['steffensen'].iteration}
            description="Aitken's delta-squared acceleration. Quadratic convergence without derivatives."
            isDark={isDark}
          />
          <AlgorithmCard
            title="Newton-Raphson"
            color="#f59e0b"
            formula={FORMULAS['newton'].iteration}
            description="Uses derivative information for quadratic convergence near roots."
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
}

interface AlgorithmCardProps {
  title: string;
  color: string;
  formula: string;
  description: string;
  isDark: boolean;
}

function AlgorithmCard({ title, color, formula, description, isDark }: AlgorithmCardProps) {
  return (
    <div className={`group relative rounded-xl overflow-hidden backdrop-blur-sm border p-5 transition-all duration-300 ${
      isDark
        ? 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
        : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 shadow-sm'
    }`}>
      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, ${color}10, transparent 70%)`
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}40`
            }}
          />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        </div>

        {/* LaTeX Formula */}
        <div className={`rounded-lg p-3 mb-3 overflow-x-auto ${isDark ? 'bg-black/30' : 'bg-slate-100'}`}>
          <Formula math={formula} />
        </div>

        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
      </div>
    </div>
  );
}

export default App;
