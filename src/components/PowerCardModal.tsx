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
  const scaleAnim = useRef(new Animated.Value(0.35)).current;
  const glowAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible && card) {
      // 1. Audio: dramatic card swoosh entrance
      soundManager.playCardWhoosh();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

      flipAnim.setValue(0);
      scaleAnim.setValue(0.35);

      // Phase 1: Card springs up dynamically
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 85,
        useNativeDriver: true,
      }).start();

      // Pulsing glow animation
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.8, duration: 600, useNativeDriver: true }),
        ])
      );
      glowLoop.start();

      // Phase 2: 3D Flip reveal with magic fanfare sound
      const flipTimer = setTimeout(() => {
        soundManager.playCardMagicReveal();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        Animated.timing(flipAnim, {
          toValue: 180,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 750);

      return () => {
        clearTimeout(flipTimer);
        glowLoop.stop();
      };
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
        {/* Animated 3D Card Container */}
        <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>

          {/* ============ BACK OF CARD (Luxury Casino Seal) ============ */}
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
            {/* Top Corner Suits */}
            <View style={styles.suitRow}>
              <View style={styles.suitBadge}>
                <Text style={styles.suitSymbolGold}>♠</Text>
              </View>
              <View style={styles.suitBadge}>
                <Text style={styles.suitSymbolRed}>♥</Text>
              </View>
            </View>

            {/* Central Ornate Gold Medallion */}
            <View style={styles.backCenterMedallion}>
              <View style={styles.backInnerRing}>
                <MaterialCommunityIcons name="cards-playing" size={54} color="#F59E0B" />
                <Text style={styles.backTitleMain}>كازينو الألعاب</Text>
                <View style={styles.backGoldDivider} />
                <Text style={styles.backTitleSub}>كارت الحظ والقوة</Text>
                <Text style={styles.backTitleTag}>MYSTERY ACTION CARD</Text>
              </View>
            </View>

            {/* Bottom Corner Suits */}
            <View style={styles.suitRow}>
              <View style={styles.suitBadge}>
                <Text style={styles.suitSymbolRed}>♦</Text>
              </View>
              <View style={styles.suitBadge}>
                <Text style={styles.suitSymbolGold}>♣</Text>
              </View>
            </View>
          </Animated.View>

          {/* ============ FRONT OF CARD (Revealed Striking Power) ============ */}
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
            {/* Who activated banner */}
            <View style={[styles.playerBanner, { backgroundColor: `${card.color}25`, borderColor: card.color }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={16} color={card.color} />
              <Text style={[styles.playerBannerText, { color: card.color }]}>
                {isSelf ? 'أنت سحبت كارت الحظ! 🎲' : `قام ${playerName || 'متسابق'} بتفعيل هذا الكارت!`}
              </Text>
            </View>

            {/* 3D Icon with Radiant Halo */}
            <View style={styles.iconWrapper}>
              <Animated.View
                style={[
                  styles.iconHalo,
                  {
                    borderColor: card.color,
                    backgroundColor: `${card.color}15`,
                    transform: [{ scale: glowAnim }],
                  },
                ]}
              />
              <View style={[styles.iconInnerCircle, { backgroundColor: '#0B1120', borderColor: card.color }]}>
                <MaterialCommunityIcons name={card.icon as any} size={48} color={card.color} />
              </View>
            </View>

            {/* Card Badge Tag */}
            <View style={[styles.badgeTag, { backgroundColor: `${card.color}30`, borderColor: card.color }]}>
              <Text style={[styles.badgeTagText, { color: card.color }]}>{card.badge}</Text>
            </View>

            {/* Card Title & Subtitle */}
            <Text style={styles.cardTitleText}>{card.title}</Text>
            <Text style={styles.cardSubtitleText}>{card.subtitle}</Text>

            {/* Clear Description Box (1-2 lines) */}
            <View style={[styles.descBox, { borderColor: `${card.color}45` }]}>
              <Text style={styles.descText}>{card.description}</Text>
            </View>

            {/* Practical Example Box (💡 مثال) */}
            <View style={styles.exampleBox}>
              <View style={styles.exampleHeader}>
                <MaterialCommunityIcons name="lightbulb-on" size={15} color="#F59E0B" />
                <Text style={styles.exampleHeaderText}>توضيح بمثال عملي:</Text>
              </View>
              <Text style={styles.exampleText}>{card.example}</Text>
            </View>

            {/* Dismiss / Continue Button */}
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
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    zIndex: 9999,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    height: 520,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backfaceVisibility: 'hidden',
  },
  // ================= BACK STYLES =================
  cardBack: {
    backgroundColor: '#090D1A',
    borderWidth: 3.5,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 16,
  },
  suitRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  suitBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    borderRadius: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suitSymbolGold: {
    fontSize: 20,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  suitSymbolRed: {
    fontSize: 20,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  backCenterMedallion: {
    width: '90%',
    padding: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backInnerRing: {
    width: '100%',
    paddingVertical: 26,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#F59E0B',
    backgroundColor: '#070B16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTitleMain: {
    color: '#F59E0B',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  backGoldDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#F59E0B',
    marginVertical: 8,
    borderRadius: 1,
  },
  backTitleSub: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  backTitleTag: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 6,
  },
  // ================= FRONT STYLES =================
  cardFront: {
    backgroundColor: '#0B101E',
    borderWidth: 3.5,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.75,
    shadowRadius: 28,
    elevation: 18,
  },
  playerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 2,
  },
  playerBannerText: {
    fontSize: 12.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  iconWrapper: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  iconHalo: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
  },
  iconInnerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  badgeTag: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeTagText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  cardTitleText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
    writingDirection: 'rtl',
  },
  cardSubtitleText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  descBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
    writingDirection: 'rtl',
  },
  exampleBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.09)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    width: '100%',
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
    justifyContent: 'center',
  },
  exampleHeaderText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  exampleText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  continueBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  continueBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
});
