interface AnimationControlsProps {
  isPlaying: boolean;
  currentStep: number;
  maxSteps: number;
  animationSpeed: number;
  onSpeedChange: (speed: number) => void;
  onRun: () => void;
  onReset: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  isDark: boolean;
}

export function AnimationControls({
  isPlaying,
  currentStep,
  maxSteps,
  animationSpeed,
  onSpeedChange,
  onRun,
  onReset,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  isDark
}: AnimationControlsProps) {
  const hasResults = maxSteps > 0;
  const progress = hasResults ? ((currentStep + 1) / maxSteps) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Progress bar */}
      {hasResults && (
        <div className={`h-1 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div
            className="h-full bg-gradient-to-r from-gray-500 to-gray-400 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Controls bar */}
      <div className={`backdrop-blur-xl border-t ${
        isDark
          ? 'bg-gray-900/90 border-gray-700'
          : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Run/Reset */}
            <div className="flex items-center gap-2">
              <button
                onClick={onRun}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-medium py-2 px-5 rounded-lg shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Run
              </button>
              <button
                onClick={onReset}
                className={`font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  isDark
                    ? 'bg-gray-800/50 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-white'
                    : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 shadow-sm'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset
              </button>
            </div>

            {/* Center: Playback controls */}
            <div className="flex items-center gap-3">
              {/* Step backward */}
              <button
                onClick={onStepBackward}
                disabled={!hasResults || currentStep === 0}
                className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'hover:bg-gray-700 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title="Previous step"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Play/Pause */}
              <button
                onClick={isPlaying ? onPause : onPlay}
                disabled={!hasResults || (currentStep >= maxSteps - 1 && !isPlaying)}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium p-3 rounded-full shadow-lg shadow-gray-500/25 transition-all flex items-center justify-center"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Step forward */}
              <button
                onClick={onStepForward}
                disabled={!hasResults || currentStep >= maxSteps - 1}
                className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'hover:bg-gray-700 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                title="Next step"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Step counter */}
              {hasResults && (
                <div className={`ml-2 px-3 py-1.5 rounded-lg font-mono text-sm ${
                  isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  <span className="text-gray-900 dark:text-white font-semibold">{currentStep + 1}</span>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}> / {maxSteps}</span>
                </div>
              )}
            </div>

            {/* Right: Speed control */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <input
                  type="range"
                  min={50}
                  max={1000}
                  step={50}
                  value={animationSpeed}
                  onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                  className="w-24 slider"
                  title={`Animation speed: ${animationSpeed}ms`}
                />
                <span className={`text-xs font-mono w-14 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {animationSpeed}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
