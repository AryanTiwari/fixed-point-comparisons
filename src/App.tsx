import { useState, useCallback } from 'react';
import { GraphGrid, ControlPanel, ControlPanel2D, MetricsPanel, MetricsPanel2D, Formula, TrajectoryPlot2D } from './components';
import type { ViewBox2D } from './components';
import { useIterationRunner } from './hooks/useIterationRunner';
import { useIterationRunner2D } from './hooks/useIterationRunner2D';
import { EXAMPLE_FUNCTIONS } from './functions/examples';
import { EXAMPLE_FUNCTIONS_2D } from './functions/examples2d';
import { FORMULAS } from './constants/formulas';
import { useTheme } from './contexts/ThemeContext';
import type { AlgorithmType, ExampleFunction, ExampleFunction2D } from './algorithms/types';

type Mode = '1d' | '2d';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>('1d');

  // 1D State
  const [selectedFunction, setSelectedFunction] = useState<ExampleFunction>(EXAMPLE_FUNCTIONS[0]);
  const [x0, setX0] = useState(selectedFunction.defaultX0);

  // 2D State
  const [selectedFunction2D, setSelectedFunction2D] = useState<ExampleFunction2D>(EXAMPLE_FUNCTIONS_2D[0]);

  // Shared State
  const [tolerance, setTolerance] = useState(1e-8);
  const [maxIterations, setMaxIterations] = useState(100);
  const [andersonMemory, setAndersonMemory] = useState(3);
  const [enabledAlgorithms, setEnabledAlgorithms] = useState<Set<AlgorithmType>>(
    new Set(['fixed-point', 'anderson', 'steffensen', 'newton'])
  );

  // 2D ViewBox state for pan/zoom
  const [viewBox2D, setViewBox2D] = useState<ViewBox2D>({
    x: selectedFunction2D.domain.x,
    y: selectedFunction2D.domain.y
  });

  // 1D Iteration runner hook
  const runner = useIterationRunner({
    func: selectedFunction,
    x0,
    tolerance,
    maxIterations,
    andersonMemory,
    enabledAlgorithms
  });

  // 2D Iteration runner hook
  const runner2D = useIterationRunner2D({
    func: selectedFunction2D,
    tolerance,
    maxIterations,
    andersonMemory,
    enabledAlgorithms
  });

  // 1D Handlers
  const handleFunctionChange = useCallback((func: ExampleFunction) => {
    setSelectedFunction(func);
    setX0(func.defaultX0);
    runner.reset();
  }, [runner]);

  const handleX0Change = useCallback((newX0: number) => {
    setX0(newX0);
  }, []);

  // 2D Handlers
  const handleFunction2DChange = useCallback((func: ExampleFunction2D) => {
    setSelectedFunction2D(func);
    setViewBox2D({ x: func.domain.x, y: func.domain.y });
    runner2D.reset();
    runner2D.setX0(func.defaultX0);
  }, [runner2D]);

  // Shared Handlers
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

  // 2D Pan/Zoom handlers
  const handlePan2D = useCallback((dx: number, dy: number) => {
    setViewBox2D(prev => ({
      x: [prev.x[0] + dx, prev.x[1] + dx],
      y: [prev.y[0] + dy, prev.y[1] + dy]
    }));
  }, []);

  const handleZoom2D = useCallback((zoomIn: boolean, centerX: number, centerY: number) => {
    setViewBox2D(prev => {
      const factor = zoomIn ? 0.8 : 1.25;
      const newXRange = (prev.x[1] - prev.x[0]) * factor;
      const newYRange = (prev.y[1] - prev.y[0]) * factor;

      const xRatio = (centerX - prev.x[0]) / (prev.x[1] - prev.x[0]);
      const yRatio = (centerY - prev.y[0]) / (prev.y[1] - prev.y[0]);

      return {
        x: [centerX - xRatio * newXRange, centerX + (1 - xRatio) * newXRange],
        y: [centerY - yRatio * newYRange, centerY + (1 - yRatio) * newYRange]
      };
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

          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className={`flex rounded-xl border overflow-hidden ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <button
                onClick={() => setMode('1d')}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  mode === '1d'
                    ? isDark
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-purple-100 text-purple-700'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                1D Functions
              </button>
              <button
                onClick={() => setMode('2d')}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  mode === '2d'
                    ? isDark
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-purple-100 text-purple-700'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                2D Systems
              </button>
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
          </div>
        </header>

        {mode === '1d' ? (
          // 1D Mode
          <>
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
          </>
        ) : (
          // 2D Mode
          <>
            {/* 2D Function Info */}
            <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>System:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedFunction2D.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Fixed point</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Starting point</span>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full text-xs ${isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                  Watch how memory affects trajectory shape!
                </div>
              </div>
            </div>

            {/* Main Content: Trajectory Plot + Controls */}
            <div className="flex gap-6">
              {/* Trajectory Plot */}
              <div className="flex-1">
                <TrajectoryPlot2D
                  func={selectedFunction2D}
                  results={runner2D.results}
                  currentStep={runner2D.animation.currentStep}
                  enabledAlgorithms={enabledAlgorithms}
                  viewBox={viewBox2D}
                  onPan={handlePan2D}
                  onZoom={handleZoom2D}
                  isDark={isDark}
                />
              </div>

              {/* Controls Panel - Right Side */}
              <div className="w-80 flex-shrink-0">
                <ControlPanel2D
                  selectedFunction={selectedFunction2D}
                  onFunctionChange={handleFunction2DChange}
                  x0={runner2D.x0}
                  onX0Change={runner2D.setX0}
                  tolerance={tolerance}
                  onToleranceChange={setTolerance}
                  maxIterations={maxIterations}
                  onMaxIterationsChange={setMaxIterations}
                  andersonMemory={andersonMemory}
                  onAndersonMemoryChange={setAndersonMemory}
                  enabledAlgorithms={enabledAlgorithms}
                  onToggleAlgorithm={handleToggleAlgorithm}
                  animationSpeed={runner2D.animation.speed}
                  onSpeedChange={runner2D.setSpeed}
                  isPlaying={runner2D.animation.isPlaying}
                  currentStep={runner2D.animation.currentStep}
                  maxSteps={runner2D.maxSteps}
                  onRun={runner2D.runAll}
                  onReset={runner2D.reset}
                  onPlay={runner2D.play}
                  onPause={runner2D.pause}
                  onStepForward={runner2D.stepForward}
                  onStepBackward={runner2D.stepBackward}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* 2D Metrics Panel - Below Graph */}
            <div className="mt-6">
              <MetricsPanel2D
                results={runner2D.results}
                enabledAlgorithms={enabledAlgorithms}
                currentStep={runner2D.animation.currentStep}
                fixedPoint={selectedFunction2D.fixedPoint}
                isDark={isDark}
              />
            </div>

            {/* 2D Explanation */}
            <div className={`mt-8 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Why Anderson Memory Matters in 2D
              </h3>
              <div className={`text-sm leading-relaxed space-y-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <p>
                  In 1D problems, residuals are scalars, so all previous residuals are collinear - there's only one direction.
                  Memory m=1 captures the full benefit of Anderson acceleration.
                </p>
                <p>
                  In 2D (and higher dimensions), residuals are vectors that can point in different directions.
                  With m=1, Anderson can only extrapolate along one direction. With m=2, it can combine information
                  from two different residual directions to find a better path to the solution.
                </p>
                <p className={isDark ? 'text-green-400' : 'text-green-600'}>
                  <strong>Try it:</strong> Run the "Spiral Contraction" function with m=1 vs m=2. Watch how m=2
                  takes more direct paths to the fixed point by combining horizontal and vertical corrections!
                </p>
              </div>
            </div>
          </>
        )}
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
