import { useRef, useEffect, useCallback, useMemo } from 'react';
import JXG from 'jsxgraph';
import type { Board, GeometryElement, BoardAttributes } from 'jsxgraph';

const { JSXGraph } = JXG;
import { getTheme } from './themes';
import type { ExampleFunction2D, IterationResult2D, AlgorithmType, Point2D } from '../../algorithms/types';
import { ALGORITHMS } from '../../algorithms/types';

// Steffensen's method doesn't generalize well to 2D
const ALGORITHMS_2D = ALGORITHMS.filter(a => a.id !== 'steffensen');

export interface ViewBox2D {
  x: [number, number];
  y: [number, number];
}

interface TrajectoryPlot2DJSXProps {
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
  initialDomain: ViewBox2D;
  onPan: (dx: number, dy: number) => void;
  onZoom: (zoomIn: boolean, centerX: number, centerY: number) => void;
  x0: Point2D;
  isDark: boolean;
}

function calculateTickInterval(range: number): number {
  const targetTickCount = 5;
  const roughInterval = range / targetTickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
  const residual = roughInterval / magnitude;

  let niceInterval: number;
  if (residual <= 1.5) niceInterval = 1;
  else if (residual <= 3) niceInterval = 2;
  else if (residual <= 7) niceInterval = 5;
  else niceInterval = 10;

  const interval = niceInterval * magnitude;
  const minInterval = range / 8;
  const maxInterval = range / 3;

  return Math.max(minInterval, Math.min(maxInterval, interval));
}

function formatTickLabel(value: number, interval: number): string {
  if (interval >= 1) return value.toFixed(0);
  if (interval >= 0.1) return value.toFixed(1);
  if (interval >= 0.01) return value.toFixed(2);
  return value.toFixed(3);
}

export function TrajectoryPlot2DJSX({
  func,
  results,
  currentStep,
  enabledAlgorithms,
  viewBox,
  initialDomain,
  onPan,
  onZoom,
  x0,
  isDark
}: TrajectoryPlot2DJSXProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<Board | null>(null);
  const elementsRef = useRef<GeometryElement[]>([]);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const boardId = useRef(`jsxgraph-2d-${Math.random().toString(36).substr(2, 9)}`);

  const theme = getTheme(isDark);

  const xRange = viewBox.x[1] - viewBox.x[0];
  const yRange = viewBox.y[1] - viewBox.y[0];
  const basePanRangeX = initialDomain.x[1] - initialDomain.x[0];
  const basePanRangeY = initialDomain.y[1] - initialDomain.y[0];

  const tickInterval = useMemo(() => calculateTickInterval(Math.max(xRange, yRange)), [xRange, yRange]);

  // Convert viewBox to JSXGraph bounding box format [xMin, yMax, xMax, yMin]
  const boundingBox: [number, number, number, number] = useMemo(
    () => [viewBox.x[0], viewBox.y[1], viewBox.x[1], viewBox.y[0]],
    [viewBox]
  );

  const enabledAlgos = ALGORITHMS_2D.filter(a => enabledAlgorithms.has(a.id));

  // Initialize board
  useEffect(() => {
    if (!containerRef.current) return;

    if (boardRef.current) {
      JSXGraph.freeBoard(boardRef.current);
    }

    const attributes = {
      boundingbox: boundingBox,
      axis: false,
      grid: false,
      showNavigation: false,
      showCopyright: false,
      keepAspectRatio: true,
      pan: { enabled: false },
      zoom: { enabled: false, wheel: false },
      renderer: 'svg',
    } as BoardAttributes;

    const board = JSXGraph.initBoard(containerRef.current, attributes);
    boardRef.current = board;

    return () => {
      if (boardRef.current) {
        JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update bounding box when viewBox changes
  useEffect(() => {
    if (boardRef.current) {
      boardRef.current.setBoundingBox(boundingBox, true);
    }
  }, [boundingBox]);

  // Draw all elements
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    // Clear existing elements
    elementsRef.current.forEach(el => {
      try {
        board.removeObject(el);
      } catch {
        // Element may already be removed
      }
    });
    elementsRef.current = [];

    board.suspendUpdate();

    const xMin = boundingBox[0];
    const xMax = boundingBox[2];
    const yMin = boundingBox[3];
    const yMax = boundingBox[1];

    // Create grid
    const xStart = Math.ceil(xMin / tickInterval) * tickInterval;
    const yStart = Math.ceil(yMin / tickInterval) * tickInterval;

    // Vertical grid lines
    for (let x = xStart; x <= xMax; x += tickInterval) {
      const line = board.create('segment', [[x, yMin - 100], [x, yMax + 100]], {
        strokeColor: theme.gridColor,
        strokeWidth: 1,
        fixed: true,
        highlight: false,
      });
      elementsRef.current.push(line);
    }

    // Horizontal grid lines
    for (let y = yStart; y <= yMax; y += tickInterval) {
      const line = board.create('segment', [[xMin - 100, y], [xMax + 100, y]], {
        strokeColor: theme.gridColor,
        strokeWidth: 1,
        fixed: true,
        highlight: false,
      });
      elementsRef.current.push(line);
    }

    // Create axes
    const xAxis = board.create('segment', [[xMin - 100, 0], [xMax + 100, 0]], {
      strokeColor: theme.axisColor,
      strokeWidth: 1.5,
      fixed: true,
      highlight: false,
    });
    const yAxis = board.create('segment', [[0, yMin - 100], [0, yMax + 100]], {
      strokeColor: theme.axisColor,
      strokeWidth: 1.5,
      fixed: true,
      highlight: false,
    });
    elementsRef.current.push(xAxis, yAxis);

    // Add tick labels
    for (let x = xStart; x <= xMax; x += tickInterval) {
      if (Math.abs(x) > 0.001) {
        const label = board.create('text', [x, -tickInterval * 0.3, formatTickLabel(x, tickInterval)], {
          fontSize: 10,
          color: theme.tickLabelColor,
          anchorX: 'middle',
          anchorY: 'top',
          fixed: true,
          highlight: false,
        });
        elementsRef.current.push(label);
      }
    }

    for (let y = yStart; y <= yMax; y += tickInterval) {
      if (Math.abs(y) > 0.001) {
        const label = board.create('text', [-tickInterval * 0.2, y, formatTickLabel(y, tickInterval)], {
          fontSize: 10,
          color: theme.tickLabelColor,
          anchorX: 'right',
          anchorY: 'middle',
          fixed: true,
          highlight: false,
        });
        elementsRef.current.push(label);
      }
    }

    // Vector field
    const gridSize = 10;
    const domainXMin = initialDomain.x[0];
    const domainXMax = initialDomain.x[1];
    const domainYMin = initialDomain.y[0];
    const domainYMax = initialDomain.y[1];
    const domainXRange = domainXMax - domainXMin;
    const domainYRange = domainYMax - domainYMin;
    const xStep = domainXRange / (gridSize + 1);
    const yStep = domainYRange / (gridSize + 1);
    const fixedArrowLength = Math.min(domainXRange, domainYRange) / 28;

    const vectorColor = isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.5)';

    for (let i = 1; i <= gridSize; i++) {
      for (let j = 1; j <= gridSize; j++) {
        const px = domainXMin + i * xStep;
        const py = domainYMin + j * yStep;

        // Skip if not in visible area
        const margin = 0.5;
        if (px < viewBox.x[0] - margin || px > viewBox.x[1] + margin ||
            py < viewBox.y[0] - margin || py > viewBox.y[1] + margin) {
          continue;
        }

        try {
          const gResult = func.g([px, py]);
          const dx = gResult[0] - px;
          const dy = gResult[1] - py;

          if (isFinite(dx) && isFinite(dy)) {
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag > 0.0001) {
              const nx = dx / mag;
              const ny = dy / mag;
              const tipX = px + nx * fixedArrowLength;
              const tipY = py + ny * fixedArrowLength;

              const arrow = board.create('arrow', [[px, py], [tipX, tipY]], {
                strokeColor: vectorColor,
                strokeWidth: 1.5,
                fixed: true,
                highlight: false,
                lastArrow: { type: 2, size: 4 },
              });
              elementsRef.current.push(arrow);
            }
          }
        } catch {
          // Skip points where function fails
        }
      }
    }

    // Fixed point (end) marker
    const fixedPoint = board.create('point', [func.fixedPoint[0], func.fixedPoint[1]], {
      size: 5,
      fillColor: '#f59e0b',
      strokeColor: '#f59e0b',
      fixed: true,
      highlight: false,
      withLabel: false,
    });
    elementsRef.current.push(fixedPoint);

    // End label
    const labelOffsetX = 0.12 * (xRange / 4);
    const labelOffsetY = 0.12 * (yRange / 4);
    const endLabel = board.create('text', [
      func.fixedPoint[0] + labelOffsetX,
      func.fixedPoint[1] + labelOffsetY,
      'End'
    ], {
      fontSize: 12,
      color: '#f59e0b',
      fixed: true,
      highlight: false,
    });
    elementsRef.current.push(endLabel);

    // Starting point marker
    const startPoint = board.create('point', [x0[0], x0[1]], {
      size: 5,
      fillColor: '#06b6d4',
      strokeColor: '#06b6d4',
      fixed: true,
      highlight: false,
      withLabel: false,
    });
    elementsRef.current.push(startPoint);

    // Start label
    const startLabel = board.create('text', [
      x0[0] + labelOffsetX,
      x0[1] - 0.18 * (yRange / 4),
      'Start'
    ], {
      fontSize: 12,
      color: '#06b6d4',
      fixed: true,
      highlight: false,
    });
    elementsRef.current.push(startLabel);

    // Render trajectories for each enabled algorithm
    enabledAlgos.forEach(algo => {
      const result = results[algo.id];
      if (!result) return;

      const stepsToShow = result.steps.slice(0, currentStep + 1);

      stepsToShow.forEach((step, i) => {
        const px = step.x[0];
        const py = step.x[1];

        if (!isFinite(px) || !isFinite(py)) return;

        const nextStep = stepsToShow[i + 1];

        // Line to next point
        if (nextStep && isFinite(nextStep.x[0]) && isFinite(nextStep.x[1])) {
          const line = board.create('segment', [[px, py], [nextStep.x[0], nextStep.x[1]]], {
            strokeColor: algo.color,
            strokeWidth: 2,
            fixed: true,
            highlight: false,
            opacity: 0.7,
          });
          elementsRef.current.push(line);
        }

        // Point at current iterate
        const point = board.create('point', [px, py], {
          size: 3,
          fillColor: algo.color,
          strokeColor: algo.color,
          fixed: true,
          highlight: false,
          withLabel: false,
          fillOpacity: i === stepsToShow.length - 1 ? 1 : 0.5,
          strokeOpacity: i === stepsToShow.length - 1 ? 1 : 0.5,
        });
        elementsRef.current.push(point);
      });
    });

    board.unsuspendUpdate();
  }, [boundingBox, func, results, currentStep, enabledAlgos, x0, theme, tickInterval, initialDomain, isDark, viewBox, xRange, yRange]);

  // Mouse handlers for pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = -((e.clientX - lastPos.current.x) / rect.width) * basePanRangeX;
    const dy = ((e.clientY - lastPos.current.y) / rect.height) * basePanRangeY;

    lastPos.current = { x: e.clientX, y: e.clientY };
    onPan(dx, dy);
  }, [basePanRangeX, basePanRangeY, onPan]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Wheel handler for zoom
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
        id={boardId.current}
        className="relative h-[500px] cursor-grab active:cursor-grabbing jxgbox"
        style={{
          backgroundColor: isDark ? 'transparent' : '#f8fafc',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

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
              ({x0[0].toFixed(2)}, {x0[1].toFixed(2)})
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
