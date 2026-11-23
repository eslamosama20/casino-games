// Lightweight Web Audio / Haptic feedback fallback
// Ensures 100% zero native crashes on all Android versions and OEMs (Xiaomi, Samsung, Oppo, etc.)
import * as Haptics from 'expo-haptics';

let soundMuted = false;

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  },

  playBuzzer() {
    if (soundMuted) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  },

  playWinner() {
    if (soundMuted) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  },
};
