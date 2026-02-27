import { useRef, useEffect, useCallback, useMemo } from 'react';
import JXG from 'jsxgraph';
import type { Board, GeometryElement, BoardAttributes } from 'jsxgraph';

const { JSXGraph } = JXG;
import { Formula } from '../Formula';
import { FORMULAS } from '../../constants/formulas';
import { getTheme } from './themes';
import type { ExampleFunction, AlgorithmInfo, IterationResult, IterationStep } from '../../algorithms/types';
import type { ViewBox } from '../GraphGrid';

interface AlgorithmGraphJSXProps {
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

export function AlgorithmGraphJSX({
  algorithm,
  func,
  result,
  currentStep,
  x0,
  viewBox,
  onPan,
  onZoom,
  isDark
}: AlgorithmGraphJSXProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<Board | null>(null);
  const elementsRef = useRef<GeometryElement[]>([]);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const boardId = useRef(`jsxgraph-${algorithm.id}-${Math.random().toString(36).substr(2, 9)}`);

  const formula = FORMULAS[algorithm.id];
  const theme = getTheme(isDark);

  const xRange = viewBox.x[1] - viewBox.x[0];
  const yRange = viewBox.y[1] - viewBox.y[0];
  const tickInterval = useMemo(() => calculateTickInterval(Math.max(xRange, yRange)), [xRange, yRange]);

  // Convert viewBox to JSXGraph bounding box format [xMin, yMax, xMax, yMin]
  const boundingBox: [number, number, number, number] = useMemo(
    () => [viewBox.x[0], viewBox.y[1], viewBox.x[1], viewBox.y[0]],
    [viewBox]
  );

  // Initialize board
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing board
    if (boardRef.current) {
      JSXGraph.freeBoard(boardRef.current);
    }

    const attributes = {
      boundingbox: boundingBox,
      axis: false,
      grid: false,
      showNavigation: false,
      showCopyright: false,
      keepAspectRatio: false,
      pan: { enabled: false },
      zoom: { enabled: false, wheel: false },
      renderer: 'canvas',
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
      boardRef.current.setBoundingBox(boundingBox, false);
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

    // Create grid
    const gridLines: GeometryElement[] = [];
    const xMin = boundingBox[0];
    const xMax = boundingBox[2];
    const yMin = boundingBox[3];
    const yMax = boundingBox[1];

    // Calculate grid line positions
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
      gridLines.push(line);
    }

    // Horizontal grid lines
    for (let y = yStart; y <= yMax; y += tickInterval) {
      const line = board.create('segment', [[xMin - 100, y], [xMax + 100, y]], {
        strokeColor: theme.gridColor,
        strokeWidth: 1,
        fixed: true,
        highlight: false,
      });
      gridLines.push(line);
    }

    elementsRef.current.push(...gridLines);

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

    // y = x line (identity, dashed)
    const identityLine = board.create('functiongraph', [(x: number) => x], {
      strokeColor: theme.identityLineColor,
      strokeWidth: 1.5,
      dash: 3,
      highlight: false,
    });
    elementsRef.current.push(identityLine);

    // g(x) function
    const gFunc = board.create('functiongraph', [func.g], {
      strokeColor: theme.functionColor,
      strokeWidth: 2.5,
      highlight: false,
    });
    elementsRef.current.push(gFunc);

    // Fixed point marker
    const fixedPoint = board.create('point', [func.fixedPoint, func.fixedPoint], {
      size: 4,
      fillColor: '#f59e0b',
      strokeColor: '#f59e0b',
      fixed: true,
      highlight: false,
      withLabel: false,
    });
    elementsRef.current.push(fixedPoint);

    // Starting point marker
    const startY = func.g(x0);
    if (isFinite(startY)) {
      const startPoint = board.create('point', [x0, startY], {
        size: 4,
        fillColor: '#06b6d4',
        strokeColor: '#06b6d4',
        fixed: true,
        highlight: false,
        withLabel: false,
      });
      elementsRef.current.push(startPoint);
    }

    // Iteration path
    if (result) {
      const stepsToShow = result.steps.slice(0, currentStep + 1);

      stepsToShow.forEach((step: IterationStep, i: number) => {
        const x = step.x;
        const gx = step.fx;

        if (!isFinite(x) || !isFinite(gx)) return;

        const nextStep = stepsToShow[i + 1];
        const nextX = nextStep?.x;

        // Vertical line from (x, x) to (x, g(x))
        const vertLine = board.create('segment', [[x, x], [x, gx]], {
          strokeColor: algorithm.color,
          strokeWidth: 1.5,
          fixed: true,
          highlight: false,
          opacity: 0.7,
        });
        elementsRef.current.push(vertLine);

        // Horizontal line from (x, g(x)) to (nextX, nextX)
        if (nextX !== undefined && isFinite(nextX)) {
          const horizLine = board.create('segment', [[x, gx], [nextX, nextX]], {
            strokeColor: algorithm.color,
            strokeWidth: 1.5,
            fixed: true,
            highlight: false,
            opacity: 0.7,
          });
          elementsRef.current.push(horizLine);
        }

        // Point at current iterate
        const iterPoint = board.create('point', [x, gx], {
          size: 3,
          fillColor: algorithm.color,
          strokeColor: algorithm.color,
          fixed: true,
          highlight: false,
          withLabel: false,
          fillOpacity: i === stepsToShow.length - 1 ? 1 : 0.4,
          strokeOpacity: i === stepsToShow.length - 1 ? 1 : 0.4,
        });
        elementsRef.current.push(iterPoint);
      });
    }

    board.unsuspendUpdate();
  }, [boundingBox, func, result, currentStep, x0, algorithm, theme, tickInterval]);

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
    const dx = -((e.clientX - lastPos.current.x) / rect.width) * xRange;
    const dy = ((e.clientY - lastPos.current.y) / rect.height) * yRange;

    lastPos.current = { x: e.clientX, y: e.clientY };
    onPan(dx, dy);
  }, [xRange, yRange, onPan]);

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
        id={boardId.current}
        className="relative h-[280px] cursor-grab active:cursor-grabbing jxgbox"
        style={{
          backgroundColor: isDark ? 'transparent' : '#f8fafc',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

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

function formatTickLabel(value: number, interval: number): string {
  if (interval >= 1) return value.toFixed(0);
  if (interval >= 0.1) return value.toFixed(1);
  if (interval >= 0.01) return value.toFixed(2);
  return value.toFixed(3);
}
