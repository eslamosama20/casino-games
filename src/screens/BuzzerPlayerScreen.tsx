import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { LiveBuzzerRoom } from '../types';
import { buzzerService } from '../services/buzzerService';
import { soundManager } from '../services/soundService';

interface BuzzerPlayerScreenProps {
  initialRoom: LiveBuzzerRoom;
  playerId: string;
  playerName: string;
  onExit: () => void;
}

const PLUS_REACTIONS = [
  'ودّي يا معلم! 🔥🚀',
  'ابسط يا عم! 😎✨',
  'جامد ده يا فنان! 🏆👏',
  'إيه الدماغ دي؟! 🧠⚡',
  'يا عالمي! 👑🔥',
  'ضربة معلم! 🎯💥',
  'الله ينور عليك! 💡👏',
  'شابوه والله! 🎩✨',
  'عاش يا وحش! 🦁⚡',
  'مين قدك النهاردة؟! 💪🔥',
  'أيوة بقى ولّعها! 🔥🎊',
  'ملعبك يا نجم! 🌟🎯',
];

const MINUS_REACTIONS = [
  'ركّز يا عم هتفضحنا! 😂🤦‍♂️',
  'إيه اللي بتقوله ده؟! 🫣💀',
  'يا ساتر ع الهبد! 🤣📉',
  'اهبد كمان اهبد! 🧱😂',
  'النت فصل من دماغك ولا إيه؟! 📡🤣',
  'اصحى معانا الجو سخن! ☕🔥',
  'حاول تاني.. بس فكّر الأول! 🤭🧠',
  'سالب في السريع! ⚠️😬',
  'السالب بينادي عليك! 📉👻',
  'راحت منك يا بطل! 💔😅',
  'واضح إنك جاي تتفرج! 👀😂',
  'لا كده كتير.. ركّز شوية! 🚨🤣',
];

export const BuzzerPlayerScreen: React.FC<BuzzerPlayerScreenProps> = ({
  initialRoom,
  playerId,
  playerName,
  onExit,
}) => {
  const [room, setRoom] = useState<LiveBuzzerRoom>(initialRoom);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());
  const [scoreBubble, setScoreBubble] = useState<{
    id: number;
    delta: number;
    text: string;
    startTopPct: number;
    startLeftPct: number;
    driftX: number;
    tiltDeg: number;
  } | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const bubbleScale = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleFloatY = useRef(new Animated.Value(0)).current;
  const bubbleDriftX = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<any>(null);
  const prevMyScoreRef = useRef<number | null>(
    initialRoom.players.find((p) => p.id === playerId)?.score ?? 0
  );
  const prevStatusRef = useRef<string>(initialRoom.status);

  useEffect(() => {
    const unsubUpdate = buzzerService.onRoomUpdate((updated) => {
      setRoom(updated);
    });

    const unsubOpened = buzzerService.onBuzzerOpened(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      soundManager.playCardFlip();
    });

    const unsubWinner = buzzerService.onBuzzerWinner((data) => {
      if (data.playerId === playerId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        soundManager.playPoint();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        soundManager.playBuzzer();
      }
    });

    const unsubClosed = buzzerService.onRoomClosed(() => {
      const msg = 'الحكم أغلق الغرفة.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('انتهت الغرفة', msg);
      }
      onExit();
    });

    const unsubKicked = buzzerService.onKicked(() => {
      const msg = 'تم إخراجك من الغرفة بواسطة الحكم.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('تنبيه', msg);
      }
      onExit();
    });

    return () => {
      unsubUpdate();
      unsubOpened();
      unsubWinner();
      unsubClosed();
      unsubKicked();
    };
  }, [playerId, onExit]);

  const lastEventTsRef = useRef<number>(initialRoom.lastScoreEvent?.timestamp || 0);

  // Trigger funny Egyptian reaction pop-up reliably via Firebase lastScoreEvent!
  useEffect(() => {
    const ev = room.lastScoreEvent;
    if (!ev || ev.playerId !== playerId) return;
    if (ev.timestamp === lastEventTsRef.current) return;
    lastEventTsRef.current = ev.timestamp;

    const delta = ev.delta;
    const currentScore = ev.newScore;
    let phrase = '';

    if (delta > 0) {
      soundManager.playPoint();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (currentScore === room.targetScore - 1) {
        phrase = 'نقطة واحدة وتكسب الكل! 👑🔥';
      } else {
        phrase = PLUS_REACTIONS[Math.floor(Math.random() * PLUS_REACTIONS.length)];
      }
    } else if (delta < 0) {
      soundManager.playBuzzer();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      if (currentScore <= -3 && Math.random() < 0.5) {
        phrase = 'إنت غرقان في السالب يا صاحبي! 🌊😂';
      } else {
        phrase = MINUS_REACTIONS[Math.floor(Math.random() * MINUS_REACTIONS.length)];
      }
    }

    if (!phrase) return;

    // Pick a random screen spot & floating path every single time!
    const startTopPct = 24 + Math.floor(Math.random() * 44); // 24% .. 68% from top
    const startLeftPct = 6 + Math.floor(Math.random() * 24); // 6% .. 30% from left (bubble is ~66% wide)
    const driftX = (Math.random() > 0.5 ? 1 : -1) * (14 + Math.floor(Math.random() * 22));
    const tiltDeg = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.floor(Math.random() * 5));

    setScoreBubble({
      id: ev.timestamp,
      delta,
      text: phrase,
      startTopPct,
      startLeftPct,
      driftX,
      tiltDeg,
    });

    bubbleScale.setValue(0.2);
    bubbleOpacity.setValue(0);
    bubbleFloatY.setValue(0);
    bubbleDriftX.setValue(0);

    // Phase 1: Inflate bubble + float upward smoothly
    Animated.parallel([
      Animated.spring(bubbleScale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleFloatY, {
        toValue: -115,
        duration: 2450,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleDriftX, {
        toValue: driftX,
        duration: 2450,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 2: POP! Rapidly swell and burst into nothing
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(bubbleScale, {
          toValue: 1.48,
          duration: 190,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleOpacity, {
          toValue: 0,
          duration: 190,
          useNativeDriver: true,
        }),
      ]).start(() => setScoreBubble(null));
    }, 2250);
  }, [room.lastScoreEvent, room.targetScore, playerId, bubbleScale, bubbleOpacity, bubbleFloatY, bubbleDriftX]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Pulse animation when buzzer is open
  const isLockedOut = room.lockedOutPlayerIds.includes(playerId);
  const canBuzz = room.status === 'playing' && room.buzzerState === 'open' && !isLockedOut;

  useEffect(() => {
    if (canBuzz) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.07, duration: 480, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 480, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [canBuzz, pulseAnim]);

  const handleBuzz = () => {
    if (!canBuzz) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.9, duration: 60, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    buzzerService.pressBuzzer(room.code, playerId);
  };

  const handleLeave = () => {
    const confirmMsg = 'هل تريد الخروج من غرفة الجرس؟';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(confirmMsg)) {
        buzzerService.disconnect();
        onExit();
      }
    } else {
      Alert.alert('خروج', confirmMsg, [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: () => {
            buzzerService.disconnect();
            onExit();
          },
        },
      ]);
    }
  };

  const isMyBuzz = room.buzzerState === 'buzzed' && room.buzzedBy?.playerId === playerId;
  const maxScore = Math.max(0, ...room.players.map((p) => p.score));

  // Determine buzzer visual theme
  let buzzerBg = '#1E293B';
  let buzzerBorder = '#334155';
  let buzzerLabel = 'استنى الحكم...';
  let buzzerSub = 'الجرس مقفول حالياً';
  let buzzerIcon: any = 'lock-outline';

  if (room.status === 'lobby') {
    buzzerBg = '#1E293B';
    buzzerBorder = theme.colors.gold;
    buzzerLabel = 'جاهز للعب!';
    buzzerSub = 'في انتظار الحكم يبدأ اللعبة...';
    buzzerIcon = 'clock-outline';
  } else if (room.status === 'finished') {
    buzzerBg = 'rgba(251, 191, 36, 0.2)';
    buzzerBorder = theme.colors.gold;
    buzzerLabel = room.winner?.id === playerId ? 'أنت الفائز! 🏆' : `فاز ${room.winner?.name || ''}`;
    buzzerSub = 'انتهت الجولة!';
    buzzerIcon = 'trophy';
  } else if (isMyBuzz) {
    buzzerBg = '#16A34A';
    buzzerBorder = '#4ADE80';
    buzzerLabel = 'أنت الأول! 🥇';
    buzzerSub = 'جاوب بصوتك الآن 🎤🔥';
    buzzerIcon = 'microphone';
  } else if (room.buzzerState === 'buzzed' && room.buzzedBy) {
    buzzerBg = '#334155';
    buzzerBorder = '#F59E0B';
    buzzerLabel = `${room.buzzedBy.name} سبقك!`;
    buzzerSub = 'الإجابة عنده الآن...';
    buzzerIcon = 'account-voice';
  } else if (isLockedOut) {
    buzzerBg = '#3F1D24';
    buzzerBorder = '#EF4444';
    buzzerLabel = 'مقفول عليك';
    buzzerSub = 'استنى السؤال الجاي ⏳';
    buzzerIcon = 'cancel';
  } else if (canBuzz) {
    buzzerBg = '#DC2626';
    buzzerBorder = '#FBBF24';
    buzzerLabel = 'دوس الآن!';
    buzzerSub = 'أسرع واحد يجاوب 🚨';
    buzzerIcon = 'bell-ring';
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeftBtns}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleLeave}>
            <MaterialCommunityIcons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsMuted(soundManager.toggleMute())}
          >
            <MaterialCommunityIcons
              name={isMuted ? 'volume-off' : 'volume-high'}
              size={20}
              color={isMuted ? theme.colors.textMuted : theme.colors.gold}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.roomBadge}>
          <Text style={styles.roomBadgeText}>غرفة {'\u2066'}#{room.code}{'\u2069'}</Text>
        </View>

        <View style={styles.targetBadge}>
          <Text style={styles.targetBadgeText}>الهدف: {room.targetScore}</Text>
        </View>
      </View>

      {/* Live Scoreboard Strip */}
      <View style={styles.scoreboardWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scoreboardContent}
        >
          {room.players.map((p) => {
            const isMe = p.id === playerId;
            const isLeader = p.score === maxScore && p.score > 0;
            const isBuzzed = room.buzzedBy?.playerId === p.id;
            return (
              <View
                key={p.id}
                style={[
                  styles.scoreCard,
                  isMe && styles.scoreCardMe,
                  isBuzzed && styles.scoreCardBuzzed,
                ]}
              >
                <View style={styles.scoreNameRow}>
                  {isLeader && (
                    <MaterialCommunityIcons name="crown" size={13} color={theme.colors.gold} />
                  )}
                  <Text style={styles.scoreName} numberOfLines={1}>
                    {p.name} {isMe ? '(أنت)' : ''}
                  </Text>
                </View>
                <View style={styles.scoreNumRow}>
                  <Text style={[styles.scoreNum, p.score < 0 && styles.scoreNumNegative]}>
                    {'\u2066'}{p.score}{'\u2069'}
                  </Text>
                  <Text style={styles.scoreTarget}>/{room.targetScore}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Buzzer Area */}
      <ScrollView
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.playerGreeting}>مرحباً {playerName} 👋</Text>

        <Animated.View
          style={{
            transform: [{ scale: Animated.multiply(pulseAnim, pressScale) }],
          }}
        >
          <TouchableOpacity
            activeOpacity={canBuzz ? 0.75 : 1}
            onPress={handleBuzz}
            disabled={!canBuzz}
            style={[
              styles.giantBuzzer,
              {
                backgroundColor: buzzerBg,
                borderColor: buzzerBorder,
                shadowColor: canBuzz ? '#EF4444' : isMyBuzz ? '#22C55E' : '#000',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={buzzerIcon}
              size={64}
              color={canBuzz || isMyBuzz ? '#FFFFFF' : theme.colors.gold}
            />
            <Text style={styles.buzzerLabel}>{buzzerLabel}</Text>
            <Text style={styles.buzzerSub}>{buzzerSub}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Live Multiple Choice Options (when Host reveals them as lifeline!) */}
        {room.currentOptions && room.currentOptions.length > 0 && room.status === 'playing' && (
          <View style={styles.optionsCard}>
            <View style={styles.optionsHeader}>
              <MaterialCommunityIcons name="format-list-bulleted" size={18} color={theme.colors.gold} />
              <Text style={styles.optionsHeaderText}>الاختيارات المساعدة من الحكم 🔠</Text>
            </View>
            <View style={styles.optionsList}>
              {room.currentOptions.map((opt, idx) => (
                <View key={idx} style={styles.optionRow}>
                  <Text style={styles.optionText}>{opt}</Text>
                  <View style={styles.optionBadge}>
                    <Text style={styles.optionBadgeText}>
                      {['أ', 'ب', 'ج', 'د'][idx] || idx + 1}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating & Popping Reaction Bubble Overlay (random spot every time, never blocks taps!) */}
      {scoreBubble && (
        <View style={styles.bubbleOverlay} pointerEvents="none">
          <Animated.View
            style={[
              styles.floatingBubble,
              scoreBubble.delta > 0 ? styles.bubblePlus : styles.bubbleMinus,
              {
                top: `${scoreBubble.startTopPct}%`,
                left: `${scoreBubble.startLeftPct}%`,
                opacity: bubbleOpacity,
                transform: [
                  { translateY: bubbleFloatY },
                  { translateX: bubbleDriftX },
                  { rotate: `${scoreBubble.tiltDeg}deg` },
                  { scale: bubbleScale },
                ],
              },
            ]}
          >
            {/* Glossy bubble highlight shine */}
            <View style={styles.bubbleShine} />
            <View
              style={[
                styles.scoreToastDeltaPill,
                scoreBubble.delta > 0 ? styles.deltaPillPlus : styles.deltaPillMinus,
              ]}
            >
              <Text style={styles.scoreToastDeltaText}>
                {'\u2066'}
                {scoreBubble.delta > 0 ? `+${scoreBubble.delta}` : `${scoreBubble.delta}`}
                {'\u2069'}
              </Text>
            </View>
            <Text style={styles.scoreToastText}>{scoreBubble.text}</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  topLeftBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  roomBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  roomBadgeText: {
    color: theme.colors.gold,
    fontWeight: '900',
    fontSize: 14,
  },
  targetBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  targetBadgeText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
  },
  scoreboardWrap: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
    paddingVertical: 10,
  },
  scoreboardContent: {
    paddingHorizontal: 14,
    gap: 10,
  },
  scoreCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 96,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceBorder,
  },
  scoreCardMe: {
    borderColor: theme.colors.gold,
  },
  scoreCardBuzzed: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderColor: '#4ADE80',
  },
  scoreNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  scoreName: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
    maxWidth: 90,
  },
  scoreNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  scoreNum: {
    color: theme.colors.gold,
    fontWeight: '900',
    fontSize: 20,
    writingDirection: 'ltr',
  },
  scoreNumNegative: {
    color: '#EF4444',
  },
  scoreTarget: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  mainContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 24,
  },
  playerGreeting: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  giantBuzzer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  buzzerLabel: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
  },
  buzzerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  optionsCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 12,
  },
  optionsHeaderText: {
    color: theme.colors.gold,
    fontWeight: '900',
    fontSize: 14,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  optionText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  optionBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeText: {
    color: theme.colors.gold,
    fontWeight: '900',
    fontSize: 13,
  },
  bubbleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  floatingBubble: {
    position: 'absolute',
    maxWidth: '72%',
    minWidth: 190,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  bubblePlus: {
    backgroundColor: 'rgba(16, 185, 129, 0.88)',
    borderColor: '#A7F3D0',
  },
  bubbleMinus: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    borderColor: '#FECACA',
  },
  bubbleShine: {
    position: 'absolute',
    top: 5,
    left: 18,
    width: 28,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  scoreToastDeltaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  deltaPillPlus: {
    backgroundColor: '#065F46',
  },
  deltaPillMinus: {
    backgroundColor: '#7F1D1D',
  },
  scoreToastDeltaText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    writingDirection: 'ltr',
  },
  scoreToastText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    flexShrink: 1,
  },
});
