import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  IterationResult2D,
  AlgorithmConfig,
  AndersonConfig,
  ExampleFunction2D,
  AlgorithmType,
  AlgorithmResults2D,
  Point2D
} from '../algorithms/types';
import {
  fixedPointIteration2D,
  andersonAcceleration2D,
  newtonMethod2D
} from '../algorithms/algorithms2d';

export interface AnimationState2D {
  currentStep: number;
  isPlaying: boolean;
  speed: number;
}

export interface UseIterationRunner2DReturn {
  results: AlgorithmResults2D;
  animation: AnimationState2D;
  runAll: () => void;
  reset: () => void;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSpeed: (speed: number) => void;
  maxSteps: number;
  x0: Point2D;
  setX0: (x0: Point2D) => void;
}

interface RunnerConfig2D {
  func: ExampleFunction2D;
  tolerance: number;
  maxIterations: number;
  andersonMemory: number;
  enabledAlgorithms: Set<AlgorithmType>;
}

export function useIterationRunner2D(config: RunnerConfig2D): UseIterationRunner2DReturn {
  const { func, tolerance, maxIterations, andersonMemory, enabledAlgorithms } = config;

  const [x0, setX0] = useState<Point2D>(func.defaultX0);

  const [results, setResults] = useState<AlgorithmResults2D>({
    'fixed-point': null,
    'anderson': null,
    'steffensen': null,
    'newton': null
  });

  const [animation, setAnimation] = useState<AnimationState2D>({
    currentStep: 0,
    isPlaying: false,
    speed: 500
  });

  const maxStepsRef = useRef(0);

  // Calculate max steps across all results (no Steffensen in 2D)
  const maxSteps = Math.max(
    results['fixed-point']?.steps.length ?? 0,
    results['anderson']?.steps.length ?? 0,
    results['newton']?.steps.length ?? 0
  );
  maxStepsRef.current = maxSteps;

  // Reset x0 when function changes
  useEffect(() => {
    setX0(func.defaultX0);
  }, [func]);

  const runAll = useCallback(() => {
    const baseConfig: AlgorithmConfig = { tolerance, maxIterations };
    const andersonConfig: AndersonConfig = { ...baseConfig, memory: andersonMemory };

    const newResults: AlgorithmResults2D = {
      'fixed-point': null,
      'anderson': null,
      'steffensen': null,
      'newton': null
    };

    if (enabledAlgorithms.has('fixed-point')) {
      newResults['fixed-point'] = fixedPointIteration2D(func.g, x0, baseConfig);
    }

    if (enabledAlgorithms.has('anderson')) {
      newResults['anderson'] = andersonAcceleration2D(func.g, x0, andersonConfig);
    }

    // Steffensen's method not used in 2D - Aitken's delta-squared is for scalar sequences

    if (enabledAlgorithms.has('newton')) {
      newResults['newton'] = newtonMethod2D(func.g, x0, baseConfig, func.jacobian);
    }

    setResults(newResults);
    setAnimation(prev => ({ ...prev, currentStep: 0, isPlaying: false }));
  }, [func, x0, tolerance, maxIterations, andersonMemory, enabledAlgorithms]);

  const reset = useCallback(() => {
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
    maxSteps,
    x0,
    setX0
  };
}
