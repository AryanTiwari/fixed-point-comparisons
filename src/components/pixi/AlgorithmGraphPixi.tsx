import { useRef, useEffect, useCallback, useState } from 'react';
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js';
import { Formula } from '../Formula';
import { FORMULAS } from '../../constants/formulas';
import type { ExampleFunction, AlgorithmInfo, IterationResult, IterationStep } from '../../algorithms/types';
import type { ViewBox } from '../GraphGrid';

interface AlgorithmGraphPixiProps {
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

function formatTickLabel(value: number, interval: number): string {
  if (interval >= 1) return value.toFixed(0);
  if (interval >= 0.1) return value.toFixed(1);
  if (interval >= 0.01) return value.toFixed(2);
  return value.toFixed(3);
}

function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function AlgorithmGraphPixi({
  algorithm,
  func,
  result,
  currentStep,
  x0,
  viewBox,
  onPan,
  onZoom,
  isDark
}: AlgorithmGraphPixiProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);

  const formula = FORMULAS[algorithm.id];

  const xRange = viewBox.x[1] - viewBox.x[0];
  const yRange = viewBox.y[1] - viewBox.y[0];

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

    app.stage.removeChildren();

    const width = app.screen.width;
    const height = app.screen.height;

    // Calculate 1:1 aspect ratio scaling
    const scaleX = width / xRange;
    const scaleY = height / yRange;
    const scale = Math.min(scaleX, scaleY);

    // Calculate offsets to center the graph
    const graphWidth = xRange * scale;
    const graphHeight = yRange * scale;
    const offsetX = (width - graphWidth) / 2;
    const offsetY = (height - graphHeight) / 2;

    // Coordinate transformation functions with 1:1 aspect ratio
    const toScreenX = (x: number) => offsetX + ((x - viewBox.x[0]) / xRange) * graphWidth;
    const toScreenY = (y: number) => offsetY + ((viewBox.y[1] - y) / yRange) * graphHeight;

    const tickInterval = calculateTickInterval(Math.max(xRange, yRange));

    // Theme colors
    const gridColor = isDark ? 0x334155 : 0xe2e8f0;
    const axisColor = isDark ? 0x64748b : 0x94a3b8;
    const tickLabelColor = isDark ? '#94a3b8' : '#64748b';
    const identityLineColor = isDark ? 0x475569 : 0x94a3b8;
    const functionColor = isDark ? 0x60a5fa : 0x3b82f6;

    // Create containers for layering
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

    const xStart = Math.ceil(viewBox.x[0] / tickInterval) * tickInterval;
    const yStart = Math.ceil(viewBox.y[0] / tickInterval) * tickInterval;

    for (let x = xStart; x <= viewBox.x[1]; x += tickInterval) {
      const sx = toScreenX(x);
      gridGraphics.moveTo(sx, 0);
      gridGraphics.lineTo(sx, height);
    }

    for (let y = yStart; y <= viewBox.y[1]; y += tickInterval) {
      const sy = toScreenY(y);
      gridGraphics.moveTo(0, sy);
      gridGraphics.lineTo(width, sy);
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

    // Draw identity line y = x (dashed)
    const identityGraphics = new Graphics();
    curvesContainer.addChild(identityGraphics);

    const minVal = Math.min(viewBox.x[0], viewBox.y[0]);
    const maxVal = Math.max(viewBox.x[1], viewBox.y[1]);

    // Draw dashed identity line with limited segments for performance
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

    // Draw g(x) function curve
    const functionGraphics = new Graphics();
    curvesContainer.addChild(functionGraphics);

    // Use fewer samples for better performance
    const numSamples = 150;
    let firstPoint = true;

    for (let i = 0; i <= numSamples; i++) {
      const x = viewBox.x[0] + (i / numSamples) * xRange;
      try {
        const y = func.g(x);
        if (isFinite(y) && y >= viewBox.y[0] - yRange && y <= viewBox.y[1] + yRange) {
          const sx = toScreenX(x);
          const sy = toScreenY(y);

          if (firstPoint) {
            functionGraphics.moveTo(sx, sy);
            firstPoint = false;
          } else {
            functionGraphics.lineTo(sx, sy);
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
    fixedPointGraphics.circle(fpx, fpy, 5);
    fixedPointGraphics.fill({ color: 0xf59e0b });

    // Starting point marker
    const startY = func.g(x0);
    if (isFinite(startY)) {
      const startPointGraphics = new Graphics();
      pointsContainer.addChild(startPointGraphics);

      const spx = toScreenX(x0);
      const spy = toScreenY(startY);
      startPointGraphics.circle(spx, spy, 5);
      startPointGraphics.fill({ color: 0x06b6d4 });
    }

    // Iteration path (cobweb)
    if (result) {
      const iterGraphics = new Graphics();
      iterationContainer.addChild(iterGraphics);

      const iterPointsGraphics = new Graphics();
      pointsContainer.addChild(iterPointsGraphics);

      const stepsToShow = result.steps.slice(0, currentStep + 1);
      const algoColor = hexToNumber(algorithm.color);

      stepsToShow.forEach((step: IterationStep, i: number) => {
        const x = step.x;
        const gx = step.fx;

        if (!isFinite(x) || !isFinite(gx)) return;

        const nextStep = stepsToShow[i + 1];
        const nextX = nextStep?.x;

        // Vertical line from (x, x) to (x, g(x))
        const sx = toScreenX(x);
        const syStart = toScreenY(x);
        const syEnd = toScreenY(gx);

        iterGraphics.moveTo(sx, syStart);
        iterGraphics.lineTo(sx, syEnd);

        // Horizontal line from (x, g(x)) to (nextX, nextX)
        if (nextX !== undefined && isFinite(nextX)) {
          const sxEnd = toScreenX(nextX);
          const syHoriz = toScreenY(gx);

          iterGraphics.moveTo(sx, syHoriz);
          iterGraphics.lineTo(sxEnd, syHoriz);
        }

        // Point at current iterate
        const isLast = i === stepsToShow.length - 1;
        iterPointsGraphics.circle(sx, syEnd, 4);
        iterPointsGraphics.fill({ color: algoColor, alpha: isLast ? 1 : 0.4 });
      });

      iterGraphics.stroke({ width: 1.5, color: algoColor, alpha: 0.7 });
    }

  }, [viewBox, xRange, yRange, func, result, currentStep, x0, algorithm, isDark, isReady]);

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
        className="pixi-container relative h-[280px] cursor-grab active:cursor-grabbing overflow-hidden"
        style={{
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
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
