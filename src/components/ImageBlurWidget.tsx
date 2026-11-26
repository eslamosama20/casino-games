import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../constants/theme';
import { soundManager } from '../services/soundService';

interface ImageBlurWidgetProps {
  imageUrl: string;
  mediaTitle?: string;
  revealDuration?: number; // Total seconds, default 10
  startedAt?: number;      // Epoch ms when blur started
  frozenAt?: number | null; // Epoch ms when buzzer was pressed
  revealed?: boolean;       // True when host marks answer correct
  buzzedSecond?: number | null;
  pointsValue?: number | null;
  buzzedByName?: string | null;
  isHost?: boolean;
  onManualReveal?: () => void;
}

export const ImageBlurWidget: React.FC<ImageBlurWidgetProps> = ({
  imageUrl,
  mediaTitle,
  revealDuration = 10,
  startedAt,
  frozenAt,
  revealed = false,
  buzzedSecond,
  pointsValue,
  buzzedByName,
  isHost = false,
  onManualReveal,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setIsLoading(true);
  }, [imageUrl]);

  // Track real-time seconds elapsed with sync
  useEffect(() => {
    if (revealed) {
      setSecondsElapsed(revealDuration);
      return;
    }

    if (frozenAt && startedAt) {
      const elapsed = Math.min(revealDuration, Math.max(1, Math.ceil((frozenAt - startedAt) / 1000)));
      setSecondsElapsed(elapsed);
      return;
    }

    if (!startedAt) {
      setSecondsElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(revealDuration, Math.max(0, Math.floor((now - startedAt) / 1000)));
      setSecondsElapsed(elapsed);
      if (elapsed >= revealDuration) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [startedAt, frozenAt, revealed, revealDuration]);

  // Pulse animation when frozen
  useEffect(() => {
    if (frozenAt && !revealed) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [frozenAt, revealed]);

  // Calculate blur radius & points
  const currentSec = revealed
    ? revealDuration
    : buzzedSecond ?? secondsElapsed;

  // Blur radius: starts at 28, drops to 0 at 10 seconds
  const blurFraction = Math.max(0, 1 - currentSec / revealDuration);
  const blurRadius = revealed ? 0 : Math.round(blurFraction * 26);
  const overlayOpacity = revealed ? 0 : Math.max(0.08, blurFraction * 0.45);

  // Points tier:
  // sec 0-3: 3 pts, sec 4-7: 2 pts, sec 8+: 1 pt
  const currentPoints = pointsValue ?? (currentSec <= 3 ? 3 : currentSec <= 7 ? 2 : 1);

  return (
    <View style={styles.container}>
      {/* Top Points Tier Badge */}
      <View style={styles.headerRow}>
        <View style={styles.timerBadge}>
          <Text style={{ fontSize: 13, marginRight: 4 }}>⏱️</Text>
          <Text style={styles.timerBadgeText}>
            {revealed ? 'تم الكشف' : `${Math.max(0, revealDuration - currentSec)} ثواني`}
          </Text>
        </View>

        <View
          style={[
            styles.pointsTierBadge,
            currentPoints === 3 && styles.tierGold,
            currentPoints === 2 && styles.tierAmber,
            currentPoints === 1 && styles.tierGreen,
          ]}
        >
          <Text style={styles.pointsTierText}>
            {currentPoints === 3
              ? '🔥 +3 نقاط (ضباب كثيف)'
              : currentPoints === 2
              ? '⚡ +2 نقطة (تخمين سريع)'
              : '✨ +1 نقطة (الصورة اتضحت)'}
          </Text>
        </View>
      </View>

      {/* Image Container with Blur & Overlay */}
      <View
        style={[
          styles.imageWrapper,
          Boolean(frozenAt && !revealed) && styles.imageWrapperFrozen,
          revealed ? styles.imageWrapperRevealed : null,
        ]}
      >
        {isLoading && (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 2 }]}>
            <ActivityIndicator size="large" color={theme.colors.gold} />
          </View>
        )}

        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            Platform.OS === 'web'
              ? ({ filter: `blur(${blurRadius}px)`, transition: 'filter 0.35s ease' } as any)
              : null,
          ]}
          resizeMode="contain"
          blurRadius={Platform.OS === 'web' ? 0 : Math.max(1, blurRadius)}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />

        {/* Dynamic Dark Vignette & Frosted Tint Overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(11, 16, 30, ${overlayOpacity})` },
          ]}
          pointerEvents="none"
        />

        {/* Frozen Alert Banner */}
        {frozenAt && !revealed && (
          <Animated.View style={[styles.frozenBanner, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={{ fontSize: 16, marginRight: 4 }}>⏸️</Text>
            <Text style={styles.frozenBannerText}>
              تم التجميد! {buzzedByName ? `${buzzedByName} داس في ثانية ${currentSec}` : `في الثانية ${currentSec}`}
            </Text>
          </Animated.View>
        )}

        {/* Revealed Name Banner */}
        {revealed && (
          <View style={styles.revealedBanner}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>🏆</Text>
            <Text style={styles.revealedBannerText}>
              {mediaTitle || 'إجابة صحيحة!'}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(100, (currentSec / revealDuration) * 100)}%`,
              backgroundColor: currentPoints === 3 ? '#F59E0B' : currentPoints === 2 ? '#3B82F6' : '#10B981',
            },
          ]}
        />
      </View>

      {/* Host Controls */}
      {isHost && !revealed && (
        <View style={styles.hostControlsRow}>
          <TouchableOpacity
            style={styles.manualRevealBtn}
            onPress={() => {
              soundManager.playChipClick();
              if (onManualReveal) onManualReveal();
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14, marginLeft: 4 }}>👁️</Text>
            <Text style={styles.manualRevealBtnText}>كشف الصورة بالكامل</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  timerBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  pointsTierBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  tierGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#F59E0B',
  },
  tierAmber: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderColor: '#3B82F6',
  },
  tierGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10B981',
  },
  pointsTierText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  imageWrapper: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#050811',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapperFrozen: {
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  imageWrapperRevealed: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  frozenBanner: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  frozenBannerText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  revealedBanner: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  revealedBannerText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  hostControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  manualRevealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  manualRevealBtnText: {
    color: '#0F172A',
    fontSize: 11.5,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
});
