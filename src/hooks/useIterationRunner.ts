import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  IterationResult,
  AlgorithmConfig,
  AndersonConfig,
  ExampleFunction,
  AlgorithmType
} from '../algorithms/types';
import { fixedPointIteration } from '../algorithms/fixedPoint';
import { andersonAcceleration } from '../algorithms/anderson';
import { steffensenMethod } from '../algorithms/steffensen';
import { newtonMethod } from '../algorithms/newton';

export interface AlgorithmResults {
  'fixed-point': IterationResult | null;
  'anderson': IterationResult | null;
  'steffensen': IterationResult | null;
  'newton': IterationResult | null;
}

export interface AnimationState {
  currentStep: number;
  isPlaying: boolean;
  speed: number;  // ms between frames
}

export interface UseIterationRunnerReturn {
  results: AlgorithmResults;
  animation: AnimationState;
  runAll: () => void;
  reset: () => void;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSpeed: (speed: number) => void;
  seek: (step: number) => void;
  maxSteps: number;
}

interface RunnerConfig {
  func: ExampleFunction;
  x0: number;
  tolerance: number;
  maxIterations: number;
  andersonMemory: number;
  enabledAlgorithms: Set<AlgorithmType>;
}

export function useIterationRunner(config: RunnerConfig): UseIterationRunnerReturn {
  const { func, x0, tolerance, maxIterations, andersonMemory, enabledAlgorithms } = config;

  const [results, setResults] = useState<AlgorithmResults>({
    'fixed-point': null,
    'anderson': null,
    'steffensen': null,
    'newton': null
  });

  const [animation, setAnimation] = useState<AnimationState>({
    currentStep: 0,
    isPlaying: false,
    speed: 500
  });

  const animationRef = useRef<number | null>(null);
  const maxStepsRef = useRef(0);

  // Calculate max steps across all results
  const maxSteps = Math.max(
    results['fixed-point']?.steps.length ?? 0,
    results['anderson']?.steps.length ?? 0,
    results['steffensen']?.steps.length ?? 0,
    results['newton']?.steps.length ?? 0
  );
  maxStepsRef.current = maxSteps;

  const runAll = useCallback(() => {
    const baseConfig: AlgorithmConfig = { tolerance, maxIterations };
    const andersonConfig: AndersonConfig = { ...baseConfig, memory: andersonMemory };

    const newResults: AlgorithmResults = {
      'fixed-point': null,
      'anderson': null,
      'steffensen': null,
      'newton': null
    };

    if (enabledAlgorithms.has('fixed-point')) {
      newResults['fixed-point'] = fixedPointIteration(func.g, x0, baseConfig);
    }

    if (enabledAlgorithms.has('anderson')) {
      newResults['anderson'] = andersonAcceleration(func.g, x0, andersonConfig);
    }

    if (enabledAlgorithms.has('steffensen')) {
      newResults['steffensen'] = steffensenMethod(func.g, x0, baseConfig);
    }

    if (enabledAlgorithms.has('newton')) {
      newResults['newton'] = newtonMethod(func.f, func.df, x0, baseConfig, func.g);
    }

    setResults(newResults);
    setAnimation(prev => ({ ...prev, currentStep: 0, isPlaying: false }));
  }, [func, x0, tolerance, maxIterations, andersonMemory, enabledAlgorithms]);

  const reset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setResults({
      'fixed-point': null,
      'anderson': null,
      'steffensen': null,
      'newton': null
    });
    setAnimation({ currentStep: 0, isPlaying: false, speed: 500 });
  }, []);

  const play = useCallback(() => {
    setAnimation(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setAnimation(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const stepForward = useCallback(() => {
    setAnimation(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, maxStepsRef.current - 1),
      isPlaying: false
    }));
  }, []);

  const stepBackward = useCallback(() => {
    setAnimation(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
      isPlaying: false
    }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setAnimation(prev => ({ ...prev, speed }));
  }, []);

  const seek = useCallback((step: number) => {
    setAnimation(prev => ({
      ...prev,
      currentStep: Math.max(0, Math.min(step, maxStepsRef.current - 1)),
      isPlaying: false
    }));
  }, []);

  // Animation loop
  useEffect(() => {
    if (!animation.isPlaying || maxSteps === 0) {
      return;
    }

    const advance = () => {
      setAnimation(prev => {
        if (prev.currentStep >= maxStepsRef.current - 1) {
          return { ...prev, isPlaying: false };
        }
        return { ...prev, currentStep: prev.currentStep + 1 };
      });
    };

    const intervalId = setInterval(advance, animation.speed);

    return () => clearInterval(intervalId);
  }, [animation.isPlaying, animation.speed, maxSteps]);

  return {
    results,
    animation,
    runAll,
    reset,
    play,
    pause,
    stepForward,
    stepBackward,
    setSpeed,
    seek,
    maxSteps
  };
}
