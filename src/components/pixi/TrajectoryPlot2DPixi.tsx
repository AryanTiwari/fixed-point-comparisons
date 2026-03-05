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
  onStartPointChange?: (newX0: Point2D) => void;
  onResetZoom?: () => void;
  onResetStart?: () => void;
  x0: Point2D;
  isDark: boolean;
  isPlaying?: boolean;
}

function calculateTickInterval(range: number): number {
  const targetTickCount = 10; // More tick marks
  const roughInterval = range / targetTickCount;
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
  onStartPointChange,
  onResetZoom,
  onResetStart,
  x0,
  isDark,
  isPlaying = false
}: TrajectoryPlot2DPixiProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const isDragging = useRef(false);
  const isDraggingStartPoint = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);

  // Store transform functions for use in event handlers
  const transformRef = useRef<{
    toMathX: (sx: number) => number;
    toMathY: (sy: number) => number;
  } | null>(null);

  const xRange = viewBox.x[1] - viewBox.x[0];
  const yRange = viewBox.y[1] - viewBox.y[0];

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
      appRef.current.renderer.background.color = isDark ? 0x0f172a : 0xf1f5f9;
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
    const toMathX = (sx: number) => viewBox.x[0] + ((sx - offsetX) / graphWidth) * xRange;
    const toMathY = (sy: number) => viewBox.y[1] - ((sy - offsetY) / graphHeight) * yRange;

    // Store transforms for event handlers
    transformRef.current = { toMathX, toMathY };

    const tickInterval = calculateTickInterval(Math.max(xRange, yRange));

    // Theme colors
    const gridColor = isDark ? 0x334155 : 0xcbd5e1;
    const axisColor = isDark ? 0x64748b : 0x64748b;
    const tickLabelColor = isDark ? '#94a3b8' : '#475569';

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

    // X axis
    const yAxisScreen = toScreenY(0);
    if (yAxisScreen >= 0 && yAxisScreen <= height) {
      axesGraphics.moveTo(0, yAxisScreen);
      axesGraphics.lineTo(width, yAxisScreen);
    }

    // Y axis (center)
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

    // Vector field
    const vectorGraphics = new Graphics();
    vectorContainer.addChild(vectorGraphics);

    const gridSize = 8;
    const domainXRange = initialDomain.x[1] - initialDomain.x[0];
    const domainYRange = initialDomain.y[1] - initialDomain.y[0];
    const xStep = domainXRange / (gridSize + 1);
    const yStep = domainYRange / (gridSize + 1);
    const fixedArrowLength = Math.min(domainXRange, domainYRange) / 28;

    const vectorColor = isDark ? 0x94a3b8 : 0x475569;
    const vectorAlpha = isDark ? 0.8 : 0.7;

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
              const headLength = 8;
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

    vectorGraphics.stroke({ width: 2.5, color: vectorColor, alpha: vectorAlpha });

    // Fixed point marker
    const fixedPointGraphics = new Graphics();
    pointsContainer.addChild(fixedPointGraphics);

    const fpx = toScreenX(func.fixedPoint[0]);
    const fpy = toScreenY(func.fixedPoint[1]);
    fixedPointGraphics.circle(fpx, fpy, 6);
    fixedPointGraphics.fill({ color: 0xf59e0b });

    // End label
    const endLabelStyle = new TextStyle({ fontSize: 14, fill: '#f59e0b', fontWeight: '600' });
    const endLabel = new Text({ text: 'End', style: endLabelStyle });
    endLabel.x = fpx + 10;
    endLabel.y = fpy - 10;
    labelsContainer.addChild(endLabel);

    // Secondary fixed point marker (if exists)
    if (func.secondaryFixedPoint) {
      const secondaryGraphics = new Graphics();
      pointsContainer.addChild(secondaryGraphics);

      const sfpx = toScreenX(func.secondaryFixedPoint[0]);
      const sfpy = toScreenY(func.secondaryFixedPoint[1]);

      // Draw as hollow circle to indicate unstable
      secondaryGraphics.circle(sfpx, sfpy, 6);
      secondaryGraphics.stroke({ width: 2, color: 0xf59e0b });

      const secondaryLabelStyle = new TextStyle({ fontSize: 12, fill: '#f59e0b', fontWeight: '500' });
      const secondaryLabel = new Text({ text: 'End (unstable)', style: secondaryLabelStyle });
      secondaryLabel.x = sfpx + 10;
      secondaryLabel.y = sfpy - 10;
      labelsContainer.addChild(secondaryLabel);
    }

    // Starting point marker (draggable)
    const startPointGraphics = new Graphics();
    pointsContainer.addChild(startPointGraphics);

    const spx = toScreenX(x0[0]);
    const spy = toScreenY(x0[1]);

    // Draw a larger hit area for easier dragging
    startPointGraphics.circle(spx, spy, 12);
    startPointGraphics.fill({ color: 0x06b6d4, alpha: 0 }); // Invisible hit area
    startPointGraphics.circle(spx, spy, 8);
    startPointGraphics.fill({ color: 0x06b6d4 });
    startPointGraphics.circle(spx, spy, 8);
    startPointGraphics.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });

    // Make start point interactive
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
        const newY = transformRef.current.toMathY(event.global.y);
        // No clamping - allow dragging anywhere in the visible area
        onStartPointChange([newX, newY]);
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
    const startLabel = new Text({ text: 'Start (drag to move)', style: startLabelStyle });
    startLabel.x = spx + 12;
    startLabel.y = spy + 5;

    // Background for start label
    const startLabelBg = new Graphics();
    startLabelBg.roundRect(spx + 9, spy + 2, startLabel.width + 6, startLabel.height + 4, 4);
    startLabelBg.fill({ color: labelBgColor, alpha: 0.95 });
    labelsContainer.addChild(startLabelBg);
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

  }, [viewBox, xRange, yRange, func, results, currentStep, enabledAlgos, x0, isDark, isPlaying, initialDomain, isReady, onStartPointChange]);

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
    // Use current xRange/yRange so panning scales with zoom level
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
            <span className={`px-4 py-1.5 rounded-lg whitespace-nowrap ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {func.name}
              </span>
            </span>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-base">
            {ALGORITHMS_2D.map(algo => {
              const isEnabled = enabledAlgorithms.has(algo.id);
              return (
                <div
                  key={algo.id}
                  className={`flex items-center gap-2 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-30'}`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: algo.color }}
                  />
                  <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{algo.name}</span>
                </div>
              );
            })}
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
              ({func.fixedPoint[0].toFixed(2)}, {func.fixedPoint[1].toFixed(2)})
            </span>
          </span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Start: <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ({x0[0].toFixed(2)}, {x0[1].toFixed(2)})
            </span>
          </span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Step: <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentStep}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onResetStart && (
            <button
              onClick={onResetStart}
              className={`px-2 py-1 rounded text-xs transition-all ${
                isDark
                  ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                  : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
              }`}
              title="Reset starting point"
            >
              Reset Start
            </button>
          )}
          {onResetZoom && (
            <button
              onClick={onResetZoom}
              className={`px-2 py-1 rounded text-xs transition-all ${
                isDark
                  ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              title="Reset zoom"
            >
              Reset Zoom
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
