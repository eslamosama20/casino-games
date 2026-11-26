import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PowerCard } from '../types';
import { getPowerCardById } from '../data/powerCards';
import { soundManager } from '../services/soundService';

const bgNeon = require('../../assets/bg-neon.jpg');

interface PowerCardModalProps {
  visible: boolean;
  cardId?: string | null;
  playerName?: string;
  isSelf?: boolean;
  isInspect?: boolean;
  initialFlipped?: boolean;
  onDismiss: () => void;
}

export const PowerCardModal: React.FC<PowerCardModalProps> = ({
  visible,
  cardId,
  playerName,
  isSelf,
  isInspect,
  initialFlipped,
  onDismiss,
}) => {
  const card: PowerCard | undefined = cardId ? getPowerCardById(cardId) : undefined;

  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.35)).current;
  const glowAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible && card) {
      if (initialFlipped) {
        soundManager.playReveal();
        flipAnim.setValue(180);
      } else {
        // 1. Audio: dramatic card swoosh entrance
        soundManager.playCardWhoosh();
        flipAnim.setValue(0);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

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
          Animated.timing(glowAnim, { toValue: 1.25, duration: 650, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.8, duration: 650, useNativeDriver: true }),
        ])
      );
      glowLoop.start();

      let flipTimer: ReturnType<typeof setTimeout> | null = null;
      if (!initialFlipped) {
        // Phase 2: 3D Flip reveal with magic fanfare sound
        flipTimer = setTimeout(() => {
          soundManager.playCardMagicReveal();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

          Animated.timing(flipAnim, {
            toValue: 180,
            duration: 800,
            useNativeDriver: true,
          }).start();
        }, 800);
      }

      return () => {
        if (flipTimer) clearTimeout(flipTimer);
        glowLoop.stop();
      };
    }
  }, [visible, cardId, initialFlipped]);

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
        {/* Background tap to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => {
            soundManager.playChipClick();
            onDismiss();
          }}
          activeOpacity={1}
        />

        {/* Top Quick Close Button */}
        <TouchableOpacity
          style={styles.topCloseFloatingBtn}
          onPress={() => {
            soundManager.playChipClick();
            onDismiss();
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={24} color="#F8FAFC" />
        </TouchableOpacity>

        {/* Animated 3D Card Container */}
        <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>

          {/* ============ BACK OF CARD (Luxury Casino Gold Seal & Neon) ============ */}
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
            <ImageBackground
              source={bgNeon}
              style={styles.cardImageBg}
              imageStyle={styles.cardImageStyle}
              resizeMode="cover"
            >
              {/* Overlapping Vibrant Neon Ambient Glows */}
              <View style={[styles.ambientOrb, styles.orbMagenta]} />
              <View style={[styles.ambientOrb, styles.orbCyan]} />
              <View style={[styles.ambientOrb, styles.orbGold]} />
              <View style={[styles.ambientOrb, styles.orbEmerald]} />

              {/* Casino Watermarks Layer */}
              <View style={styles.watermarkContainer} pointerEvents="none">
                <Text style={styles.watermarkIconTopLeft}>🎰</Text>
                <Text style={styles.watermarkIconTopRight}>🎲</Text>
                <Text style={styles.watermarkIconBottomLeft}>🃏</Text>
                <Text style={styles.watermarkIconBottomRight}>👑</Text>
              </View>

              {/* Back Content Container */}
              <View style={styles.backContent}>
                {/* Top Corner Suits */}
                <View style={styles.suitRow}>
                  <View style={styles.suitBadge}>
                    <Text style={styles.suitSymbolGold}>♠</Text>
                  </View>
                  <View style={styles.topCasinoPill}>
                    <MaterialCommunityIcons name="poker-chip" size={14} color="#F59E0B" />
                    <Text style={styles.topCasinoPillText}>VIP CASINO CLUB</Text>
                  </View>
                  <View style={styles.suitBadge}>
                    <Text style={styles.suitSymbolRed}>♥</Text>
                  </View>
                </View>

                {/* Central Ornate Gold Medallion */}
                <View style={styles.backCenterMedallion}>
                  <View style={styles.backInnerRing}>
                    <View style={styles.chipGlowWrapper}>
                      <MaterialCommunityIcons name="cards-playing" size={56} color="#F59E0B" />
                    </View>
                    <Text style={styles.backTitleMain}>كازينو الألعاب</Text>
                    <View style={styles.backGoldDividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerStar}>★ ★ ★</Text>
                      <View style={styles.dividerLine} />
                    </View>
                    <Text style={styles.backTitleSub}>كارت الحظ والقوة الخارقة</Text>
                    <View style={styles.tagBadge}>
                      <Text style={styles.backTitleTag}>⚡ MYSTERY POWER CARD ⚡</Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Corner Suits */}
                <View style={styles.suitRow}>
                  <View style={styles.suitBadge}>
                    <Text style={styles.suitSymbolRed}>♦</Text>
                  </View>
                  <View style={styles.bottomChipsRow}>
                    <Text style={styles.miniChip}>🪙</Text>
                    <Text style={styles.miniChip}>🎰</Text>
                    <Text style={styles.miniChip}>🪙</Text>
                  </View>
                  <View style={styles.suitBadge}>
                    <Text style={styles.suitSymbolGold}>♣</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </Animated.View>

          {/* ============ FRONT OF CARD (Revealed Striking Casino Power) ============ */}
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
            <ImageBackground
              source={bgNeon}
              style={styles.cardImageBg}
              imageStyle={styles.cardImageStyle}
              resizeMode="cover"
            >
              {/* Dynamic Overlapping Neon Glows matching Card Theme */}
              <View style={[styles.ambientOrb, styles.orbFrontPrimary, { backgroundColor: card.color }]} />
              <View style={[styles.ambientOrb, styles.orbFrontSecondary, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.ambientOrb, styles.orbMagenta]} />

              {/* Casino Roulette & Chip Watermarks */}
              <View style={styles.watermarkContainer} pointerEvents="none">
                <Text style={[styles.watermarkIconTopRight, { opacity: 0.12 }]}>🎰</Text>
                <Text style={[styles.watermarkIconBottomLeft, { opacity: 0.12 }]}>🎲</Text>
              </View>

              {/* Front Content Layer */}
              <View style={styles.frontContent}>
                {/* Who activated banner */}
                <View style={[styles.playerBanner, { backgroundColor: `${card.color}25`, borderColor: card.color }]}>
                  <MaterialCommunityIcons name={isInspect ? 'eye-outline' : 'lightning-bolt'} size={16} color={card.color} />
                  <Text style={[styles.playerBannerText, { color: card.color }]}>
                    {isSelf
                      ? 'أنت سحبت كارت الحظ! 🎲'
                      : isInspect
                      ? `كارت المتسابق: ${playerName || 'المتسابق'} 🃏`
                      : `قام ${playerName || 'متسابق'} بتفعيل هذا الكارت!`}
                  </Text>
                </View>

                {/* 3D Icon with Radiant Casino Halo */}
                <View style={styles.iconWrapper}>
                  <Animated.View
                    style={[
                      styles.iconHalo,
                      {
                        borderColor: card.color,
                        backgroundColor: `${card.color}20`,
                        transform: [{ scale: glowAnim }],
                      },
                    ]}
                  />
                  <View style={[styles.iconInnerCircle, { backgroundColor: '#070C18', borderColor: card.color }]}>
                    <MaterialCommunityIcons name={card.icon as any} size={46} color={card.color} />
                  </View>
                </View>

                {/* Card Badge Tag */}
                <View style={[styles.badgeTag, { backgroundColor: `${card.color}35`, borderColor: card.color }]}>
                  <Text style={[styles.badgeTagText, { color: card.color }]}>{card.badge}</Text>
                </View>

                {/* Card Title & Subtitle */}
                <Text style={styles.cardTitleText}>{card.title}</Text>
                <Text style={styles.cardSubtitleText}>{card.subtitle}</Text>

                {/* Clear Frosted Glass Description Box */}
                <View style={[styles.descBox, { borderColor: `${card.color}50` }]}>
                  <Text style={styles.descText}>{card.description}</Text>
                </View>

                {/* Practical Example Box (💡 مثال) */}
                <View style={styles.exampleBox}>
                  <View style={styles.exampleHeader}>
                    <MaterialCommunityIcons name="lightbulb-on" size={14} color="#F59E0B" />
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
                  <Text style={styles.continueBtnText}>
                    {isInspect ? 'إغلاق الكارت ✖' : 'استمرار اللعب 🎲'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </Animated.View>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.93)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  topCloseFloatingBtn: {
    position: 'absolute',
    top: 36,
    right: 20,
    zIndex: 10000,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 350,
    height: 535,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  cardImageBg: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardImageStyle: {
    borderRadius: 24,
  },

  // Overlapping Neon Ambient Light Orbs
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbMagenta: {
    width: 170,
    height: 170,
    top: -40,
    left: -40,
    backgroundColor: '#EC4899',
    opacity: 0.22,
  },
  orbCyan: {
    width: 190,
    height: 190,
    bottom: -50,
    right: -40,
    backgroundColor: '#06B6D4',
    opacity: 0.24,
  },
  orbGold: {
    width: 140,
    height: 140,
    top: '35%',
    left: '28%',
    backgroundColor: '#F59E0B',
    opacity: 0.18,
  },
  orbEmerald: {
    width: 130,
    height: 130,
    bottom: '20%',
    left: -20,
    backgroundColor: '#10B981',
    opacity: 0.16,
  },
  orbFrontPrimary: {
    width: 180,
    height: 180,
    top: -20,
    right: -30,
    opacity: 0.25,
  },
  orbFrontSecondary: {
    width: 150,
    height: 150,
    bottom: -20,
    left: -20,
    opacity: 0.22,
  },

  // Subtle Watermarks
  watermarkContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    padding: 16,
  },
  watermarkIconTopLeft: {
    position: 'absolute',
    top: 55,
    left: 20,
    fontSize: 26,
    opacity: 0.15,
  },
  watermarkIconTopRight: {
    position: 'absolute',
    top: 55,
    right: 20,
    fontSize: 26,
    opacity: 0.15,
  },
  watermarkIconBottomLeft: {
    position: 'absolute',
    bottom: 55,
    left: 20,
    fontSize: 26,
    opacity: 0.15,
  },
  watermarkIconBottomRight: {
    position: 'absolute',
    bottom: 55,
    right: 20,
    fontSize: 26,
    opacity: 0.15,
  },

  // ================= BACK STYLES =================
  cardBack: {
    backgroundColor: '#090D1A',
    borderWidth: 3.5,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.75,
    shadowRadius: 26,
    elevation: 18,
  },
  backContent: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 26, 0.78)',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  suitRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  topCasinoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  topCasinoPillText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  bottomChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.75,
  },
  miniChip: {
    fontSize: 16,
  },
  suitBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.6)',
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
    width: '94%',
    padding: 4,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.7)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  backInnerRing: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(7, 11, 22, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGlowWrapper: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
  },
  backTitleMain: {
    color: '#F59E0B',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(245, 158, 11, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  backGoldDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  dividerLine: {
    width: 45,
    height: 1.5,
    backgroundColor: '#F59E0B',
  },
  dividerStar: {
    color: '#FCD34D',
    fontSize: 10,
    letterSpacing: 2,
  },
  backTitleSub: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  tagBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  backTitleTag: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // ================= FRONT STYLES =================
  cardFront: {
    backgroundColor: '#0B101E',
    borderWidth: 3.5,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 28,
    elevation: 20,
  },
  frontContent: {
    flex: 1,
    backgroundColor: 'rgba(11, 16, 30, 0.82)',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  playerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  playerBannerText: {
    fontSize: 12.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  iconWrapper: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    position: 'relative',
  },
  iconHalo: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
  },
  iconInnerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    fontSize: 11,
    fontWeight: '900',
  },
  cardTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 2,
    writingDirection: 'rtl',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardSubtitleText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  descBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 19,
    writingDirection: 'rtl',
  },
  exampleBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 10.5,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  exampleText: {
    color: '#FCD34D',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
    writingDirection: 'rtl',
  },
  continueBtn: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  continueBtnText: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '900',
  },
});
