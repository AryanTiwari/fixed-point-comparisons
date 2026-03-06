import { useRef, useCallback } from 'react';

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
  onSeek?: (step: number) => void;
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
  onSeek,
  isDark
}: AnimationControlsProps) {
  const hasResults = maxSteps > 0;
  const progress = hasResults ? ((currentStep + 1) / maxSteps) * 100 : 0;
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Convert ms to steps per second
  const getStepsPerSec = (ms: number) => {
    return (1000 / ms).toFixed(1).replace(/\.0$/, '');
  };

  // Handle clicking/dragging on progress bar
  const handleProgressInteraction = useCallback((clientX: number) => {
    if (!progressBarRef.current || !hasResults || !onSeek) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const step = Math.round(percentage * (maxSteps - 1));
    onSeek(step);
  }, [hasResults, maxSteps, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onSeek) return;
    isDraggingRef.current = true;
    handleProgressInteraction(e.clientX);

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleProgressInteraction(e.clientX);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleProgressInteraction, onSeek]);

  // Handle Run + auto-play
  const handleRun = useCallback(() => {
    onRun();
    // Small delay to let results compute, then auto-play
    setTimeout(() => {
      onPlay();
    }, 50);
  }, [onRun, onPlay]);

  return (
    <div className="space-y-4">
      {/* Run/Reset buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleRun}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-medium py-2 px-3 rounded-lg shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Run
        </button>
        <button
          onClick={onReset}
          className={`flex-1 font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
            isDark
              ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white'
              : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-sm'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reset
        </button>
      </div>

      {/* Playback controls */}
      <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-center gap-2">
          {/* Step backward */}
          <button
            onClick={onStepBackward}
            disabled={!hasResults || currentStep === 0}
            className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'hover:bg-white/10 text-white'
                : 'hover:bg-slate-200 text-slate-700'
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
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium p-3 rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center"
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
                ? 'hover:bg-white/10 text-white'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Next step"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Step counter */}
        {hasResults && (
          <div className={`mt-3 text-center font-mono text-sm ${
            isDark ? 'text-white' : 'text-slate-700'
          }`}>
            Step <span className="text-purple-500 font-semibold">{currentStep + 1}</span>
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}> / {maxSteps}</span>
          </div>
        )}

        {/* Clickable Progress bar */}
        <div
          ref={progressBarRef}
          className={`mt-3 h-3 rounded-full overflow-hidden relative group ${
            isDark ? 'bg-white/10' : 'bg-slate-200'
          } ${hasResults && onSeek ? 'cursor-pointer' : ''}`}
          onMouseDown={hasResults ? handleMouseDown : undefined}
          title={hasResults && onSeek ? 'Click or drag to seek' : undefined}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-150 rounded-full"
            style={{ width: `${progress}%` }}
          />
          {/* Hover indicator */}
          {hasResults && onSeek && (
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-full" />
          )}
        </div>
      </div>

      {/* Speed control */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Speed
          </span>
          <span className={`text-sm font-mono ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
            {getStepsPerSec(animationSpeed)} steps/sec
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={1000}
          step={50}
          value={1050 - animationSpeed} // Invert so right = faster
          onChange={(e) => onSpeedChange(1050 - parseInt(e.target.value))}
          className="w-full slider"
        />
        <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>Slower</span>
          <span>Faster</span>
        </div>
      </div>
    </div>
  );
}
