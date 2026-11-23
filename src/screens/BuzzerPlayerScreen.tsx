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

export const BuzzerPlayerScreen: React.FC<BuzzerPlayerScreenProps> = ({
  initialRoom,
  playerId,
  playerName,
  onExit,
}) => {
  const [room, setRoom] = useState<LiveBuzzerRoom>(initialRoom);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

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
          <Text style={styles.roomBadgeText}>غرفة #{room.code}</Text>
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
                <Text style={styles.scoreNum}>
                  {p.score}
                  <Text style={styles.scoreTarget}>/{room.targetScore}</Text>
                </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  scoreNum: {
    color: theme.colors.gold,
    fontWeight: '900',
    fontSize: 20,
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
});
