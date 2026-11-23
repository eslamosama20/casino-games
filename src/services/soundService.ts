// Zero-lag Audio and Haptic feedback manager for Casino Games
// Supports instant Web Audio API on Web/Browsers + expo-audio/expo-haptics on Native
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

let soundMuted = false;
let audioModule: any = null;
let pointPlayer: any = null;
let buzzerPlayer: any = null;
let winnerPlayer: any = null;

// Dynamically load expo-audio safely so it never crashes if native module is absent
try {
  audioModule = require('expo-audio');
} catch {
  audioModule = null;
}

// -------------------------------------------------------------
// Web Audio API Synthesizer (Instant 0ms latency in all browsers)
// -------------------------------------------------------------
let webAudioCtx: any = null;

function getWebAudioContext() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!webAudioCtx || webAudioCtx.state === 'closed') {
          webAudioCtx = new AudioContextClass();
        }
        if (webAudioCtx.state === 'suspended') {
          webAudioCtx.resume().catch(() => {});
        }
        return webAudioCtx;
      }
    } catch {}
  }
  return null;
}

function playWebTone(
  freqs: number[],
  type: OscillatorType = 'sine',
  duration = 0.2,
  gainLevel = 0.25,
  stagger = 0
) {
  const ctx = getWebAudioContext();
  if (!ctx) return false;

  const now = ctx.currentTime;
  freqs.forEach((freq, idx) => {
    const startTime = now + idx * stagger;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  });

  return true;
}

function getPointPlayer() {
  if (!pointPlayer && audioModule?.createAudioPlayer) {
    try {
      pointPlayer = audioModule.createAudioPlayer(require('../../assets/sounds/point.wav'));
    } catch {}
  }
  return pointPlayer;
}

function getBuzzerPlayer() {
  if (!buzzerPlayer && audioModule?.createAudioPlayer) {
    try {
      buzzerPlayer = audioModule.createAudioPlayer(require('../../assets/sounds/buzzer.wav'));
    } catch {}
  }
  return buzzerPlayer;
}

function getWinnerPlayer() {
  if (!winnerPlayer && audioModule?.createAudioPlayer) {
    try {
      winnerPlayer = audioModule.createAudioPlayer(require('../../assets/sounds/winner.wav'));
    } catch {}
  }
  return winnerPlayer;
}

export const soundManager = {
  isMuted: () => soundMuted,

  setMuted: (muted: boolean) => {
    soundMuted = muted;
  },

  toggleMute: () => {
    soundMuted = !soundMuted;
    return soundMuted;
  },

  // 1. Point Win (+1) - Crisp Casino Coin & Bell Ding
  playPoint() {
    if (soundMuted) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    // Instant Web Audio synthesis: Two-tone cheerful coin chime
    const handledWeb = playWebTone([587.33, 880, 1174.66], 'triangle', 0.28, 0.35, 0.06);
    if (handledWeb) return;

    try {
      const p = getPointPlayer();
      if (p) {
        if (typeof p.seekTo === 'function') p.seekTo(0);
        if (typeof p.play === 'function') p.play();
      }
    } catch {}
  },

  // 2. Penalty (-1) - Deep Casino Buzzer
  playBuzzer() {
    if (soundMuted) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}

    // Instant Web Audio synthesis: Sawtooth game-show penalty buzz
    const ctx = getWebAudioContext();
    if (ctx) {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.linearRampToValueAtTime(85, now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
        return;
      } catch {}
    }

    try {
      const p = getBuzzerPlayer();
      if (p) {
        if (typeof p.seekTo === 'function') p.seekTo(0);
        if (typeof p.play === 'function') p.play();
      }
    } catch {}
  },

  // 3. Card Deal / Next Question - Casino Deck Swoosh
  playCardFlip() {
    if (soundMuted) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const ctx = getWebAudioContext();
    if (ctx) {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
      } catch {}
    }
  },

  // 4. Reveal Answer - Magical Reveal Sparkle
  playReveal() {
    if (soundMuted) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    // Pleasant ascending sparkle arpeggio
    playWebTone([523.25, 659.25, 783.99, 1046.5], 'sine', 0.25, 0.28, 0.05);
  },

  // 5. Casino Chip Click
  playChipClick() {
    if (soundMuted) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    playWebTone([1250], 'triangle', 0.06, 0.2, 0);
  },

  // 6. Winner Grand Fanfare
  playWinner() {
    if (soundMuted) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const ctx = getWebAudioContext();
    if (ctx) {
      try {
        // Triumphant fanfare arpeggio: C4 -> E4 -> G4 -> C5 (Long sustained chord)
        playWebTone([523.25, 659.25, 783.99, 1046.5], 'triangle', 0.8, 0.4, 0.09);
        setTimeout(() => {
          playWebTone([1046.5, 1318.51, 1567.98], 'triangle', 1.0, 0.35, 0);
        }, 380);
        return;
      } catch {}
    }

    try {
      const p = getWinnerPlayer();
      if (p) {
        if (typeof p.seekTo === 'function') p.seekTo(0);
        if (typeof p.play === 'function') p.play();
      }
    } catch {}
  },
};
