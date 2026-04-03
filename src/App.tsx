import { useState, useCallback, useRef, useEffect } from "react";
import {
  MetricsPanel,
  MetricsPanel2D,
  Formula,
  TrajectoryPlot2D,
  AnimationControls,
  UnifiedGraph1D,
} from "./components";
import type { ViewBox2D, ViewBox } from "./components";
import { useIterationRunner } from "./hooks/useIterationRunner";
import { useIterationRunner2D } from "./hooks/useIterationRunner2D";
import { EXAMPLE_FUNCTIONS } from "./functions/examples";
import { EXAMPLE_FUNCTIONS_2D } from "./functions/examples2d";
import { FORMULAS } from "./constants/formulas";
import { useTheme } from "./contexts/ThemeContext";
import { ALGORITHMS } from "./algorithms/types";
import type {
  AlgorithmType,
  ExampleFunction,
  ExampleFunction2D,
} from "./algorithms/types";

type Mode = "1d" | "2d";

// Custom dropdown component for function selection with LaTeX
interface FunctionDropdownProps {
  functions: ExampleFunction[];
  selected: ExampleFunction;
  onSelect: (func: ExampleFunction) => void;
  isDark: boolean;
}

function FunctionDropdown({
  functions,
  selected,
  onSelect,
  isDark,
}: FunctionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-lg px-3 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer flex items-center justify-between ${
          isDark
            ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            : "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
        }`}
      >
        <span className="overflow-hidden">
          {selected.latex ? (
            <Formula math={selected.latex} />
          ) : (
            <span className="text-sm">{selected.name}</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-80 overflow-y-auto ${
            isDark
              ? "bg-slate-900 border-white/10"
              : "bg-white border-slate-200"
          }`}
        >
          {functions.map((func) => (
            <button
              key={func.id}
              onClick={() => {
                onSelect(func);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left transition-colors flex items-center gap-2 ${
                selected.id === func.id
                  ? isDark
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-purple-100 text-purple-700"
                  : isDark
                    ? "hover:bg-white/5 text-white"
                    : "hover:bg-slate-50 text-slate-900"
              }`}
            >
              <div className="flex-1 overflow-hidden">
                {func.latex ? (
                  <Formula math={func.latex} />
                ) : (
                  <span className="text-sm">{func.name}</span>
                )}
              </div>
              {selected.id === func.id && (
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>("2d");

  // 1D State
  const [selectedFunction, setSelectedFunction] = useState<ExampleFunction>(
    EXAMPLE_FUNCTIONS[0],
  );
  const [x0, setX0] = useState(selectedFunction.defaultX0);

  // 2D State
  const [selectedFunction2D, setSelectedFunction2D] =
    useState<ExampleFunction2D>(EXAMPLE_FUNCTIONS_2D[0]);

  // Shared State
  const [tolerance, setTolerance] = useState(1e-8);
  const [maxIterations, setMaxIterations] = useState(100);
  const [andersonMemory, setAndersonMemory] = useState(3);
  const [enabledAlgorithms, setEnabledAlgorithms] = useState<
    Set<AlgorithmType>
  >(new Set(["fixed-point", "anderson", "steffensen", "newton"]));

  // 1D ViewBox state for pan/zoom
  const [viewBox1D, setViewBox1D] = useState<ViewBox>(() => {
    const [xMin, xMax] = selectedFunction.domain;
    const padding = (xMax - xMin) * 0.1;
    return {
      x: [xMin - padding, xMax + padding],
      y: [xMin - padding, xMax + padding],
    };
  });

  // 2D ViewBox state for pan/zoom
  const [viewBox2D, setViewBox2D] = useState<ViewBox2D>({
    x: selectedFunction2D.domain.x,
    y: selectedFunction2D.domain.y,
  });

  // 1D Iteration runner hook
  const runner = useIterationRunner({
    func: selectedFunction,
    x0,
    tolerance,
    maxIterations,
    andersonMemory,
    enabledAlgorithms,
  });

  // 2D Iteration runner hook
  const runner2D = useIterationRunner2D({
    func: selectedFunction2D,
    tolerance,
    maxIterations,
    andersonMemory,
    enabledAlgorithms,
  });

  // 1D Handlers
  const handleFunctionChange = useCallback(
    (func: ExampleFunction) => {
      setSelectedFunction(func);
      setX0(func.defaultX0);
      const [xMin, xMax] = func.domain;
      const padding = (xMax - xMin) * 0.1;
      setViewBox1D({
        x: [xMin - padding, xMax + padding],
        y: [xMin - padding, xMax + padding],
      });
      runner.reset();
    },
    [runner],
  );

  const handleX0Change = useCallback((newX0: number) => {
    setX0(newX0);
  }, []);

  const handlePan1D = useCallback((dx: number, dy: number) => {
    setViewBox1D((prev) => ({
      x: [prev.x[0] + dx, prev.x[1] + dx],
      y: [prev.y[0] + dy, prev.y[1] + dy],
    }));
  }, []);

  const handleZoom1D = useCallback(
    (zoomIn: boolean, centerX: number, centerY: number) => {
      setViewBox1D((prev) => {
        const xRange = prev.x[1] - prev.x[0];
        const yRange = prev.y[1] - prev.y[0];
        const factor = zoomIn ? 0.8 : 1.25;

        const newXRange = xRange * factor;
        const newYRange = yRange * factor;

        const xRatio = (centerX - prev.x[0]) / xRange;
        const yRatio = (centerY - prev.y[0]) / yRange;

        return {
          x: [centerX - newXRange * xRatio, centerX + newXRange * (1 - xRatio)],
          y: [centerY - newYRange * yRatio, centerY + newYRange * (1 - yRatio)],
        };
      });
    },
    [],
  );

  const handleResetZoom1D = useCallback(() => {
    const [xMin, xMax] = selectedFunction.domain;
    const padding = (xMax - xMin) * 0.1;
    setViewBox1D({
      x: [xMin - padding, xMax + padding],
      y: [xMin - padding, xMax + padding],
    });
  }, [selectedFunction.domain]);

  const handleResetStart1D = useCallback(() => {
    setX0(selectedFunction.defaultX0);
  }, [selectedFunction.defaultX0]);

  // 2D Handlers
  const handleFunction2DChange = useCallback(
    (func: ExampleFunction2D) => {
      setSelectedFunction2D(func);
      setViewBox2D({ x: func.domain.x, y: func.domain.y });
      runner2D.reset();
      runner2D.setX0(func.defaultX0);
    },
    [runner2D],
  );

  // Shared Handlers
  const handleToggleAlgorithm = useCallback((algo: AlgorithmType) => {
    setEnabledAlgorithms((prev) => {
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
    setViewBox2D((prev) => ({
      x: [prev.x[0] + dx, prev.x[1] + dx],
      y: [prev.y[0] + dy, prev.y[1] + dy],
    }));
  }, []);

  const handleZoom2D = useCallback(
    (zoomIn: boolean, centerX: number, centerY: number) => {
      setViewBox2D((prev) => {
        const factor = zoomIn ? 0.8 : 1.25;
        const newXRange = (prev.x[1] - prev.x[0]) * factor;
        const newYRange = (prev.y[1] - prev.y[0]) * factor;

        const xRatio = (centerX - prev.x[0]) / (prev.x[1] - prev.x[0]);
        const yRatio = (centerY - prev.y[0]) / (prev.y[1] - prev.y[0]);

        return {
          x: [centerX - xRatio * newXRange, centerX + (1 - xRatio) * newXRange],
          y: [centerY - yRatio * newYRange, centerY + (1 - yRatio) * newYRange],
        };
      });
    },
    [],
  );

  const handleResetZoom2D = useCallback(() => {
    setViewBox2D({
      x: selectedFunction2D.domain.x,
      y: selectedFunction2D.domain.y,
    });
  }, [selectedFunction2D.domain]);

  const handleResetStart2D = useCallback(() => {
    runner2D.setX0(selectedFunction2D.defaultX0);
  }, [runner2D, selectedFunction2D.defaultX0]);

  const isDark = theme === "dark";

  // Get current runner based on mode
  const currentRunner = mode === "1d" ? runner : runner2D;

  return (
    <div
      className={`min-h-screen p-4 md:p-8 pb-40 transition-colors duration-300 ${isDark ? "bg-[#0a0a0f] text-white" : "bg-slate-100 text-slate-900"}`}
    >
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${isDark ? "bg-purple-500/10" : "bg-purple-500/5"}`}
        />
        <div
          className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? "bg-blue-500/10" : "bg-blue-500/5"}`}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1
              className={`text-4xl font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent ${isDark ? "from-white via-purple-200 to-purple-400" : "from-slate-800 via-purple-600 to-purple-800"}`}
            >
              Fixed Point Comparisons
            </h1>
            <p
              className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Visualize Anderson Acceleration, Steffensen's method, and
              Newton-Raphson
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div
              className={`flex rounded-xl border overflow-hidden ${
                isDark
                  ? "bg-white/5 border-white/10"
                  : "bg-white/80 border-slate-200 shadow-sm"
              }`}
            >
              <button
                onClick={() => setMode("1d")}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  mode === "1d"
                    ? isDark
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-purple-100 text-purple-700"
                    : isDark
                      ? "text-slate-400 hover:text-white hover:bg-white/5"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                1D Functions
              </button>
              <button
                onClick={() => setMode("2d")}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  mode === "2d"
                    ? isDark
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-purple-100 text-purple-700"
                    : isDark
                      ? "text-slate-400 hover:text-white hover:bg-white/5"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
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
                  ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white"
                  : "bg-white/80 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-sm"
              }`}
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
            >
              {isDark ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        {mode === "1d" ? (
          // 1D Mode - Unified layout similar to 2D
          <>
            {/* Main Content: Side panels + Graph */}
            <div className="flex gap-6">
              {/* Left Panel - Function Selection */}
              <div className="w-56 flex-shrink-0">
                <div
                  className={`rounded-2xl backdrop-blur-sm border p-4 space-y-4 ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-white/80 border-slate-200 shadow-sm"
                  }`}
                >
                  <h3
                    className={`text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Function
                  </h3>
                  <FunctionDropdown
                    functions={EXAMPLE_FUNCTIONS}
                    selected={selectedFunction}
                    onSelect={handleFunctionChange}
                    isDark={isDark}
                  />

                  <div className="pt-2 border-t border-white/10">
                    <h4
                      className={`text-sm font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Legend
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-0.5 bg-blue-500 rounded"></div>
                        <span
                          className={
                            isDark ? "text-slate-300" : "text-slate-600"
                          }
                        >
                          g(x) curve
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-0.5 bg-gray-500"></div>
                        <span
                          className={
                            isDark ? "text-slate-300" : "text-slate-600"
                          }
                        >
                          y = x line
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span
                          className={
                            isDark ? "text-slate-300" : "text-slate-600"
                          }
                        >
                          Fixed point
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                        <span
                          className={
                            isDark ? "text-slate-300" : "text-slate-600"
                          }
                        >
                          Start point
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unified Graph - Center */}
              <div className="flex-1">
                <UnifiedGraph1D
                  func={selectedFunction}
                  results={runner.results}
                  currentStep={runner.animation.currentStep}
                  enabledAlgorithms={enabledAlgorithms}
                  viewBox={viewBox1D}
                  onPan={handlePan1D}
                  onZoom={handleZoom1D}
                  onStartPointChange={handleX0Change}
                  onResetZoom={handleResetZoom1D}
                  onResetStart={handleResetStart1D}
                  x0={x0}
                  isDark={isDark}
                />
              </div>

              {/* Right Panel - Parameters */}
              <div className="w-56 flex-shrink-0">
                <div
                  className={`rounded-2xl backdrop-blur-sm border p-4 space-y-4 ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-white/80 border-slate-200 shadow-sm"
                  }`}
                >
                  <h3
                    className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Parameters
                  </h3>

                  {/* Anderson Memory */}
                  <div
                    className={`p-3 rounded-xl ${isDark ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 border border-green-200"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${isDark ? "text-green-400" : "text-green-700"}`}
                      >
                        Anderson Memory (m)
                      </span>
                      <span
                        className={`text-lg font-bold ${isDark ? "text-green-300" : "text-green-600"}`}
                      >
                        {andersonMemory}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={andersonMemory}
                      onChange={(e) =>
                        setAndersonMemory(parseInt(e.target.value))
                      }
                      className="slider w-full"
                    />
                  </div>

                  {/* Starting Point */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Start x₀
                      </span>
                      <span
                        className={`text-xs font-mono ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {x0.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={selectedFunction.domain[0]}
                      max={selectedFunction.domain[1]}
                      step="0.1"
                      value={x0}
                      onChange={(e) =>
                        handleX0Change(parseFloat(e.target.value))
                      }
                      className="slider w-full"
                    />
                  </div>

                  {/* Algorithms */}
                  <div>
                    <span
                      className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Algorithms{" "}
                      <span
                        className={`font-normal text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        (click to toggle)
                      </span>
                    </span>
                    <div className="mt-2 space-y-1.5">
                      {ALGORITHMS.map((algo) => (
                        <label
                          key={algo.id}
                          className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border transition-all text-xs ${
                            enabledAlgorithms.has(algo.id)
                              ? isDark
                                ? "bg-white/10 border-white/20"
                                : "bg-slate-100 border-slate-300"
                              : isDark
                                ? "bg-white/5 border-white/5 opacity-60 hover:opacity-100"
                                : "bg-white border-slate-200 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={enabledAlgorithms.has(algo.id)}
                            onChange={() => handleToggleAlgorithm(algo.id)}
                            className="sr-only"
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: algo.color,
                              boxShadow: enabledAlgorithms.has(algo.id)
                                ? `0 0 6px ${algo.color}60`
                                : "none",
                            }}
                          />
                          <span
                            className={isDark ? "text-white" : "text-slate-900"}
                          >
                            {algo.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
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
            <div className="mt-8 mb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AlgorithmCard
                title="Fixed-Point"
                color="#ef4444"
                formula={FORMULAS["fixed-point"].iteration}
                description="Standard fixed-point iteration. Linear convergence when |g'(x*)| < 1."
                isDark={isDark}
              />
              <AlgorithmCard
                title="Anderson Acceleration"
                color="#22c55e"
                formula={FORMULAS["anderson"].iteration}
                description="Uses m previous iterates to extrapolate, achieving faster convergence."
                isDark={isDark}
              />
              <AlgorithmCard
                title="Steffensen's Method"
                color="#a855f7"
                formula={
                  FORMULAS["steffensen"].short ||
                  FORMULAS["steffensen"].iteration
                }
                description="Aitken's delta-squared acceleration. Quadratic convergence without derivatives."
                isDark={isDark}
              />
              <AlgorithmCard
                title="Newton-Raphson"
                color="#f59e0b"
                formula={FORMULAS["newton"].iteration}
                description="Uses derivative information for quadratic convergence near roots."
                isDark={isDark}
              />
            </div>
          </>
        ) : (
          // 2D Mode
          <>
            {/* 2D Function Info */}
            <div
              className={`mb-6 p-4 rounded-xl backdrop-blur-sm border ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-200 shadow-sm"}`}
            >
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={isDark ? "text-slate-400" : "text-slate-500"}
                  >
                    System:
                  </span>
                  <span
                    className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {selectedFunction2D.name}
                  </span>
                </div>
                {selectedFunction2D.formula && (
                  <div
                    className={`px-3 py-1.5 rounded-lg ${isDark ? "bg-purple-500/20" : "bg-purple-100"}`}
                  >
                    <Formula math={selectedFunction2D.formula} />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span
                    className={isDark ? "text-slate-400" : "text-slate-500"}
                  >
                    Fixed point
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span
                    className={isDark ? "text-slate-400" : "text-slate-500"}
                  >
                    Starting point
                  </span>
                </div>
                <div
                  className={`ml-auto px-3 py-1 rounded-full text-xs ${isDark ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700"}`}
                >
                  Watch how memory affects trajectory shape!
                </div>
              </div>
            </div>

            {/* Main Content: Left Controls + Trajectory Plot + Right Controls */}
            <div className="flex gap-4">
              {/* Left Panel - Function & Starting Point */}
              <div className="w-56 flex-shrink-0">
                <div
                  className={`rounded-2xl backdrop-blur-sm border p-4 space-y-4 ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-white/80 border-slate-200 shadow-sm"
                  }`}
                >
                  <h3
                    className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Function & Start
                  </h3>

                  {/* Function Selection */}
                  <div>
                    <label
                      className={`block text-xs mb-1.5 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Function
                    </label>
                    <select
                      value={selectedFunction2D.id}
                      onChange={(e) => {
                        const func = EXAMPLE_FUNCTIONS_2D.find(
                          (f) => f.id === e.target.value,
                        );
                        if (func) handleFunction2DChange(func);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer ${
                        isDark
                          ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                          : "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {EXAMPLE_FUNCTIONS_2D.map((f) => (
                        <option
                          key={f.id}
                          value={f.id}
                          className={isDark ? "bg-slate-900" : "bg-white"}
                        >
                          {f.name}
                        </option>
                      ))}
                    </select>
                    <p
                      className={`mt-2 text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {selectedFunction2D.description}
                    </p>
                  </div>

                  {/* Starting Point X */}
                  <div>
                    <label
                      className={`block text-xs mb-1.5 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Start X:{" "}
                      <span
                        className={`font-mono ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {runner2D.x0[0].toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={selectedFunction2D.domain.x[0]}
                      max={selectedFunction2D.domain.x[1]}
                      step={0.05}
                      value={runner2D.x0[0]}
                      onChange={(e) =>
                        runner2D.setX0([
                          parseFloat(e.target.value),
                          runner2D.x0[1],
                        ])
                      }
                      className="w-full slider"
                    />
                  </div>

                  {/* Starting Point Y */}
                  <div>
                    <label
                      className={`block text-xs mb-1.5 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Start Y:{" "}
                      <span
                        className={`font-mono ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {runner2D.x0[1].toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={selectedFunction2D.domain.y[0]}
                      max={selectedFunction2D.domain.y[1]}
                      step={0.05}
                      value={runner2D.x0[1]}
                      onChange={(e) =>
                        runner2D.setX0([
                          runner2D.x0[0],
                          parseFloat(e.target.value),
                        ])
                      }
                      className="w-full slider"
                    />
                  </div>

                  {/* Algorithm Selection - Compact */}
                  <div>
                    <label
                      className={`block text-sm mb-2 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Algorithms{" "}
                      <span
                        className={`font-normal text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        (click to toggle)
                      </span>
                    </label>
                    <div className="space-y-1.5">
                      {["fixed-point", "anderson", "newton"].map((algoId) => {
                        const algo = {
                          "fixed-point": {
                            name: "Fixed-Point",
                            color: "#ef4444",
                          },
                          anderson: { name: "Anderson", color: "#22c55e" },
                          newton: { name: "Newton", color: "#f59e0b" },
                        }[algoId];
                        return (
                          <label
                            key={algoId}
                            className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border transition-all text-xs ${
                              enabledAlgorithms.has(algoId as AlgorithmType)
                                ? isDark
                                  ? "bg-white/10 border-white/20"
                                  : "bg-slate-100 border-slate-300"
                                : isDark
                                  ? "bg-white/5 border-white/5 opacity-60 hover:opacity-100"
                                  : "bg-white border-slate-200 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={enabledAlgorithms.has(
                                algoId as AlgorithmType,
                              )}
                              onChange={() =>
                                handleToggleAlgorithm(algoId as AlgorithmType)
                              }
                              className="sr-only"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: algo!.color,
                                boxShadow: enabledAlgorithms.has(
                                  algoId as AlgorithmType,
                                )
                                  ? `0 0 6px ${algo!.color}60`
                                  : "none",
                              }}
                            />
                            <span
                              className={
                                isDark ? "text-white" : "text-slate-900"
                              }
                            >
                              {algo!.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trajectory Plot - Center */}
              <div className="flex-1">
                <TrajectoryPlot2D
                  func={selectedFunction2D}
                  results={runner2D.results}
                  currentStep={runner2D.animation.currentStep}
                  enabledAlgorithms={enabledAlgorithms}
                  viewBox={viewBox2D}
                  initialDomain={{
                    x: selectedFunction2D.domain.x,
                    y: selectedFunction2D.domain.y,
                  }}
                  onPan={handlePan2D}
                  onZoom={handleZoom2D}
                  onStartPointChange={runner2D.setX0}
                  onResetZoom={handleResetZoom2D}
                  onResetStart={handleResetStart2D}
                  x0={runner2D.x0}
                  isDark={isDark}
                  isPlaying={runner2D.animation.isPlaying}
                />
              </div>

              {/* Right Panel - Parameters */}
              <div className="w-56 flex-shrink-0">
                <div
                  className={`rounded-2xl backdrop-blur-sm border p-4 space-y-4 ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-white/80 border-slate-200 shadow-sm"
                  }`}
                >
                  <h3
                    className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Parameters
                  </h3>

                  {/* Anderson Memory - Emphasized */}
                  <div
                    className={`p-2.5 rounded-lg border ${isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"}`}
                  >
                    <label
                      className={`block text-xs mb-1.5 font-medium ${isDark ? "text-green-300" : "text-green-700"}`}
                    >
                      Anderson Memory:{" "}
                      <span
                        className={`font-mono ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {andersonMemory}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={1}
                      value={andersonMemory}
                      onChange={(e) =>
                        setAndersonMemory(parseInt(e.target.value))
                      }
                      className="w-full slider"
                    />
                    <div
                      className={`flex justify-between text-xs mt-1 font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      <span>0</span>
                      <span>3</span>
                    </div>
                  </div>

                  {/* Tolerance */}
                  <div>
                    <label
                      className={`block text-xs mb-1.5 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Tolerance:{" "}
                      <span
                        className={`font-mono ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        10<sup>{Math.log10(tolerance).toFixed(0)}</sup>
                      </span>
                    </label>
                    <input
                      type="range"
                      min={-12}
                      max={-3}
                      step={1}
                      value={Math.log10(tolerance)}
                      onChange={(e) =>
                        setTolerance(Math.pow(10, parseInt(e.target.value)))
                      }
                      className="w-full slider"
                    />
                  </div>

                  {/* Max Iterations */}
                  <div>
                    <label
                      className={`block text-xs mb-1.5 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Max Iterations:{" "}
                      <span
                        className={`font-mono ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {maxIterations}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={10}
                      value={maxIterations}
                      onChange={(e) =>
                        setMaxIterations(parseInt(e.target.value))
                      }
                      className="w-full slider"
                    />
                  </div>
                </div>
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
            <div
              className={`mt-8 mb-12 p-6 rounded-2xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-200 shadow-sm"}`}
            >
              <h3
                className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Why Anderson Memory Matters in 2D
              </h3>
              <div
                className={`text-sm leading-relaxed space-y-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                <p>
                  In 1D problems, residuals are scalars, so all previous
                  residuals are collinear - there's only one direction. Memory
                  m=1 captures the full benefit of Anderson acceleration.
                </p>
                <p>
                  In 2D (and higher dimensions), residuals are vectors that can
                  point in different directions. With m=1, Anderson can only
                  extrapolate along one direction. With m=2, it can combine
                  information from two different residual directions to find a
                  better path to the solution.
                </p>
                <p className={isDark ? "text-green-400" : "text-green-600"}>
                  <strong>Try it:</strong> Run the "Spiral Contraction" function
                  with m=1 vs m=2. Watch how m=2 takes more direct paths to the
                  fixed point by combining horizontal and vertical corrections!
                </p>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer
          className={`mb-20 pt-6 border-t ${isDark ? "border-white/10" : "border-slate-200"}`}
        >
          <div
            className={`text-center text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            <p className="mb-1">Aryan Tiwari &middot; Sara Pollock</p>
            <p>
              This work was funded by The National Science Foundation
              DMS-2045059 (CAREER)
            </p>
          </div>
        </footer>
      </div>

      {/* Floating Animation Controls */}
      <AnimationControls
        isPlaying={currentRunner.animation.isPlaying}
        currentStep={currentRunner.animation.currentStep}
        maxSteps={currentRunner.maxSteps}
        animationSpeed={currentRunner.animation.speed}
        onSpeedChange={currentRunner.setSpeed}
        onRun={currentRunner.runAll}
        onReset={currentRunner.reset}
        onPlay={currentRunner.play}
        onPause={currentRunner.pause}
        onStepForward={currentRunner.stepForward}
        onStepBackward={currentRunner.stepBackward}
        isDark={isDark}
      />
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

function AlgorithmCard({
  title,
  color,
  formula,
  description,
  isDark,
}: AlgorithmCardProps) {
  return (
    <div
      className={`group relative rounded-xl overflow-hidden backdrop-blur-sm border p-5 transition-all duration-300 ${
        isDark
          ? "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
          : "bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 shadow-sm"
      }`}
    >
      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, ${color}10, transparent 70%)`,
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
          <h3
            className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {title}
          </h3>
        </div>

        {/* LaTeX Formula */}
        <div
          className={`rounded-lg p-3 mb-3 overflow-x-auto ${isDark ? "bg-black/30" : "bg-slate-100"}`}
        >
          <Formula math={formula} />
        </div>

        <p
          className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

export default App;
