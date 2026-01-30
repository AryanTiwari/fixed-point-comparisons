import { useState, useCallback, useEffect, useRef } from 'react';
import { AlgorithmGraph } from './AlgorithmGraph';
import { ALGORITHMS } from '../algorithms/types';
import type { ExampleFunction, AlgorithmType } from '../algorithms/types';
import type { AlgorithmResults } from '../hooks/useIterationRunner';

export interface ViewBox {
  x: [number, number];
  y: [number, number];
}

interface GraphGridProps {
  func: ExampleFunction;
  results: AlgorithmResults;
  currentStep: number;
  enabledAlgorithms: Set<AlgorithmType>;
  x0: number;
  isDark: boolean;
}

export function GraphGrid({
  func,
  results,
  currentStep,
  enabledAlgorithms,
  x0,
  isDark
}: GraphGridProps) {
  // Ref for requestAnimationFrame to prevent visual glitches
  const rafRef = useRef<number | null>(null);
  const pendingUpdate = useRef<ViewBox | null>(null);

  // Shared viewBox state for synchronized pan/zoom
  const [viewBox, setViewBox] = useState<ViewBox>(() => {
    const [xMin, xMax] = func.domain;
    const padding = (xMax - xMin) * 0.1;
    return {
      x: [xMin - padding, xMax + padding],
      y: [xMin - padding, xMax + padding]
    };
  });

  // Track if we've already zoomed for the current results
  const hasZoomedRef = useRef(false);

  // Reset viewBox when function changes
  useEffect(() => {
    const [xMin, xMax] = func.domain;
    const padding = (xMax - xMin) * 0.1;
    setViewBox({
      x: [xMin - padding, xMax + padding],
      y: [xMin - padding, xMax + padding]
    });
    hasZoomedRef.current = false;
  }, [func]);

  // Auto-zoom to fixed point area when animation starts (results become available)
  useEffect(() => {
    const hasResults = Object.values(results).some(r => r !== null);

    if (hasResults && !hasZoomedRef.current) {
      hasZoomedRef.current = true;

      // Zoom to area around fixed point with some padding
      const fixedPoint = func.fixedPoint;
      const zoomRange = 2; // Show +/- 1 unit around the fixed point

      setViewBox({
        x: [fixedPoint - zoomRange, fixedPoint + zoomRange],
        y: [fixedPoint - zoomRange, fixedPoint + zoomRange]
      });
    } else if (!hasResults) {
      // Reset the flag when results are cleared
      hasZoomedRef.current = false;
    }
  }, [results, func.fixedPoint]);

  // Cleanup requestAnimationFrame on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Handle pan (called when any graph is panned)
  const handlePan = useCallback((dx: number, dy: number) => {
    setViewBox(prev => ({
      x: [prev.x[0] + dx, prev.x[1] + dx],
      y: [prev.y[0] + dy, prev.y[1] + dy]
    }));
  }, []);

  // Handle zoom (called when any graph is zoomed)
  // Uses constant zoom amount for consistent feel at all zoom levels
  // Uses requestAnimationFrame to prevent visual glitches
  const handleZoom = useCallback((zoomIn: boolean, centerX: number, centerY: number) => {
    // Calculate the new viewBox
    const currentViewBox = pendingUpdate.current || viewBox;
    const xRange = currentViewBox.x[1] - currentViewBox.x[0];
    const yRange = currentViewBox.y[1] - currentViewBox.y[0];

    // Constant zoom amount (0.5 units per scroll tick)
    const zoomAmount = 0.5;
    const delta = zoomIn ? -zoomAmount : zoomAmount;

    // Apply zoom equally to both axes
    const newXRange = Math.max(0.1, xRange + delta * 2); // Minimum range of 0.1
    const newYRange = Math.max(0.1, yRange + delta * 2);

    // Zoom centered on the mouse position
    const xRatio = (centerX - currentViewBox.x[0]) / xRange;
    const yRatio = (centerY - currentViewBox.y[0]) / yRange;

    const newViewBox: ViewBox = {
      x: [centerX - newXRange * xRatio, centerX + newXRange * (1 - xRatio)],
      y: [centerY - newYRange * yRatio, centerY + newYRange * (1 - yRatio)]
    };

    // Store the pending update
    pendingUpdate.current = newViewBox;

    // Cancel any pending RAF and schedule a new one
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (pendingUpdate.current) {
        setViewBox(pendingUpdate.current);
        pendingUpdate.current = null;
      }
      rafRef.current = null;
    });
  }, [viewBox]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ALGORITHMS.map(algo => {
        const isEnabled = enabledAlgorithms.has(algo.id);
        const result = results[algo.id] || null;

        return (
          <div
            key={algo.id}
            className={`transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-40'}`}
          >
            <AlgorithmGraph
              algorithm={algo}
              func={func}
              result={isEnabled ? result : null}
              currentStep={currentStep}
              x0={x0}
              viewBox={viewBox}
              onPan={handlePan}
              onZoom={handleZoom}
              isDark={isDark}
            />
          </div>
        );
      })}
    </div>
  );
}
