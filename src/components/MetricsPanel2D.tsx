import { ALGORITHMS } from '../algorithms/types';
import type { AlgorithmType, AlgorithmResults2D, Point2D } from '../algorithms/types';

// Steffensen's method doesn't generalize well to 2D
const ALGORITHMS_2D = ALGORITHMS.filter(a => a.id !== 'steffensen');

interface MetricsPanel2DProps {
  results: AlgorithmResults2D;
  enabledAlgorithms: Set<AlgorithmType>;
  currentStep: number;
  fixedPoint: Point2D;
  isDark: boolean;
}

export function MetricsPanel2D({
  results,
  enabledAlgorithms,
  currentStep,
  fixedPoint,
  isDark
}: MetricsPanel2DProps) {
  const baselineIterations = results['fixed-point']?.totalIterations ?? 0;
  const enabledAlgos = ALGORITHMS_2D.filter(a => enabledAlgorithms.has(a.id));

  return (
    <div className={`rounded-2xl backdrop-blur-sm border p-6 space-y-5 ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'
    }`}>
      <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        2D Metrics
      </h2>

      {/* Convergence Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <th className="pb-3">Algorithm</th>
              <th className="pb-3 text-right">Iter</th>
              <th className="pb-3 text-right">Speedup</th>
              <th className="pb-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
            {enabledAlgos.map(algo => {
              const result = results[algo.id];
              if (!result) {
                return (
                  <tr key={algo.id}>
                    <td className="py-3 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: algo.color }}
                      />
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>{algo.name}</span>
                    </td>
                    <td className={`py-3 text-right font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>-</td>
                    <td className={`py-3 text-right ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>-</td>
                    <td className="py-3 text-right">
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Not run</span>
                    </td>
                  </tr>
                );
              }

              const speedup = baselineIterations > 0 && algo.id !== 'fixed-point'
                ? ((baselineIterations - result.totalIterations) / baselineIterations * 100)
                : 0;

              return (
                <tr key={algo.id}>
                  <td className="py-3 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: algo.color,
                        boxShadow: `0 0 6px ${algo.color}50`
                      }}
                    />
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>{algo.name}</span>
                  </td>
                  <td className={`py-3 text-right font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {result.totalIterations}
                  </td>
                  <td className="py-3 text-right font-mono text-xs">
                    {algo.id === 'fixed-point' ? (
                      <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>baseline</span>
                    ) : speedup > 0 ? (
                      <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded">+{speedup.toFixed(0)}%</span>
                    ) : speedup < 0 ? (
                      <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded">{speedup.toFixed(0)}%</span>
                    ) : (
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>0%</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {result.converged ? (
                      <span className="text-green-500 text-xs flex items-center justify-end gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Done
                      </span>
                    ) : (
                      <span className="text-yellow-500 text-xs">Max iter</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Current Step Details */}
      <div className="pt-2">
        <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <span>Current Position</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            Step {currentStep + 1}
          </span>
        </h3>
        <div className={`space-y-2 text-sm font-mono rounded-lg p-3 ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
          {enabledAlgos.map(algo => {
            const result = results[algo.id];
            const step = result?.steps[Math.min(currentStep, (result?.steps.length ?? 1) - 1)];

            return (
              <div key={algo.id} className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: algo.color }}
                  />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{algo.name}</span>
                </span>
                <span className={isDark ? 'text-white' : 'text-slate-900'}>
                  {step ? `(${step.x[0].toFixed(4)}, ${step.x[1].toFixed(4)})` : '-'}
                </span>
              </div>
            );
          })}
          <div className={`flex justify-between items-center pt-2 mt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fixed Point</span>
            </span>
            <span className="text-yellow-500">({fixedPoint[0].toFixed(4)}, {fixedPoint[1].toFixed(4)})</span>
          </div>
        </div>
      </div>

      {/* Residual History */}
      <ResidualChart2D
        results={results}
        enabledAlgorithms={enabledAlgorithms}
        currentStep={currentStep}
        isDark={isDark}
      />
    </div>
  );
}

interface ResidualChart2DProps {
  results: AlgorithmResults2D;
  enabledAlgorithms: Set<AlgorithmType>;
  currentStep: number;
  isDark: boolean;
}

function ResidualChart2D({ results, enabledAlgorithms, currentStep, isDark }: ResidualChart2DProps) {
  const enabledAlgos = ALGORITHMS_2D.filter(a => enabledAlgorithms.has(a.id));

  const maxIter = Math.max(
    ...enabledAlgos.map(a => results[a.id]?.steps.length ?? 0)
  );

  if (maxIter === 0) {
    return (
      <div className={`rounded-lg p-6 text-center ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
        <svg className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Run algorithms to see residual convergence</p>
      </div>
    );
  }

  let minResidual = Infinity;
  let maxResidual = -Infinity;

  enabledAlgos.forEach(algo => {
    const result = results[algo.id];
    if (!result) return;

    result.steps.forEach(step => {
      if (step.residual > 0) {
        const logRes = Math.log10(step.residual);
        minResidual = Math.min(minResidual, logRes);
        maxResidual = Math.max(maxResidual, logRes);
      }
    });
  });

  minResidual = Math.floor(minResidual) - 1;
  maxResidual = Math.ceil(maxResidual) + 1;

  const chartHeight = 220;
  const chartWidth = 500;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (iter: number) => padding.left + (iter / Math.max(maxIter - 1, 1)) * plotWidth;
  const yScale = (logRes: number) => {
    const normalized = (logRes - maxResidual) / (minResidual - maxResidual);
    return padding.top + normalized * plotHeight;
  };

  const yTicks: number[] = [];
  const yStep = Math.ceil((maxResidual - minResidual) / 5);
  for (let val = maxResidual; val >= minResidual; val -= yStep) {
    yTicks.push(val);
  }

  const xTicks: number[] = [];
  const xStep = Math.max(1, Math.ceil(maxIter / 5));
  for (let i = 0; i < maxIter; i += xStep) {
    xTicks.push(i);
  }
  if (xTicks[xTicks.length - 1] !== maxIter - 1 && maxIter > 1) {
    xTicks.push(maxIter - 1);
  }

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#ffffff10' : '#00000010';
  const axisColor = isDark ? '#ffffff20' : '#00000020';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Residual Convergence <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>(log scale)</span>
        </h3>
        <div className="flex flex-wrap gap-3">
          {enabledAlgos.map(algo => (
            <div key={algo.id} className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5 rounded"
                style={{ backgroundColor: algo.color }}
              />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {algo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className={`w-full rounded-lg ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}
        style={{ minHeight: '200px', maxHeight: '280px' }}
      >
        <text
          x={12}
          y={chartHeight / 2}
          textAnchor="middle"
          fill={textColor}
          fontSize="9"
          transform={`rotate(-90, 12, ${chartHeight / 2})`}
        >
          Residual ||g(x) - x||
        </text>

        {yTicks.map(logVal => (
          <g key={`y-${logVal}`}>
            <line
              x1={padding.left}
              y1={yScale(logVal)}
              x2={chartWidth - padding.right}
              y2={yScale(logVal)}
              stroke={gridColor}
              strokeDasharray="2,4"
            />
            <text
              x={padding.left - 8}
              y={yScale(logVal)}
              textAnchor="end"
              dominantBaseline="middle"
              fill={textColor}
              fontSize="9"
              fontFamily="ui-monospace, monospace"
            >
              10
            </text>
            <text
              x={padding.left - 7}
              y={yScale(logVal) - 4}
              textAnchor="start"
              dominantBaseline="middle"
              fill={textColor}
              fontSize="7"
              fontFamily="ui-monospace, monospace"
            >
              {logVal}
            </text>
          </g>
        ))}

        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke={axisColor}
        />

        {xTicks.map(iter => (
          <g key={`x-${iter}`}>
            <line
              x1={xScale(iter)}
              y1={chartHeight - padding.bottom}
              x2={xScale(iter)}
              y2={chartHeight - padding.bottom + 4}
              stroke={axisColor}
            />
            <text
              x={xScale(iter)}
              y={chartHeight - padding.bottom + 14}
              textAnchor="middle"
              fill={textColor}
              fontSize="9"
              fontFamily="ui-monospace, monospace"
            >
              {iter + 1}
            </text>
          </g>
        ))}

        <text
          x={chartWidth / 2}
          y={chartHeight - 5}
          textAnchor="middle"
          fill={textColor}
          fontSize="9"
        >
          Iteration
        </text>

        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke={axisColor}
        />

        <line
          x1={xScale(currentStep)}
          y1={padding.top}
          x2={xScale(currentStep)}
          y2={chartHeight - padding.bottom}
          stroke="#fbbf24"
          strokeWidth="1.5"
          opacity="0.4"
        />

        {enabledAlgos.map(algo => {
          const result = results[algo.id];
          if (!result || result.steps.length === 0) return null;

          const points = result.steps
            .filter(s => s.residual > 0)
            .map((step, i) => ({
              x: xScale(i),
              y: yScale(Math.log10(step.residual))
            }));

          if (points.length < 2) return null;

          const pathD = points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
            .join(' ');

          return (
            <path
              key={algo.id}
              d={pathD}
              fill="none"
              stroke={algo.color}
              strokeWidth="2"
              opacity="0.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
    </div>
  );
}
