import { useRef, useEffect, useMemo } from 'react';
import { Mafs, Coordinates, Plot, Point, Line } from 'mafs';
import 'mafs/core.css';
import { Formula } from './Formula';
import { FORMULAS } from '../constants/formulas';
import type { ExampleFunction, AlgorithmInfo, IterationResult, IterationStep } from '../algorithms/types';
import type { ViewBox } from './GraphGrid';

interface AlgorithmGraphProps {
  algorithm: AlgorithmInfo;
  func: ExampleFunction;
  result: IterationResult | null;
  currentStep: number;
  x0: number;
  viewBox: ViewBox;
  onPan: (dx: number, dy: number) => void;
  onZoom: (zoomIn: boolean, centerX: number, centerY: number) => void;
  isDark: boolean;
}

// Calculate nice tick interval based on range
function calculateTickInterval(range: number): number {
  // Aim for roughly 4-6 tick marks regardless of zoom level
  const roughTickCount = 5;
  const roughInterval = range / roughTickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
  const residual = roughInterval / magnitude;

  let niceInterval: number;
  if (residual <= 1.5) niceInterval = 1;
  else if (residual <= 3) niceInterval = 2;
  else if (residual <= 7) niceInterval = 5;
  else niceInterval = 10;

  // Ensure we don't have too many lines - minimum interval based on range
  const minInterval = range / 8; // Maximum of 8 tick marks
  return Math.max(niceInterval * magnitude, minInterval);
}

// Format number for axis label
function formatAxisLabel(value: number, interval: number): string {
  if (interval >= 1) return value.toFixed(0);
  if (interval >= 0.1) return value.toFixed(1);
  if (interval >= 0.01) return value.toFixed(2);
  return value.toFixed(3);
}

export function AlgorithmGraph({
  algorithm,
  func,
  result,
  currentStep,
  x0,
  viewBox,
  onPan,
  onZoom,
  isDark
}: AlgorithmGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const formula = FORMULAS[algorithm.id];

  // Calculate dynamic tick interval based on current view
  const xRange = viewBox.x[1] - viewBox.x[0];
  const yRange = viewBox.y[1] - viewBox.y[0];
  const tickInterval = useMemo(() => {
    return calculateTickInterval(Math.max(xRange, yRange));
  }, [xRange, yRange]);

  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  // Handle mouse move for panning
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const dx = -((e.clientX - lastPos.current.x) / rect.width) * xRange;
    const dy = ((e.clientY - lastPos.current.y) / rect.height) * yRange;

    lastPos.current = { x: e.clientX, y: e.clientY };
    onPan(dx, dy);
  };

  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Handle mouse leave to stop panning
  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  // Handle wheel for zooming - use native event listener to prevent page scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const xRange = viewBox.x[1] - viewBox.x[0];
      const yRange = viewBox.y[1] - viewBox.y[0];
      const graphX = viewBox.x[0] + (e.clientX - rect.left) / rect.width * xRange;
      const graphY = viewBox.y[1] - (e.clientY - rect.top) / rect.height * yRange;

      const zoomIn = e.deltaY < 0; // Scroll up = zoom in
      onZoom(zoomIn, graphX, graphY);
    };

    // Add non-passive event listener to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [viewBox, onZoom]);

  return (
    <div className={`group relative rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-white/10 shadow-black/30 hover:border-white/20 hover:shadow-black/40'
        : 'bg-white border-slate-200 shadow-slate-200/50 hover:border-slate-300 hover:shadow-slate-300/50'
    }`}>
      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity group-hover:opacity-30"
        style={{
          background: `radial-gradient(ellipse at top, ${algorithm.color}15, transparent 70%)`
        }}
      />

      {/* Header */}
      <div className={`relative flex items-center justify-between px-4 py-3 border-b ${
        isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shadow-lg"
            style={{
              backgroundColor: algorithm.color,
              boxShadow: `0 0 10px ${algorithm.color}50`
            }}
          />
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{algorithm.name}</span>
        </div>
        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Formula math={formula.iteration} />
        </div>
      </div>

      {/* Graph */}
      <div
        ref={containerRef}
        className={`relative h-[280px] cursor-grab active:cursor-grabbing`}
        style={{
          // Mafs theme CSS variables
          '--mafs-bg': isDark ? 'transparent' : '#f8fafc',
          '--mafs-fg': isDark ? '#e2e8f0' : '#334155',
          '--mafs-line-color': isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
        } as React.CSSProperties}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <Mafs
          viewBox={{ x: viewBox.x, y: viewBox.y }}
          preserveAspectRatio={false}
          pan={false}
        >
          <Coordinates.Cartesian
            xAxis={{
              lines: tickInterval,
              labels: (n) => formatAxisLabel(n, tickInterval)
            }}
            yAxis={{
              lines: tickInterval,
              labels: (n) => formatAxisLabel(n, tickInterval)
            }}
          />

          {/* y = x line (identity) */}
          <Plot.OfX
            y={(x) => x}
            color={isDark ? "#6b7280" : "#94a3b8"}
            style="dashed"
            opacity={0.6}
          />

          {/* g(x) function */}
          <Plot.OfX
            y={func.g}
            color={isDark ? "#a855f7" : "#7c3aed"}
            weight={2.5}
          />

          {/* Fixed point marker */}
          <Point
            x={func.fixedPoint}
            y={func.fixedPoint}
            color="#f59e0b"
            opacity={0.9}
          />

          {/* Starting point marker (x0) */}
          <Point
            x={x0}
            y={func.g(x0)}
            color="#06b6d4"
            opacity={0.9}
          />

          {/* Iteration path */}
          {result && (
            <IterationPath
              result={result}
              color={algorithm.color}
              currentStep={currentStep}
            />
          )}
        </Mafs>
      </div>

      {/* Footer with stats */}
      {result && (
        <div className={`relative px-4 py-2 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Iterations: <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{Math.min(currentStep + 1, result.totalIterations)}</span>
          </span>
          {result.converged && currentStep >= result.totalIterations - 1 && (
            <span className="text-green-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Converged
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface IterationPathProps {
  result: IterationResult;
  color: string;
  currentStep: number;
}

function IterationPath({ result, color, currentStep }: IterationPathProps) {
  const stepsToShow = result.steps.slice(0, currentStep + 1);

  return (
    <>
      {stepsToShow.map((step: IterationStep, i: number) => {
        const x = step.x;
        const gx = step.fx;

        if (!isFinite(x) || !isFinite(gx)) return null;

        // Get the next step's x value for the horizontal line
        const nextStep = stepsToShow[i + 1];
        const nextX = nextStep?.x;

        return (
          <g key={i}>
            {/* Vertical line from (x, x) to (x, g(x)) */}
            <Line.Segment
              point1={[x, x]}
              point2={[x, gx]}
              color={color}
              opacity={0.7}
              weight={1.5}
            />

            {/* Horizontal line from (x, g(x)) to (nextX, nextX) */}
            {nextX !== undefined && isFinite(nextX) && (
              <Line.Segment
                point1={[x, gx]}
                point2={[nextX, nextX]}
                color={color}
                opacity={0.7}
                weight={1.5}
              />
            )}

            {/* Point at current iterate */}
            <Point
              x={x}
              y={gx}
              color={color}
              opacity={i === stepsToShow.length - 1 ? 1 : 0.4}
            />
          </g>
        );
      })}
    </>
  );
}
