import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { soundManager } from '../services/soundService';

interface AudioMysteryWidgetProps {
  audioUrl?: string;
  mediaTitle?: string;
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
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const audioRef = useRef<any>(null);

  // Equalizer bar animations (5 bars)
  const barAnims = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.7),
    new Animated.Value(0.4),
    new Animated.Value(0.9),
    new Animated.Value(0.5),
  ]).current;

  // Handle buzzer freeze: immediately stop playback
  useEffect(() => {
    if (frozenAt || revealed) {
      pauseAudio();
    }
  }, [frozenAt, revealed]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      pauseAudio();
    };
  }, []);

  // Equalizer loop animation
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      const createBarLoop = (val: Animated.Value, minVal: number, maxVal: number, dur: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: maxVal, duration: dur, useNativeDriver: true }),
            Animated.timing(val, { toValue: minVal, duration: dur, useNativeDriver: true }),
          ])
        );
      };

      const loops = barAnims.map((val, idx) =>
        createBarLoop(val, 0.2 + (idx % 3) * 0.1, 0.9 + (idx % 2) * 0.1, 220 + idx * 70)
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

  const playAudio = () => {
    if (frozenAt || revealed) return;
    setIsPlaying(true);
    soundManager.playChipClick();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (!audioRef.current && audioUrl) {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => {
            setIsPlaying(false);
            setCurrentProgress(1);
          };
          audioRef.current.ontimeupdate = () => {
            if (audioRef.current && audioRef.current.duration) {
              setCurrentProgress(audioRef.current.currentTime / audioRef.current.duration);
            }
          };
        }
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        } else {
          // Fallback synthesizer audio tone if no external URL
          soundManager.playPoint();
        }
      } catch {}
    } else {
      soundManager.playPoint();
    }
  };

  const pauseAudio = () => {
    setIsPlaying(false);
    if (Platform.OS === 'web' && audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const handleReplay = () => {
    if (Platform.OS === 'web' && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
      } catch {}
    }
    playAudio();
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.categoryPill}>
          <MaterialCommunityIcons name="headphones" size={16} color="#F43F5E" />
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
            <MaterialCommunityIcons name="hand-back-right" size={20} color="#F59E0B" />
            <Text style={styles.frozenText}>
              وقف المقطع! {buzzedByName ? `${buzzedByName} ضغط الجرس` : 'تم ضغط الجرس!'}
              {buzzedSecond ? ` (ثانية ${buzzedSecond})` : ''}
            </Text>
          </View>
        ) : revealed ? (
          <View style={styles.revealedBanner}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.revealedText}>إجابة صحيحة! أحسنت 🎉</Text>
          </View>
        ) : null}

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.playBtn, isPlaying && styles.pauseBtn]}
            onPress={handleTogglePlay}
            activeOpacity={0.8}
            disabled={revealed}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.playBtnText}>
              {isPlaying ? 'إيقاف مؤقت' : 'شغّل المقطع'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.replayBtn}
            onPress={handleReplay}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="replay" size={20} color="#E2E8F0" />
            <Text style={styles.replayBtnText}>إعادة</Text>
          </TouchableOpacity>

          {isHost && !revealed && onManualReveal && (
            <TouchableOpacity
              style={styles.hostRevealBtn}
              onPress={onManualReveal}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="eye" size={18} color="#F59E0B" />
              <Text style={styles.hostRevealBtnText}>كشف 👁️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
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
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  categoryPillText: {
    color: '#FDA4AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
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
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    shadowColor: '#F43F5E',
    shadowOpacity: 0.18,
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
    marginVertical: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
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
    marginTop: 4,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F43F5E',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  hostRevealBtnText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
