import { useState, useEffect, useRef } from 'react';
import { TimerMode, MatchPeriod, DrillSegment, WhistleType } from '../types';

export interface UsePitchsideTimerOptions {
  timerMode: TimerMode;
  segments: DrillSegment[];
  activeSegmentIndex: number;
  autoAdvanceStation: boolean;
  currentStation: number;
  totalStations: number;
  onWhistle: (type: WhistleType) => void;
  onSegmentComplete: (completedIndex: number, nextIndex: number | null) => void;
  onStationAdvance: () => void;
}

export interface UsePitchsideTimerReturn {
  secondsRemaining: number;
  setSecondsRemaining: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  visualStrobeActive: boolean;
  formattedTime: string;
  isWarningTime: boolean;
  setPresetMinutes: (mins: number) => void;
  addTimeSeconds: (secs: number) => void;
  handleReset: () => void;
  toggleRunning: () => void;
}

export const usePitchsideTimer = ({
  timerMode,
  segments,
  activeSegmentIndex,
  autoAdvanceStation,
  currentStation,
  totalStations,
  onWhistle,
  onSegmentComplete,
  onStationAdvance,
}: UsePitchsideTimerOptions): UsePitchsideTimerReturn => {
  const [secondsRemaining, setSecondsRemaining] = useState(10 * 60); // default 10m
  const [isRunning, setIsRunning] = useState(false);
  const [visualStrobeActive, setVisualStrobeActive] = useState(false);

  // Keep latest callbacks in ref to avoid stale closures in interval
  const callbacksRef = useRef({
    timerMode,
    segments,
    activeSegmentIndex,
    autoAdvanceStation,
    currentStation,
    totalStations,
    onWhistle,
    onSegmentComplete,
    onStationAdvance,
  });

  useEffect(() => {
    callbacksRef.current = {
      timerMode,
      segments,
      activeSegmentIndex,
      autoAdvanceStation,
      currentStation,
      totalStations,
      onWhistle,
      onSegmentComplete,
      onStationAdvance,
    };
  });

  // Timer interval with visual strobe and auto-advancement
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            const {
              timerMode: mode,
              segments: currentSegments,
              activeSegmentIndex: segIdx,
              autoAdvanceStation: autoAdv,
              currentStation: stationNum,
              totalStations: totalSt,
              onWhistle: whistleCb,
              onSegmentComplete: segCompCb,
              onStationAdvance: stationAdvCb,
            } = callbacksRef.current;

            // Time expired! Trigger whistle & visual strobe
            setVisualStrobeActive(true);
            setTimeout(() => setVisualStrobeActive(false), 3500);

            if (mode === 'station') {
              whistleCb('rotation');
              if (autoAdv && stationNum < totalSt) {
                stationAdvCb();
                // Reset to default station length (e.g. 10m)
                return 10 * 60;
              } else {
                setIsRunning(false);
                return 0;
              }
            } else if (mode === 'match') {
              whistleCb('fulltime');
              setIsRunning(false);
              return 0;
            } else {
              // Session mode
              const isLast = segIdx === currentSegments.length - 1;
              whistleCb(isLast ? 'fulltime' : 'rotation');

              if (!isLast) {
                const nextIdx = segIdx + 1;
                segCompCb(segIdx, nextIdx);
                return (currentSegments[nextIdx]?.durationMinutes || 10) * 60;
              } else {
                segCompCb(segIdx, null);
                setIsRunning(false);
                return 0;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Presets
  const setPresetMinutes = (mins: number) => {
    setIsRunning(false);
    setSecondsRemaining(mins * 60);
  };

  const addTimeSeconds = (secs: number) => {
    setSecondsRemaining((prev) => Math.max(0, prev + secs));
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timerMode === 'session') {
      setSecondsRemaining((segments[activeSegmentIndex]?.durationMinutes || 10) * 60);
    } else if (timerMode === 'station') {
      setSecondsRemaining(10 * 60);
    } else {
      setSecondsRemaining(20 * 60);
    }
  };

  const toggleRunning = () => {
    setIsRunning((prev) => !prev);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isWarningTime = secondsRemaining <= 30 && secondsRemaining > 0 && isRunning;

  return {
    secondsRemaining,
    setSecondsRemaining,
    isRunning,
    setIsRunning,
    visualStrobeActive,
    formattedTime,
    isWarningTime,
    setPresetMinutes,
    addTimeSeconds,
    handleReset,
    toggleRunning,
  };
};
