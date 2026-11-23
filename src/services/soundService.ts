import { Audio } from 'expo-av';

let soundMuted = false;

// Preload or dynamic sound playback
export const soundManager = {
  isMuted: () => soundMuted,

  setMuted: (muted: boolean) => {
    soundMuted = muted;
  },

  toggleMute: () => {
    soundMuted = !soundMuted;
    return soundMuted;
  },

  async playPoint() {
    if (soundMuted) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/point.wav')
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      // Audio playback fails silently in environments without audio support
    }
  },

  async playBuzzer() {
    if (soundMuted) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/buzzer.wav')
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      // Ignore audio error
    }
  },

  async playWinner() {
    if (soundMuted) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/winner.wav')
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      // Ignore audio error
    }
  },
};
