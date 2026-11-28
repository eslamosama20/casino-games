import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { soundManager } from '../services/soundService';

interface AudioMysteryWidgetProps {
  audioUrl?: string;
  mediaTitle?: string;
  spokenText?: string;
  duration?: number;       // Duration in seconds, default 8
  startedAt?: number;      // Epoch ms when audio playback began
  frozenAt?: number | null; // Epoch ms when buzzer was pressed (freezes audio)
  revealed?: boolean;       // Answer revealed
  buzzedByName?: string | null;
  buzzedSecond?: number | null;
  pointsValue?: number | null;
  isHost?: boolean;
  onManualReveal?: () => void;
}

export const AudioMysteryWidget: React.FC<AudioMysteryWidgetProps> = ({
  audioUrl,
  mediaTitle = 'مقطع صوتي غامض',
  spokenText,
  duration = 8,
  startedAt,
  frozenAt,
  revealed = false,
  buzzedByName,
  buzzedSecond,
  pointsValue,
  isHost = false,
  onManualReveal,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<any>(null);
  const suspenseTimerRef = useRef<any>(null);
  const synthNodesRef = useRef<any[]>([]);

  // Equalizer bar animations (5 bars)
  const barAnims = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.7),
    new Animated.Value(0.4),
    new Animated.Value(0.9),
    new Animated.Value(0.5),
  ]).current;

  // Stop everything when frozen by buzzer or revealed
  useEffect(() => {
    if (frozenAt || revealed) {
      stopAllAudio();
    }
  }, [frozenAt, revealed]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  // Equalizer loop animation
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      const createBarLoop = (val: Animated.Value, minVal: number, maxVal: number, dur: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: maxVal, duration: dur, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(val, { toValue: minVal, duration: dur, useNativeDriver: Platform.OS !== 'web' }),
          ])
        );
      };

      const loops = barAnims.map((val, idx) =>
        createBarLoop(val, 0.2 + (idx % 3) * 0.1, 0.95, 200 + idx * 60)
      );

      animLoop = Animated.parallel(loops);
      animLoop.start();
    } else {
      barAnims.forEach((val) => val.setValue(0.2));
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isPlaying]);

  // Web Audio Suspense Mystery Beat Synthesizer
  const startSuspenseSynth = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') ctx.resume();

      // Play rhythmic suspense clock & tension beats
      let beatCount = 0;
      const playBeat = () => {
        if (!ctx || ctx.state === 'closed') return;
        const now = ctx.currentTime;

        // Sub bass heartbeat
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(110 + (beatCount % 4) * 15, now);
        bassGain.gain.setValueAtTime(0.3, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.4);

        // Tension click
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(800 + (beatCount % 2) * 200, now);
        clickGain.gain.setValueAtTime(0.12, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.1);

        beatCount++;
      };

      playBeat();
      suspenseTimerRef.current = setInterval(playBeat, 750);
      synthNodesRef.current.push(ctx);
    } catch {}
  };

  const stopSuspenseSynth = () => {
    if (suspenseTimerRef.current) {
      clearInterval(suspenseTimerRef.current);
      suspenseTimerRef.current = null;
    }
    synthNodesRef.current.forEach((ctx) => {
      try {
        ctx.close();
      } catch {}
    });
    synthNodesRef.current = [];
  };

  const playAudio = () => {
    if (frozenAt || revealed) return;
    setIsPlaying(true);
    soundManager.playChipClick();

    // 1. Play Suspense Game Show Sound Effects
    startSuspenseSynth();

    // 2. Play Speech Synthesis (reads the Egyptian line out loud in Arabic!)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const rawText = spokenText || mediaTitle || '';
        const matchQuote = rawText.match(/["“]([^"”]+)["”]/);
        const textToSay = matchQuote
          ? matchQuote[1]
          : rawText.replace(/خمن الإفيه:|خمن مطلع الأغنية:|خمن التتر:/g, '').trim();

        if (textToSay) {
          const utter = new SpeechSynthesisUtterance(textToSay);
          utter.lang = 'ar-EG';
          utter.rate = 0.95;
          utter.pitch = 1.0;
          utter.onend = () => {
            // Keep tension going for 2 seconds then stop
            setTimeout(() => {
              if (isPlaying) {
                stopAllAudio();
              }
            }, 2000);
          };
          window.speechSynthesis.speak(utter);
        }
      } catch {}
    }

    // 3. Play audioUrl if provided
    if (Platform.OS === 'web' && typeof window !== 'undefined' && audioUrl) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => {
            stopAllAudio();
          };
        }
        audioRef.current.play().catch(() => {});
      } catch {}
    }
  };

  const stopAllAudio = () => {
    setIsPlaying(false);
    stopSuspenseSynth();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } catch {}
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAllAudio();
    } else {
      playAudio();
    }
  };

  const handleReplay = () => {
    stopAllAudio();
    if (Platform.OS === 'web' && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
      } catch {}
    }
    setTimeout(() => {
      playAudio();
    }, 150);
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.categoryPill}>
          <Text style={{ fontSize: 15, marginLeft: 4 }}>🎧</Text>
          <Text style={styles.categoryPillText}>احزر بالصوت والإفيه</Text>
        </View>

        {pointsValue && (
          <View style={[styles.pointsBadge, pointsValue === 3 ? styles.points3 : pointsValue === 2 ? styles.points2 : styles.points1]}>
            <Text style={styles.pointsBadgeText}>+{pointsValue} نقاط</Text>
          </View>
        )}
      </View>

      {/* Main Sound Wave Card */}
      <View style={styles.playerCard}>
        {/* Equalizer Visualizer */}
        <View style={styles.waveformContainer}>
          {barAnims.map((anim, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.waveformBar,
                {
                  transform: [{ scaleY: anim }],
                },
              ]}
            />
          ))}
        </View>

        <Text style={styles.mediaTitleText} numberOfLines={2}>
          {revealed ? '🎧 تم كشف الإفيه / الأغنية!' : `🎵 ${mediaTitle}`}
        </Text>

        {/* Status Indicators */}
        {frozenAt ? (
          <View style={styles.frozenBanner}>
            <Text style={{ fontSize: 16, marginLeft: 6 }}>✋</Text>
            <Text style={styles.frozenText}>
              وقف المقطع! {buzzedByName ? `${buzzedByName} ضغط الجرس` : 'تم ضغط الجرس!'}
              {buzzedSecond ? ` (ثانية ${buzzedSecond})` : ''}
            </Text>
          </View>
        ) : revealed ? (
          <View style={styles.revealedBanner}>
            <Text style={{ fontSize: 16, marginLeft: 6 }}>🎉</Text>
            <Text style={styles.revealedText}>إجابة صحيحة! أحسنت 👏</Text>
          </View>
        ) : null}

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity accessibilityRole="button"
            style={[styles.playBtn, isPlaying && styles.pauseBtn]}
            onPress={handleTogglePlay}
            activeOpacity={0.8}
            disabled={revealed}
          >
            <Text style={{ fontSize: 18, color: '#FFFFFF', marginLeft: 6 }}>
              {isPlaying ? '⏸️' : '▶️'}
            </Text>
            <Text style={styles.playBtnText}>
              {isPlaying ? 'إيقاف مؤقت' : 'شغّل الإفيه 🔊'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button"
            style={styles.replayBtn}
            onPress={handleReplay}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 15, color: '#E2E8F0', marginLeft: 4 }}>🔄</Text>
            <Text style={styles.replayBtnText}>إعادة</Text>
          </TouchableOpacity>

          {isHost && !revealed && onManualReveal && (
            <TouchableOpacity accessibilityRole="button"
              style={styles.hostRevealBtn}
              onPress={onManualReveal}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, color: '#F59E0B', marginLeft: 4 }}>👁️</Text>
              <Text style={styles.hostRevealBtnText}>كشف</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
    alignSelf: 'center',
    maxWidth: 440,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryPillText: {
    color: '#FDA4AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  points3: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  points2: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
  },
  points1: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  pointsBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    shadowColor: '#F43F5E',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: 8,
    marginVertical: 8,
  },
  waveformBar: {
    width: 8,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#F43F5E',
  },
  mediaTitleText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  frozenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 12,
  },
  frozenText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  revealedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 12,
  },
  revealedText: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: 'bold',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F43F5E',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
  },
  pauseBtn: {
    backgroundColor: '#E11D48',
  },
  playBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 24,
  },
  replayBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  hostRevealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 24,
  },
  hostRevealBtnText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
