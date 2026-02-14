import { useRef, useEffect, useMemo } from 'react';
import { Mafs, Coordinates, Point, Line, Vector } from 'mafs';
import 'mafs/core.css';
import type { ExampleFunction2D, IterationResult2D, AlgorithmType, Point2D } from '../algorithms/types';
import { ALGORITHMS } from '../algorithms/types';

// Steffensen's method doesn't generalize well to 2D
const ALGORITHMS_2D = ALGORITHMS.filter(a => a.id !== 'steffensen');

export interface ViewBox2D {
  x: [number, number];
  y: [number, number];
}

interface TrajectoryPlot2DProps {
  func: ExampleFunction2D;
  results: {
    'fixed-point': IterationResult2D | null;
    'anderson': IterationResult2D | null;
    'steffensen': IterationResult2D | null;
    'newton': IterationResult2D | null;
  };
  currentStep: number;
  enabledAlgorithms: Set<AlgorithmType>;
  viewBox: ViewBox2D;
  onPan: (dx: number, dy: number) => void;
  onZoom: (zoomIn: boolean, centerX: number, centerY: number) => void;
  isDark: boolean;
}

// Calculate nice tick interval based on range
function calculateTickInterval(range: number): number {
  const roughTickCount = 5;
  const roughInterval = range / roughTickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
  const residual = roughInterval / magnitude;

  let niceInterval: number;
  if (residual <= 1.5) niceInterval = 1;
  else if (residual <= 3) niceInterval = 2;
  else if (residual <= 7) niceInterval = 5;
  else niceInterval = 10;

  const minInterval = range / 8;
  return Math.max(niceInterval * magnitude, minInterval);
}

function formatAxisLabel(value: number, interval: number): string {
  if (interval >= 1) return value.toFixed(0);
  if (interval >= 0.1) return value.toFixed(1);
  if (interval >= 0.01) return value.toFixed(2);
  return value.toFixed(3);
}

export function TrajectoryPlot2D({
  func,
  results,
  currentStep,
  enabledAlgorithms,
  viewBox,
  onPan,
  onZoom,
  isDark
}: TrajectoryPlot2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const xRange = viewBox.x[1] - viewBox.x[0];
  const yRange = viewBox.y[1] - viewBox.y[0];
  const tickInterval = useMemo(() => {
    return calculateTickInterval(Math.max(xRange, yRange));
  }, [xRange, yRange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = -((e.clientX - lastPos.current.x) / rect.width) * xRange;
    const dy = ((e.clientY - lastPos.current.y) / rect.height) * yRange;

    lastPos.current = { x: e.clientX, y: e.clientY };
    onPan(dx, dy);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const graphX = viewBox.x[0] + (e.clientX - rect.left) / rect.width * xRange;
      const graphY = viewBox.y[1] - (e.clientY - rect.top) / rect.height * yRange;

      const zoomIn = e.deltaY < 0;
      onZoom(zoomIn, graphX, graphY);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [viewBox, xRange, yRange, onZoom]);

  // Build legend for enabled algorithms (only those that work in 2D)
  const enabledAlgos = ALGORITHMS_2D.filter(a => enabledAlgorithms.has(a.id));

  return (
    <div className={`group relative rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-white/10 shadow-black/30 hover:border-white/20'
        : 'bg-white border-slate-200 shadow-slate-200/50 hover:border-slate-300'
    }`}>
      {/* Header */}
      <div className={`relative px-4 py-3 border-b ${
        isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              2D Trajectory Plot
            </span>
            <span className={`ml-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {func.name}
            </span>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            {enabledAlgos.map(algo => (
              <div key={algo.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: algo.color }}
                />
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{algo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graph */}
      <div
        ref={containerRef}
        className="relative h-[500px] cursor-grab active:cursor-grabbing"
        style={{
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
          preserveAspectRatio="contain"
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

          {/* Vector field showing function behavior */}
          <VectorField2D
            func={func}
            viewBox={viewBox}
            isDark={isDark}
          />

          {/* Fixed point marker */}
          <Point
            x={func.fixedPoint[0]}
            y={func.fixedPoint[1]}
            color="#f59e0b"
            opacity={0.9}
          />

          {/* Starting point marker */}
          <Point
            x={func.defaultX0[0]}
            y={func.defaultX0[1]}
            color="#06b6d4"
            opacity={0.9}
          />

          {/* Render trajectories for each enabled algorithm */}
          {enabledAlgos.map(algo => {
            const result = results[algo.id];
            if (!result) return null;
            return (
              <Trajectory2D
                key={algo.id}
                result={result}
                color={algo.color}
                currentStep={currentStep}
              />
            );
          })}
        </Mafs>
      </div>

      {/* Footer info */}
      <div className={`relative px-4 py-2 border-t flex items-center justify-between text-xs ${
        isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <div className="flex items-center gap-4">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Fixed point: <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ({func.fixedPoint[0].toFixed(2)}, {func.fixedPoint[1].toFixed(2)})
            </span>
          </span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Start: <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ({func.defaultX0[0].toFixed(2)}, {func.defaultX0[1].toFixed(2)})
            </span>
          </span>
        </div>
        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
          Step: <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentStep}</span>
        </span>
      </div>
    </div>
  );
}

interface Trajectory2DProps {
  result: IterationResult2D;
  color: string;
  currentStep: number;
}

function Trajectory2D({ result, color, currentStep }: Trajectory2DProps) {
  const stepsToShow = result.steps.slice(0, currentStep + 1);

  return (
    <>
      {stepsToShow.map((step, i) => {
        const x = step.x[0];
        const y = step.x[1];

        if (!isFinite(x) || !isFinite(y)) return null;

        const nextStep = stepsToShow[i + 1];

        return (
          <g key={i}>
            {/* Line to next point */}
            {nextStep && isFinite(nextStep.x[0]) && isFinite(nextStep.x[1]) && (
              <Line.Segment
                point1={[x, y]}
                point2={[nextStep.x[0], nextStep.x[1]]}
                color={color}
                opacity={0.7}
                weight={2}
              />
            )}

            {/* Point at current iterate */}
            <Point
              x={x}
              y={y}
              color={color}
              opacity={i === stepsToShow.length - 1 ? 1 : 0.5}
            />
          </g>
        );
      })}
    </>
  );
}

interface VectorField2DProps {
  func: ExampleFunction2D;
  viewBox: ViewBox2D;
  isDark: boolean;
}

function VectorField2D({ func, viewBox, isDark }: VectorField2DProps) {
  const gridSize = 12; // Number of vectors in each direction

  const vectors = useMemo(() => {
    const result: Array<{ origin: Point2D; displacement: Point2D; magnitude: number }> = [];

    const xMin = viewBox.x[0];
    const xMax = viewBox.x[1];
    const yMin = viewBox.y[0];
    const yMax = viewBox.y[1];

    const xStep = (xMax - xMin) / (gridSize + 1);
    const yStep = (yMax - yMin) / (gridSize + 1);

    // Calculate all displacements first to find max magnitude for scaling
    const displacements: Array<{ origin: Point2D; dx: number; dy: number }> = [];
    let maxMag = 0;

    for (let i = 1; i <= gridSize; i++) {
      for (let j = 1; j <= gridSize; j++) {
        const x = xMin + i * xStep;
        const y = yMin + j * yStep;

        try {
          const gResult = func.g([x, y]);
          const dx = gResult[0] - x;
          const dy = gResult[1] - y;

          if (isFinite(dx) && isFinite(dy)) {
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag > 0.0001) { // Skip near-zero vectors
              maxMag = Math.max(maxMag, mag);
              displacements.push({ origin: [x, y], dx, dy });
            }
          }
        } catch {
          // Skip points where function fails
        }
      }
    }

    // Scale vectors to be visible but not too large
    const viewScale = Math.min(xMax - xMin, yMax - yMin);
    const targetLength = viewScale / (gridSize * 1.5); // Target arrow length
    const scale = maxMag > 0 ? targetLength / maxMag : 1;

    for (const { origin, dx, dy } of displacements) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      const scaledDx = dx * scale;
      const scaledDy = dy * scale;

      result.push({
        origin,
        displacement: [scaledDx, scaledDy],
        magnitude: mag
      });
    }

    return result;
  }, [func, viewBox]);

  const vectorColor = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.35)';

  return (
    <>
      {vectors.map((v, i) => (
        <Vector
          key={i}
          tail={v.origin}
          tip={[v.origin[0] + v.displacement[0], v.origin[1] + v.displacement[1]]}
          color={vectorColor}
          weight={1.5}
          style="solid"
        />
      ))}
    </>
  );
}
