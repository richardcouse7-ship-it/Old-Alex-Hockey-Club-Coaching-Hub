import { useState, useRef } from 'react';
import { WhistleType } from '../types';

export interface UseWhistleAudioOptions {
  initialEnabled?: boolean;
}

export interface UseWhistleAudioReturn {
  whistleAudioEnabled: boolean;
  setWhistleAudioEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  toggleWhistleAudio: () => void;
  playRefereeWhistle: (type?: WhistleType) => void;
  playShortWhistle: () => void;
  playDoubleWhistle: () => void;
  playLongWhistle: () => void;
  whistlePlayedToast: boolean;
  whistleToastText: string;
}

/**
 * Sound synthesizer hook for realistic referee whistle with FM modulation (pea flutter).
 * Encapsulates Web Audio API AudioContext initialization, oscillators, gain nodes, and mute state.
 */
export const useWhistleAudio = (
  options: UseWhistleAudioOptions = {}
): UseWhistleAudioReturn => {
  const { initialEnabled = true } = options;
  const [whistleAudioEnabled, setWhistleAudioEnabled] = useState(initialEnabled);
  const [whistlePlayedToast, setWhistlePlayedToast] = useState(false);
  const [whistleToastText, setWhistleToastText] = useState('WHISTLE BLOWN! 🏑');

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleWhistleAudio = () => {
    setWhistleAudioEnabled((prev) => !prev);
  };

  const playRefereeWhistle = (type: WhistleType = 'rotation') => {
    if (!whistleAudioEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const blowBlast = (delay: number, duration: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Modulator for realistic referee whistle trill/flutter
        const modOsc = ctx.createOscillator();
        const modGain = ctx.createGain();

        modOsc.frequency.setValueAtTime(26, ctx.currentTime + delay);
        modGain.gain.setValueAtTime(140, ctx.currentTime + delay);
        modOsc.connect(osc.frequency);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + delay + 0.03);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay + duration - 0.04);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        modOsc.start(ctx.currentTime + delay);
        osc.start(ctx.currentTime + delay);

        modOsc.stop(ctx.currentTime + delay + duration);
        osc.stop(ctx.currentTime + delay + duration);
      };

      if (type === 'short') {
        blowBlast(0, 0.22, 2800);
        setWhistleToastText('ATTENTION / RESTART! 🏑');
      } else if (type === 'fulltime') {
        blowBlast(0, 0.18, 2750);
        blowBlast(0.24, 0.18, 2750);
        blowBlast(0.48, 0.7, 2600);
        setWhistleToastText('FULL TIME / SESSION STOP! 🏑');
      } else {
        // rotation / double whistle
        blowBlast(0, 0.2, 2800);
        blowBlast(0.28, 0.35, 2750);
        setWhistleToastText('ROTATE STATIONS! 🏑');
      }

      setWhistlePlayedToast(true);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        setWhistlePlayedToast(false);
      }, 2400);
    } catch {
      // Audio fallback silent
    }
  };

  const playShortWhistle = () => playRefereeWhistle('short');
  const playDoubleWhistle = () => playRefereeWhistle('rotation');
  const playLongWhistle = () => playRefereeWhistle('fulltime');

  return {
    whistleAudioEnabled,
    setWhistleAudioEnabled,
    toggleWhistleAudio,
    playRefereeWhistle,
    playShortWhistle,
    playDoubleWhistle,
    playLongWhistle,
    whistlePlayedToast,
    whistleToastText,
  };
};
