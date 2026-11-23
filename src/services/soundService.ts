let AudioModule: any = null;
try {
  AudioModule = require('expo-av').Audio;
} catch (e) {
  // expo-av not available in current runtime
}

let soundMuted = false;

// Safe audio manager that never crashes if native module is absent
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
    if (soundMuted || !AudioModule) return;
    try {
      const { sound } = await AudioModule.Sound.createAsync(
        require('../../assets/sounds/point.wav')
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      // Ignore audio error silently
    }
  },

  async playBuzzer() {
    if (soundMuted || !AudioModule) return;
    try {
      const { sound } = await AudioModule.Sound.createAsync(
        require('../../assets/sounds/buzzer.wav')
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      // Ignore audio error silently
    }
  },

  async playWinner() {
    if (soundMuted || !AudioModule) return;
    try {
      const { sound } = await AudioModule.Sound.createAsync(
        require('../../assets/sounds/winner.wav')
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      // Ignore audio error silently
    }
  },
};
