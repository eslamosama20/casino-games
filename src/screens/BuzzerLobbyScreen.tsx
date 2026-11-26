import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { LiveBuzzerRoom } from '../types';
import { buzzerService } from '../services/buzzerService';
import { soundManager } from '../services/soundService';

interface BuzzerLobbyScreenProps {
  onBack: () => void;
  onHostProceedToCategories: (room: LiveBuzzerRoom) => void;
  onPlayerJoined: (room: LiveBuzzerRoom, playerId: string, playerName: string) => void;
}

export const BuzzerLobbyScreen: React.FC<BuzzerLobbyScreenProps> = ({
  onBack,
  onHostProceedToCategories,
  onPlayerJoined,
}) => {
  const [tab, setTab] = useState<'host' | 'player'>('host');
  const [targetScore, setTargetScore] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Host state
  const [hostedRoom, setHostedRoom] = useState<LiveBuzzerRoom | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Player state
  const [playerName, setPlayerName] = useState<string>('');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');

  useEffect(() => {
    const unsub = buzzerService.onRoomUpdate((updatedRoom) => {
      setHostedRoom((prev) => {
        if (prev && prev.code === updatedRoom.code) {
          if (updatedRoom.players.length > prev.players.length) {
            soundManager.playChipClick();
          }
          return updatedRoom;
        }
        return prev;
      });
    });
    return () => {
      unsub();
    };
  }, []);

  const handleCreateRoom = async () => {
    setErrorMsg(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const res = await buzzerService.createRoom(targetScore);
    setLoading(false);

    if (res.ok && res.room) {
      soundManager.playPoint();
      setHostedRoom(res.room);
    } else {
      soundManager.playBuzzer();
      setErrorMsg(res.error || 'تعذر إنشاء الغرفة');
    }
  };

  const handleJoinRoom = async () => {
    setErrorMsg(null);
    const cleanCode = roomCodeInput.trim();
    const cleanName = playerName.trim();

    if (!cleanName) {
      setErrorMsg('اكتب اسمك الأول!');
      return;
    }
    if (cleanCode.length < 4) {
      setErrorMsg('اكتب كود الغرفة المكون من 4 أرقام');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const res = await buzzerService.joinRoom(cleanCode, cleanName);
    setLoading(false);

    if (res.ok && res.room && res.playerId) {
      soundManager.playPoint();
      onPlayerJoined(res.room, res.playerId, cleanName);
    } else {
      soundManager.playBuzzer();
      setErrorMsg(res.error || 'كود الغرفة غير صحيح');
    }
  };

  const handleCopyCode = () => {
    if (!hostedRoom) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(hostedRoom.code).catch(() => {});
    }
    setCopied(true);
    soundManager.playChipClick();
    setTimeout(() => setCopied(false), 1800);
  };

  const handleBackPress = () => {
    if (hostedRoom) {
      buzzerService.closeRoom(hostedRoom.code);
      setHostedRoom(null);
    }
    onBack();
  };

  const handleStartCategories = () => {
    if (!hostedRoom) return;
    if (hostedRoom.players.length < 1) {
      const msg = 'استنى لاعب واحد على الأقل يدخل الغرفة بالكود الأول!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('تنبيه', msg);
      }
      return;
    }
    onHostProceedToCategories(hostedRoom);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackPress} activeOpacity={0.75}>
            <Text style={{ fontSize: 20, color: theme.colors.textPrimary, fontWeight: 'bold', marginLeft: 4 }}>
              →
            </Text>
            <Text style={styles.backText}>رجوع</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <Text style={{ fontSize: 24, marginLeft: 6 }}>🔔</Text>
            <Text style={styles.headerTitle}>غرفة الجرس المباشر</Text>
          </View>
        </View>

        {/* Role Switcher (only before room is created) */}
        {!hostedRoom && (
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'host' && styles.tabBtnActive]}
              onPress={() => {
                setTab('host');
                setErrorMsg(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18, marginLeft: 6 }}>👑</Text>
              <Text style={[styles.tabText, tab === 'host' && styles.tabTextActive]}>
                أنا الحكم (إنشاء غرفة)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === 'player' && styles.tabBtnActive]}
              onPress={() => {
                setTab('player');
                setErrorMsg(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18, marginLeft: 6 }}>✋</Text>
              <Text style={[styles.tabText, tab === 'player' && styles.tabTextActive]}>
                أنا متسابق (دخول بكود)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={{ fontSize: 16, marginLeft: 6 }}>⚠️</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* HOST TAB */}
        {tab === 'host' && !hostedRoom && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إعداد غرفة الجرس للحكم 👑</Text>
            <Text style={styles.cardDesc}>
              اعمل غرفة وهيطلعلك كود من 4 أرقام تديه لأصحابك. لما تقرأ السؤال وتدوس «افتح الجرس»، أول واحد يدوس هيظهر عندك فوراً!
            </Text>

            <Text style={styles.label}>الهدف للفوز (عدد النقاط):</Text>
            <View style={styles.scorePillsRow}>
              {[5, 10, 15, 20].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.scorePill, targetScore === val && styles.scorePillActive]}
                  onPress={() => setTargetScore(val)}
                >
                  <Text
                    style={[
                      styles.scorePillText,
                      targetScore === val && styles.scorePillTextActive,
                    ]}
                  >
                    {val} نقاط
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleCreateRoom}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <>
                  <Text style={{ fontSize: 20, marginLeft: 6 }}>🔔</Text>
                  <Text style={styles.primaryBtnText}>إنشاء الغرفة وإظهار الكود</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* HOST ACTIVE LOBBY */}
        {hostedRoom && (
          <View style={styles.card}>
            <Text style={styles.lobbySubtitle}>ادّي الكود ده للمتسابقين عشان يدخلوا معاك:</Text>

            <TouchableOpacity style={styles.codeBox} onPress={handleCopyCode} activeOpacity={0.8}>
              <Text style={styles.codeDigits}>{'\u2066'}{hostedRoom.code}{'\u2069'}</Text>
              <View style={styles.copyBadge}>
                <Text style={{ fontSize: 13, marginLeft: 4 }}>
                  {copied ? '✓' : '📋'}
                </Text>
                <Text style={styles.copyText}>{copied ? 'تم النسخ ✓' : 'اضغط للنسخ'}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.playersHeaderRow}>
              <Text style={styles.playersHeaderText}>
                المتسابقون في الغرفة ({hostedRoom.players.length})
              </Text>
              <View style={styles.liveDotBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveDotText}>مباشر</Text>
              </View>
            </View>

            {hostedRoom.players.length === 0 ? (
              <View style={styles.emptyPlayersBox}>
                <ActivityIndicator color={theme.colors.gold} size="small" />
                <Text style={styles.emptyPlayersText}>
                  في انتظار المتسابقين يدخلوا الكود {hostedRoom.code}...
                </Text>
              </View>
            ) : (
              <View style={styles.playersList}>
                {hostedRoom.players.map((p, idx) => (
                  <View key={p.id} style={styles.playerRow}>
                    <TouchableOpacity
                      onPress={() => buzzerService.kickPlayer(hostedRoom.code, p.id)}
                      style={styles.kickBtn}
                    >
                      <Text style={{ color: theme.colors.danger, fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                    </TouchableOpacity>
                    <View style={styles.playerInfoRight}>
                      <Text style={styles.playerName}>{p.name}</Text>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: p.connected !== false ? '#22C55E' : '#64748B' },
                        ]}
                      />
                      <Text style={styles.playerIndex}>#{idx + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                hostedRoom.players.length === 0 && styles.primaryBtnDisabled,
              ]}
              onPress={handleStartCategories}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 20, marginLeft: 6 }}>▶</Text>
              <Text style={styles.primaryBtnText}>
                اختيار الفئات وبدء المسابقة ({hostedRoom.players.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PLAYER JOIN TAB */}
        {tab === 'player' && !hostedRoom && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ادخل غرفة الجرس كمتسابق 🚨</Text>
            <Text style={styles.cardDesc}>
              اكتب اسمك والكود الـ 4 أرقام اللي على شاشة الحكم، وهيفتحلك الجرس فوراً!
            </Text>

            <Text style={styles.label}>اسمك في اللعبة:</Text>
            <TextInput
              style={styles.input}
              placeholder="مثلاً: أحمد، سارة، محمود..."
              placeholderTextColor={theme.colors.textMuted}
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={20}
              textAlign="right"
            />

            <Text style={styles.label}>كود الغرفة (4 أرقام):</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="1234"
              placeholderTextColor={theme.colors.textMuted}
              value={roomCodeInput}
              onChangeText={(t) => setRoomCodeInput(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={5}
              textAlign="center"
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleJoinRoom}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <>
                  <Text style={{ fontSize: 20, marginLeft: 6 }}>🚀</Text>
                  <Text style={styles.primaryBtnText}>دخول الغرفة الآن</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    gap: 4,
  },
  backText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: theme.colors.gold,
    fontSize: 20,
    fontWeight: '900',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceBorder,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
  },
  tabText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#0F172A',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#FCA5A5',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'right',
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 8,
  },
  cardDesc: {
    color: theme.colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 18,
  },
  label: {
    color: theme.colors.gold,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 6,
  },
  scorePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  scorePill: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceBorder,
    alignItems: 'center',
  },
  scorePillActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
    borderColor: theme.colors.gold,
  },
  scorePillText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  scorePillTextActive: {
    color: theme.colors.gold,
    fontWeight: '900',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  codeInput: {
    fontSize: 28,
    letterSpacing: 10,
    color: theme.colors.gold,
    fontWeight: '900',
  },
  primaryBtn: {
    backgroundColor: theme.colors.gold,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  lobbySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 2,
    borderColor: theme.colors.gold,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeDigits: {
    color: theme.colors.gold,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 12,
    writingDirection: 'ltr',
    textAlign: 'center',
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  copyText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  playersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playersHeaderText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  liveDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveDotText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyPlayersBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 22,
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.surfaceBorder,
    marginBottom: 16,
  },
  emptyPlayersText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  playersList: {
    gap: 8,
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  kickBtn: {
    padding: 4,
  },
  playerInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playerIndex: {
    color: theme.colors.gold,
    fontWeight: '900',
    fontSize: 13,
  },
});
