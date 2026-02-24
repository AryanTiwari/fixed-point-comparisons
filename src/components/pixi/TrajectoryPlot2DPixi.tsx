import { useRef, useEffect, useCallback, useState } from 'react';
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js';
import type { ExampleFunction2D, IterationResult2D, AlgorithmType, Point2D } from '../../algorithms/types';
import { ALGORITHMS } from '../../algorithms/types';

const ALGORITHMS_2D = ALGORITHMS.filter(a => a.id !== 'steffensen');

export interface ViewBox2D {
  x: [number, number];
  y: [number, number];
}

interface TrajectoryPlot2DPixiProps {
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
  isPlaying?: boolean;
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

// Convert hex color string to number
function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function TrajectoryPlot2DPixi({
  func,
  results,
  currentStep,
  enabledAlgorithms,
  viewBox,
  initialDomain,
  onPan,
  onZoom,
  x0,
  isDark,
  isPlaying = false
}: TrajectoryPlot2DPixiProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);

  const xRange = viewBox.x[1] - viewBox.x[0];
  const yRange = viewBox.y[1] - viewBox.y[0];
  const basePanRangeX = initialDomain.x[1] - initialDomain.x[0];
  const basePanRangeY = initialDomain.y[1] - initialDomain.y[0];

  const enabledAlgos = ALGORITHMS_2D.filter(a => enabledAlgorithms.has(a.id));

  // Initialize Pixi Application (only once)
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;
    const app = new Application();

    const initApp = async () => {
      await app.init({
        background: 0x0f172a,
        resizeTo: container,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }

      // Clear any existing canvas
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      container.appendChild(app.canvas);
      appRef.current = app;
      setIsReady(true);
    };

    initApp();

    return () => {
      cancelled = true;
      setIsReady(false);
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  // Update background color when theme changes
  useEffect(() => {
    if (appRef.current && isReady) {
      appRef.current.renderer.background.color = isDark ? 0x0f172a : 0xf8fafc;
    }
  }, [isDark, isReady]);

  // Main render effect
  useEffect(() => {
    const app = appRef.current;
    if (!app || !app.stage || !isReady) return;

    // Clear previous content
    app.stage.removeChildren();

    const width = app.screen.width;
    const height = app.screen.height;

    // Coordinate transformation functions
    const toScreenX = (x: number) => ((x - viewBox.x[0]) / xRange) * width;
    const toScreenY = (y: number) => ((viewBox.y[1] - y) / yRange) * height;
    const toMathX = (sx: number) => viewBox.x[0] + (sx / width) * xRange;
    const toMathY = (sy: number) => viewBox.y[1] - (sy / height) * yRange;

    const tickInterval = calculateTickInterval(Math.max(xRange, yRange));

    // Theme colors
    const gridColor = isDark ? 0x334155 : 0xe2e8f0;
    const axisColor = isDark ? 0x64748b : 0x94a3b8;
    const tickLabelColor = isDark ? '#94a3b8' : '#64748b';

    // Create containers for layering
    const gridContainer = new Container();
    const vectorContainer = new Container();
    const trajectoryContainer = new Container();
    const pointsContainer = new Container();
    const labelsContainer = new Container();

    app.stage.addChild(gridContainer);
    app.stage.addChild(vectorContainer);
    app.stage.addChild(trajectoryContainer);
    app.stage.addChild(pointsContainer);
    app.stage.addChild(labelsContainer);

    // Draw grid
    const gridGraphics = new Graphics();
    gridContainer.addChild(gridGraphics);

    const xStart = Math.ceil(viewBox.x[0] / tickInterval) * tickInterval;
    const yStart = Math.ceil(viewBox.y[0] / tickInterval) * tickInterval;

    // Vertical grid lines
    for (let x = xStart; x <= viewBox.x[1]; x += tickInterval) {
      const sx = toScreenX(x);
      gridGraphics.moveTo(sx, 0);
      gridGraphics.lineTo(sx, height);
    }

    // Horizontal grid lines
    for (let y = yStart; y <= viewBox.y[1]; y += tickInterval) {
      const sy = toScreenY(y);
      gridGraphics.moveTo(0, sy);
      gridGraphics.lineTo(width, sy);
    }

    gridGraphics.stroke({ width: 1, color: gridColor });

    // Draw axes
    const axesGraphics = new Graphics();
    gridContainer.addChild(axesGraphics);

    // X axis
    const yAxisScreen = toScreenY(0);
    if (yAxisScreen >= 0 && yAxisScreen <= height) {
      axesGraphics.moveTo(0, yAxisScreen);
      axesGraphics.lineTo(width, yAxisScreen);
    }

    // Y axis
    const xAxisScreen = toScreenX(0);
    if (xAxisScreen >= 0 && xAxisScreen <= width) {
      axesGraphics.moveTo(xAxisScreen, 0);
      axesGraphics.lineTo(xAxisScreen, height);
    }

    axesGraphics.stroke({ width: 1.5, color: axisColor });

    // Tick labels
    const labelStyle = new TextStyle({
      fontSize: 10,
      fill: tickLabelColor,
    });

    for (let x = xStart; x <= viewBox.x[1]; x += tickInterval) {
      if (Math.abs(x) > 0.001) {
        const sx = toScreenX(x);
        const label = new Text({ text: formatTickLabel(x, tickInterval), style: labelStyle });
        label.anchor.set(0.5, 0);
        label.x = sx;
        label.y = toScreenY(0) + 5;
        if (label.y > 0 && label.y < height - 15) {
          labelsContainer.addChild(label);
        }
      }
    }

    for (let y = yStart; y <= viewBox.y[1]; y += tickInterval) {
      if (Math.abs(y) > 0.001) {
        const sy = toScreenY(y);
        const label = new Text({ text: formatTickLabel(y, tickInterval), style: labelStyle });
        label.anchor.set(1, 0.5);
        label.x = toScreenX(0) - 5;
        label.y = sy;
        if (label.x > 15 && label.x < width) {
          labelsContainer.addChild(label);
        }
      }
    }

    // Vector field (skip during animation)
    if (!isPlaying) {
      const vectorGraphics = new Graphics();
      vectorContainer.addChild(vectorGraphics);

      const gridSize = 8;
      const domainXRange = initialDomain.x[1] - initialDomain.x[0];
      const domainYRange = initialDomain.y[1] - initialDomain.y[0];
      const xStep = domainXRange / (gridSize + 1);
      const yStep = domainYRange / (gridSize + 1);
      const fixedArrowLength = Math.min(domainXRange, domainYRange) / 28;

      const vectorColor = isDark ? 0x94a3b8 : 0x475569;
      const vectorAlpha = isDark ? 0.6 : 0.5;

      for (let i = 1; i <= gridSize; i++) {
        for (let j = 1; j <= gridSize; j++) {
          const px = initialDomain.x[0] + i * xStep;
          const py = initialDomain.y[0] + j * yStep;

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

                const sx1 = toScreenX(px);
                const sy1 = toScreenY(py);
                const sx2 = toScreenX(tipX);
                const sy2 = toScreenY(tipY);

                // Draw arrow line
                vectorGraphics.moveTo(sx1, sy1);
                vectorGraphics.lineTo(sx2, sy2);

                // Draw arrowhead
                const angle = Math.atan2(sy2 - sy1, sx2 - sx1);
                const headLength = 6;
                const headAngle = Math.PI / 6;

                vectorGraphics.moveTo(sx2, sy2);
                vectorGraphics.lineTo(
                  sx2 - headLength * Math.cos(angle - headAngle),
                  sy2 - headLength * Math.sin(angle - headAngle)
                );
                vectorGraphics.moveTo(sx2, sy2);
                vectorGraphics.lineTo(
                  sx2 - headLength * Math.cos(angle + headAngle),
                  sy2 - headLength * Math.sin(angle + headAngle)
                );
              }
            }
          } catch {
            // Skip points where function fails
          }
        }
      }

      vectorGraphics.stroke({ width: 1.5, color: vectorColor, alpha: vectorAlpha });
    }

    // Fixed point marker
    const fixedPointGraphics = new Graphics();
    pointsContainer.addChild(fixedPointGraphics);

    const fpx = toScreenX(func.fixedPoint[0]);
    const fpy = toScreenY(func.fixedPoint[1]);
    fixedPointGraphics.circle(fpx, fpy, 6);
    fixedPointGraphics.fill({ color: 0xf59e0b });

    // End label
    const endLabelStyle = new TextStyle({ fontSize: 12, fill: '#f59e0b' });
    const endLabel = new Text({ text: 'End', style: endLabelStyle });
    endLabel.x = fpx + 10;
    endLabel.y = fpy - 10;
    labelsContainer.addChild(endLabel);

    // Starting point marker
    const startPointGraphics = new Graphics();
    pointsContainer.addChild(startPointGraphics);

    const spx = toScreenX(x0[0]);
    const spy = toScreenY(x0[1]);
    startPointGraphics.circle(spx, spy, 6);
    startPointGraphics.fill({ color: 0x06b6d4 });

    // Start label
    const startLabelStyle = new TextStyle({ fontSize: 12, fill: '#06b6d4' });
    const startLabel = new Text({ text: 'Start', style: startLabelStyle });
    startLabel.x = spx + 10;
    startLabel.y = spy + 5;
    labelsContainer.addChild(startLabel);

    // Render trajectories for each enabled algorithm
    enabledAlgos.forEach(algo => {
      const result = results[algo.id];
      if (!result) return;

      const trajectoryGraphics = new Graphics();
      trajectoryContainer.addChild(trajectoryGraphics);

      const algoPointsGraphics = new Graphics();
      pointsContainer.addChild(algoPointsGraphics);

      const stepsToShow = result.steps.slice(0, currentStep + 1);
      const algoColor = hexToNumber(algo.color);

      // Draw lines
      stepsToShow.forEach((step, i) => {
        const px = step.x[0];
        const py = step.x[1];

        if (!isFinite(px) || !isFinite(py)) return;

        const nextStep = stepsToShow[i + 1];

        if (nextStep && isFinite(nextStep.x[0]) && isFinite(nextStep.x[1])) {
          const sx1 = toScreenX(px);
          const sy1 = toScreenY(py);
          const sx2 = toScreenX(nextStep.x[0]);
          const sy2 = toScreenY(nextStep.x[1]);

          trajectoryGraphics.moveTo(sx1, sy1);
          trajectoryGraphics.lineTo(sx2, sy2);
        }
      });

      trajectoryGraphics.stroke({ width: 2, color: algoColor, alpha: 0.7 });

      // Draw points
      stepsToShow.forEach((step, i) => {
        const px = step.x[0];
        const py = step.x[1];

        if (!isFinite(px) || !isFinite(py)) return;

        const sx = toScreenX(px);
        const sy = toScreenY(py);
        const isLast = i === stepsToShow.length - 1;

        algoPointsGraphics.circle(sx, sy, 4);
        algoPointsGraphics.fill({ color: algoColor, alpha: isLast ? 1 : 0.5 });
      });
    });

  }, [viewBox, xRange, yRange, func, results, currentStep, enabledAlgos, x0, isDark, isPlaying, initialDomain, isReady]);

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
        className="pixi-container relative h-[500px] cursor-grab active:cursor-grabbing overflow-hidden"
        style={{
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
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
