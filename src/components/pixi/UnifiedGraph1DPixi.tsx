import { useRef, useEffect, useCallback, useState } from 'react';
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js';
import { ALGORITHMS } from '../../algorithms/types';
import type { ExampleFunction, AlgorithmType, IterationResult, IterationStep } from '../../algorithms/types';
import { Formula } from '../Formula';

export interface ViewBox {
  x: [number, number];
  y: [number, number];
}

interface UnifiedGraph1DPixiProps {
  func: ExampleFunction;
  results: {
    'fixed-point': IterationResult | null;
    'anderson': IterationResult | null;
    'steffensen': IterationResult | null;
    'newton': IterationResult | null;
  };
  currentStep: number;
  enabledAlgorithms: Set<AlgorithmType>;
  viewBox: ViewBox;
  onPan: (dx: number, dy: number) => void;
  onZoom: (zoomIn: boolean, centerX: number, centerY: number) => void;
  onStartPointChange?: (newX0: number) => void;
  x0: number;
  isDark: boolean;
}

function calculateTickInterval(range: number): number {
  const roughTickCount = 10; // More tick marks
  const roughInterval = range / roughTickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
  const residual = roughInterval / magnitude;

  let niceInterval: number;
  if (residual <= 1.5) niceInterval = 1;
  else if (residual <= 3) niceInterval = 2;
  else if (residual <= 7) niceInterval = 5;
  else niceInterval = 10;

  return niceInterval * magnitude;
}

function formatTickLabel(value: number, interval: number): string {
  if (interval >= 1) return value.toFixed(0);
  if (interval >= 0.1) return value.toFixed(1);
  if (interval >= 0.01) return value.toFixed(2);
  return value.toFixed(3);
}

function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function UnifiedGraph1DPixi({
  func,
  results,
  currentStep,
  enabledAlgorithms,
  viewBox,
  onPan,
  onZoom,
  onStartPointChange,
  x0,
  isDark
}: UnifiedGraph1DPixiProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const isDragging = useRef(false);
  const isDraggingStartPoint = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);

  const transformRef = useRef<{
    toMathX: (sx: number) => number;
  } | null>(null);

  const xRange = viewBox.x[1] - viewBox.x[0];
  const yRange = viewBox.y[1] - viewBox.y[0];

  const enabledAlgos = ALGORITHMS.filter(a => enabledAlgorithms.has(a.id));

  // Initialize Pixi Application
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
      appRef.current.renderer.background.color = isDark ? 0x0f172a : 0xf1f5f9;
    }
  }, [isDark, isReady]);

  // Main render effect
  useEffect(() => {
    const app = appRef.current;
    if (!app || !app.stage || !isReady) return;

    app.stage.removeChildren();

    const width = app.screen.width;
    const height = app.screen.height;

    // Calculate 1:1 aspect ratio scaling
    const scaleX = width / xRange;
    const scaleY = height / yRange;
    const scale = Math.min(scaleX, scaleY);

    const graphWidth = xRange * scale;
    const graphHeight = yRange * scale;
    const offsetX = (width - graphWidth) / 2;
    const offsetY = (height - graphHeight) / 2;

    // Coordinate transformations
    const toScreenX = (x: number) => offsetX + ((x - viewBox.x[0]) / xRange) * graphWidth;
    const toScreenY = (y: number) => offsetY + ((viewBox.y[1] - y) / yRange) * graphHeight;
    const toMathX = (sx: number) => viewBox.x[0] + ((sx - offsetX) / graphWidth) * xRange;

    transformRef.current = { toMathX };

    const tickInterval = calculateTickInterval(Math.max(xRange, yRange));

    // Theme colors
    const gridColor = isDark ? 0x334155 : 0xcbd5e1;
    const axisColor = isDark ? 0x64748b : 0x64748b;
    const tickLabelColor = isDark ? '#94a3b8' : '#475569';
    const identityLineColor = isDark ? 0x475569 : 0x64748b;
    const functionColor = isDark ? 0x60a5fa : 0x2563eb;

    // Create containers
    const gridContainer = new Container();
    const curvesContainer = new Container();
    const iterationContainer = new Container();
    const pointsContainer = new Container();
    const labelsContainer = new Container();

    app.stage.addChild(gridContainer);
    app.stage.addChild(curvesContainer);
    app.stage.addChild(iterationContainer);
    app.stage.addChild(pointsContainer);
    app.stage.addChild(labelsContainer);

    // Draw grid
    const gridGraphics = new Graphics();
    gridContainer.addChild(gridGraphics);

    // Calculate the full visible range in math coordinates (including offset areas)
    const toMathXLocal = (sx: number) => viewBox.x[0] + ((sx - offsetX) / graphWidth) * xRange;
    const toMathYLocal = (sy: number) => viewBox.y[1] - ((sy - offsetY) / graphHeight) * yRange;

    const screenLeftX = toMathXLocal(0);
    const screenRightX = toMathXLocal(width);
    const screenTopY = toMathYLocal(0);
    const screenBottomY = toMathYLocal(height);

    // Draw vertical grid lines across full screen width
    const xStartFull = Math.floor(screenLeftX / tickInterval) * tickInterval;
    const xEndFull = Math.ceil(screenRightX / tickInterval) * tickInterval;

    for (let x = xStartFull; x <= xEndFull; x += tickInterval) {
      const sx = toScreenX(x);
      if (sx >= 0 && sx <= width) {
        gridGraphics.moveTo(sx, 0);
        gridGraphics.lineTo(sx, height);
      }
    }

    // Draw horizontal grid lines across full screen height
    const yStartFull = Math.floor(screenBottomY / tickInterval) * tickInterval;
    const yEndFull = Math.ceil(screenTopY / tickInterval) * tickInterval;

    for (let y = yStartFull; y <= yEndFull; y += tickInterval) {
      const sy = toScreenY(y);
      if (sy >= 0 && sy <= height) {
        gridGraphics.moveTo(0, sy);
        gridGraphics.lineTo(width, sy);
      }
    }

    gridGraphics.stroke({ width: 1, color: gridColor });

    // Draw axes
    const axesGraphics = new Graphics();
    gridContainer.addChild(axesGraphics);

    const yAxisScreen = toScreenY(0);
    if (yAxisScreen >= 0 && yAxisScreen <= height) {
      axesGraphics.moveTo(0, yAxisScreen);
      axesGraphics.lineTo(width, yAxisScreen);
    }

    const xAxisScreen = toScreenX(0);
    if (xAxisScreen >= 0 && xAxisScreen <= width) {
      axesGraphics.moveTo(xAxisScreen, 0);
      axesGraphics.lineTo(xAxisScreen, height);
    }

    axesGraphics.stroke({ width: 1.5, color: axisColor });

    // Tick labels with larger font and background
    const labelStyle = new TextStyle({
      fontSize: 12,
      fill: tickLabelColor,
      fontWeight: '500'
    });
    const labelBgColor = isDark ? 0x0f172a : 0xf1f5f9;

    for (let x = xStartFull; x <= xEndFull; x += tickInterval) {
      if (Math.abs(x) > 0.001) {
        const sx = toScreenX(x);
        const labelY = Math.min(Math.max(toScreenY(0) + 8, 20), height - 25);

        // Background for label
        const bg = new Graphics();
        const label = new Text({ text: formatTickLabel(x, tickInterval), style: labelStyle });
        label.anchor.set(0.5, 0);
        label.x = sx;
        label.y = labelY;

        bg.roundRect(sx - label.width / 2 - 3, labelY - 2, label.width + 6, label.height + 4, 3);
        bg.fill({ color: labelBgColor, alpha: 0.9 });

        if (sx > 25 && sx < width - 25) {
          labelsContainer.addChild(bg);
          labelsContainer.addChild(label);
        }
      }
    }

    for (let y = yStartFull; y <= yEndFull; y += tickInterval) {
      if (Math.abs(y) > 0.001) {
        const sy = toScreenY(y);
        const labelX = Math.min(Math.max(toScreenX(0) - 8, 30), width - 10);

        // Background for label
        const bg = new Graphics();
        const label = new Text({ text: formatTickLabel(y, tickInterval), style: labelStyle });
        label.anchor.set(1, 0.5);
        label.x = labelX;
        label.y = sy;

        bg.roundRect(labelX - label.width - 3, sy - label.height / 2 - 2, label.width + 6, label.height + 4, 3);
        bg.fill({ color: labelBgColor, alpha: 0.9 });

        if (sy > 20 && sy < height - 20) {
          labelsContainer.addChild(bg);
          labelsContainer.addChild(label);
        }
      }
    }

    // Draw identity line y = x (dashed)
    const identityGraphics = new Graphics();
    curvesContainer.addChild(identityGraphics);

    const minVal = Math.min(viewBox.x[0], viewBox.y[0]);
    const maxVal = Math.max(viewBox.x[1], viewBox.y[1]);
    const dashLength = 12;
    const gapLength = 6;
    const range = maxVal - minVal;
    const step = (dashLength + gapLength) * (range / graphWidth);

    for (let v = minVal; v < maxVal; v += step) {
      const vEnd = Math.min(v + step * (dashLength / (dashLength + gapLength)), maxVal);
      identityGraphics.moveTo(toScreenX(v), toScreenY(v));
      identityGraphics.lineTo(toScreenX(vEnd), toScreenY(vEnd));
    }

    identityGraphics.stroke({ width: 1.5, color: identityLineColor });

    // Draw g(x) function curve - sample across full screen width
    const functionGraphics = new Graphics();
    curvesContainer.addChild(functionGraphics);

    const numSamples = 500;
    let firstPoint = true;

    // Use screen edges already calculated above for grid lines
    const sampleMin = screenLeftX - xRange * 0.05;
    const sampleMax = screenRightX + xRange * 0.05;
    const sampleRange = sampleMax - sampleMin;

    for (let i = 0; i <= numSamples; i++) {
      const x = sampleMin + (i / numSamples) * sampleRange;
      try {
        const y = func.g(x);
        if (isFinite(y)) {
          const sx = toScreenX(x);
          const sy = toScreenY(y);

          // Only clip vertically, not horizontally
          if (sy >= -50 && sy <= height + 50) {
            if (firstPoint) {
              functionGraphics.moveTo(sx, sy);
              firstPoint = false;
            } else {
              functionGraphics.lineTo(sx, sy);
            }
          } else {
            firstPoint = true;
          }
        } else {
          firstPoint = true;
        }
      } catch {
        firstPoint = true;
      }
    }

    functionGraphics.stroke({ width: 2.5, color: functionColor });

    // Fixed point marker
    const fixedPointGraphics = new Graphics();
    pointsContainer.addChild(fixedPointGraphics);

    const fpx = toScreenX(func.fixedPoint);
    const fpy = toScreenY(func.fixedPoint);
    fixedPointGraphics.circle(fpx, fpy, 6);
    fixedPointGraphics.fill({ color: 0xf59e0b });

    // Render iteration paths for each enabled algorithm
    enabledAlgos.forEach(algo => {
      const result = results[algo.id];
      if (!result) return;

      const iterGraphics = new Graphics();
      iterationContainer.addChild(iterGraphics);

      const iterPointsGraphics = new Graphics();
      pointsContainer.addChild(iterPointsGraphics);

      const stepsToShow = result.steps.slice(0, currentStep + 1);
      const algoColor = hexToNumber(algo.color);

      // Newton's method uses a different visualization since x_{n+1} != g(x_n)
      const isNewton = algo.id === 'newton';

      stepsToShow.forEach((step: IterationStep, i: number) => {
        const x = step.x;
        const gx = step.fx;

        if (!isFinite(x) || !isFinite(gx)) return;

        const nextStep = stepsToShow[i + 1];
        const nextX = nextStep?.x;
        const nextGx = nextStep?.fx;

        const sx = toScreenX(x);
        const syOnCurve = toScreenY(gx);

        if (isNewton) {
          // Newton's method: just show direct connections between consecutive points
          // Draw point on the curve at (x, g(x))
          const isLast = i === stepsToShow.length - 1;
          iterPointsGraphics.circle(sx, syOnCurve, 4);
          iterPointsGraphics.fill({ color: algoColor, alpha: isLast ? 1 : 0.4 });

          // Draw line to next point on curve
          if (nextX !== undefined && nextGx !== undefined && isFinite(nextX) && isFinite(nextGx)) {
            const sxNext = toScreenX(nextX);
            const syNext = toScreenY(nextGx);
            iterGraphics.moveTo(sx, syOnCurve);
            iterGraphics.lineTo(sxNext, syNext);
          }
        } else {
          // Standard cobweb diagram for fixed-point, anderson, steffensen
          const syStart = toScreenY(x);

          // Vertical line from (x, x) to (x, g(x))
          iterGraphics.moveTo(sx, syStart);
          iterGraphics.lineTo(sx, syOnCurve);

          // Horizontal line from (x, g(x)) to (nextX, nextX) on the identity line
          if (nextX !== undefined && isFinite(nextX)) {
            const sxEnd = toScreenX(nextX);
            const syEnd = toScreenY(nextX); // y = nextX on the identity line
            iterGraphics.moveTo(sx, syOnCurve);
            iterGraphics.lineTo(sxEnd, syEnd);
          }

          // Point at current iterate
          const isLast = i === stepsToShow.length - 1;
          iterPointsGraphics.circle(sx, syOnCurve, 4);
          iterPointsGraphics.fill({ color: algoColor, alpha: isLast ? 1 : 0.4 });
        }
      });

      iterGraphics.stroke({ width: 2, color: algoColor, alpha: 0.7 });
    });

    // Starting point marker (draggable)
    const startY = func.g(x0);
    if (isFinite(startY)) {
      const startPointGraphics = new Graphics();
      pointsContainer.addChild(startPointGraphics);

      const spx = toScreenX(x0);
      const spy = toScreenY(startY);

      startPointGraphics.circle(spx, spy, 12);
      startPointGraphics.fill({ color: 0x06b6d4, alpha: 0 });
      startPointGraphics.circle(spx, spy, 8);
      startPointGraphics.fill({ color: 0x06b6d4 });
      startPointGraphics.circle(spx, spy, 8);
      startPointGraphics.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });

      if (onStartPointChange) {
        startPointGraphics.eventMode = 'static';
        startPointGraphics.cursor = 'grab';

        startPointGraphics.on('pointerdown', (event) => {
          isDraggingStartPoint.current = true;
          startPointGraphics.cursor = 'grabbing';
          event.stopPropagation();
        });

        startPointGraphics.on('globalpointermove', (event) => {
          if (!isDraggingStartPoint.current || !transformRef.current) return;
          const newX = transformRef.current.toMathX(event.global.x);
          const [domainMin, domainMax] = func.domain;
          const clampedX = Math.max(domainMin, Math.min(domainMax, newX));
          onStartPointChange(clampedX);
        });

        startPointGraphics.on('pointerup', () => {
          isDraggingStartPoint.current = false;
          startPointGraphics.cursor = 'grab';
        });

        startPointGraphics.on('pointerupoutside', () => {
          isDraggingStartPoint.current = false;
          startPointGraphics.cursor = 'grab';
        });
      }

      // Start label with background
      const startLabelStyle = new TextStyle({ fontSize: 14, fill: '#06b6d4', fontWeight: '600' });
      const startLabel = new Text({ text: 'Start', style: startLabelStyle });
      startLabel.x = spx + 12;
      startLabel.y = spy + 5;

      // Background for start label
      const startLabelBg = new Graphics();
      startLabelBg.roundRect(spx + 9, spy + 2, startLabel.width + 6, startLabel.height + 4, 4);
      startLabelBg.fill({ color: labelBgColor, alpha: 0.95 });
      labelsContainer.addChild(startLabelBg);
      labelsContainer.addChild(startLabel);
    }

  }, [viewBox, xRange, yRange, func, results, currentStep, enabledAlgos, x0, isDark, isReady, onStartPointChange]);

  // Mouse handlers for pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current || isDraggingStartPoint.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = -((e.clientX - lastPos.current.x) / rect.width) * xRange;
    const dy = ((e.clientY - lastPos.current.y) / rect.height) * yRange;

    lastPos.current = { x: e.clientX, y: e.clientY };
    onPan(dx, dy);
  }, [xRange, yRange, onPan]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    isDraggingStartPoint.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Global mouseup handler to stop dragging anywhere
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
      isDraggingStartPoint.current = false;
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('pointerup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('pointerup', handleGlobalMouseUp);
    };
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
          <div className="flex items-center gap-3">
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Iteration Methods Comparison
            </span>
            {func.latex ? (
              <span className={`px-2.5 py-1 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Formula math={func.latex} />
              </span>
            ) : (
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {func.name}
              </span>
            )}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-5 text-base">
            {enabledAlgos.map(algo => (
              <div key={algo.id} className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: algo.color }}
                />
                <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{algo.name}</span>
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
          backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
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
              x* = {func.fixedPoint.toFixed(4)}
            </span>
          </span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Start: <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              x₀ = {x0.toFixed(2)}
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
