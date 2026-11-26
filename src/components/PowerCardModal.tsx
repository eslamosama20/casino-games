import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PowerCard } from '../types';
import { getPowerCardById } from '../data/powerCards';
import { soundManager } from '../services/soundService';

interface PowerCardModalProps {
  visible: boolean;
  cardId?: string | null;
  playerName?: string;
  isSelf?: boolean;
  onDismiss: () => void;
}

export const PowerCardModal: React.FC<PowerCardModalProps> = ({
  visible,
  cardId,
  playerName,
  isSelf,
  onDismiss,
}) => {
  const card: PowerCard | undefined = cardId ? getPowerCardById(cardId) : undefined;

  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (visible && card) {
      soundManager.playCardFlip();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      flipAnim.setValue(0);
      scaleAnim.setValue(0.4);

      // Phase 1: Card flies into view with spring
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();

      // Phase 2: Card reveals itself with 3D Flip
      const timer = setTimeout(() => {
        soundManager.playCardFlip();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        Animated.timing(flipAnim, {
          toValue: 180,
          duration: 750,
          useNativeDriver: true,
        }).start();
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [visible, cardId]);

  if (!visible || !card) return null;

  // 3D Flip transforms
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [1, 1, 0, 0],
  });

  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 91, 180],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        {/* Animated Card Container */}
        <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
          
          {/* ============ BACK OF CARD (Casino Mystery) ============ */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardBack,
              {
                opacity: backOpacity,
                transform: [{ rotateY: backRotateY }],
              },
            ]}
          >
            {/* Corner Suits */}
            <View style={styles.backTopRow}>
              <Text style={styles.suitText}>♠</Text>
              <Text style={[styles.suitText, styles.suitRed]}>♥</Text>
            </View>

            {/* Casino Badge Center */}
            <View style={styles.backCenterBox}>
              <MaterialCommunityIcons name="cards-playing" size={54} color="#F59E0B" />
              <Text style={styles.backTitle}>كازينو الألعاب</Text>
              <Text style={styles.backSubtitle}>كارت الحظ والقوة ⚡</Text>
            </View>

            <View style={styles.backBottomRow}>
              <Text style={[styles.suitText, styles.suitRed]}>♦</Text>
              <Text style={styles.suitText}>♣</Text>
            </View>
          </Animated.View>

          {/* ============ FRONT OF CARD (Revealed Power) ============ */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardFront,
              {
                borderColor: card.color,
                shadowColor: card.color,
                opacity: frontOpacity,
                transform: [{ rotateY: frontRotateY }],
              },
            ]}
          >
            {/* Top banner: who activated the card */}
            <View style={[styles.playerBanner, { backgroundColor: `${card.color}25` }]}>
              <MaterialCommunityIcons name="flash" size={16} color={card.color} />
              <Text style={[styles.playerBannerText, { color: card.color }]}>
                {isSelf ? 'أنت سحبت كارت الحظ! 🎲' : `${playerName || 'متسابق'} فعّل كارت الحظ! ⚡`}
              </Text>
            </View>

            {/* Card Icon inside glowing badge */}
            <View style={[styles.iconCircle, { backgroundColor: `${card.color}20`, borderColor: card.color }]}>
              <MaterialCommunityIcons name={card.icon as any} size={46} color={card.color} />
            </View>

            {/* Badge pill */}
            <View style={[styles.badgePill, { backgroundColor: `${card.color}35` }]}>
              <Text style={[styles.badgePillText, { color: card.color }]}>{card.badge}</Text>
            </View>

            {/* Card Title */}
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>

            {/* Card Description (Concise 1-2 lines) */}
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{card.description}</Text>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: card.color }]}
              onPress={() => {
                soundManager.playChipClick();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onDismiss();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>استمرار اللعب 🎲</Text>
            </TouchableOpacity>
          </Animated.View>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 350,
    height: 480,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backfaceVisibility: 'hidden',
  },
  // Back Face
  cardBack: {
    backgroundColor: '#0A0F1D',
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
  },
  backTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backBottomRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suitText: {
    fontSize: 26,
    color: '#F59E0B',
  },
  suitRed: {
    color: '#EF4444',
  },
  backCenterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    width: '88%',
  },
  backTitle: {
    color: '#F59E0B',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  backSubtitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  // Front Face
  cardFront: {
    backgroundColor: '#0F172A',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 14,
  },
  playerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 4,
  },
  playerBannerText: {
    fontSize: 13,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
    writingDirection: 'rtl',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  descriptionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    writingDirection: 'rtl',
  },
  continueBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  continueBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
});
