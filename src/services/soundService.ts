// Robust Audio and Haptic feedback manager for Casino Games
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

  playPoint() {
    if (soundMuted) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    try {
      const p = getPointPlayer();
      if (p) {
        if (typeof p.seekTo === 'function') p.seekTo(0);
        if (typeof p.play === 'function') p.play();
      }
    } catch {}
  },

  playBuzzer() {
    if (soundMuted) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}

    try {
      const p = getBuzzerPlayer();
      if (p) {
        if (typeof p.seekTo === 'function') p.seekTo(0);
        if (typeof p.play === 'function') p.play();
      }
    } catch {}
  },

  playWinner() {
    if (soundMuted) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      const p = getWinnerPlayer();
      if (p) {
        if (typeof p.seekTo === 'function') p.seekTo(0);
        if (typeof p.play === 'function') p.play();
      }
    } catch {}
  },
};
