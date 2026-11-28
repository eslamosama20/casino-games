import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { GameMode, Player } from '../types';
import { questionService } from '../services/questionService';
import { soundManager } from '../services/soundService';

interface SetupScreenProps {
  onNext: (settings: { mode: GameMode; targetScore: number; players: Player[] }) => void;
  onOpenBuzzerLobby?: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onNext, onOpenBuzzerLobby }) => {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<GameMode>('individuals');
  const [targetScore, setTargetScore] = useState<number>(10);
  const [playerNames, setPlayerNames] = useState<string[]>([
    'اللاعب 1',
    'اللاعب 2',
  ]);
  const [newPlayerInput, setNewPlayerInput] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<{ text: string; isOnline: boolean } | null>(null);

  useEffect(() => {
    const doSync = async () => {
      const result = await questionService.syncQuestionsFromApi();
      setSyncStatus({
        text: result.isOnline ? (result.updated ? 'تم تحديث الأسئلة ✓' : 'الأسئلة محدثة ✓') : 'وضع أوفلاين',
        isOnline: result.isOnline,
      });
    };
    doSync();
  }, []);

  // Update existing player name in place
  const handleEditPlayerName = (index: number, newName: string) => {
    const updated = [...playerNames];
    updated[index] = newName;
    setPlayerNames(updated);
  };

  const handleAddPlayer = () => {
    const trimmed = newPlayerInput.trim();
    if (!trimmed) {
      const defaultName = mode === 'teams' 
        ? `فريق ${playerNames.length + 1}` 
        : `اللاعب ${playerNames.length + 1}`;
      setPlayerNames([...playerNames, defaultName]);
    } else {
      setPlayerNames([...playerNames, trimmed]);
      setNewPlayerInput('');
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (playerNames.length <= 2) {
      Alert.alert('تنبيه', 'لازم على الأقل اتنين للمنافسة! تقدر تعدل أساميهم براحتك.');
      return;
    }
    const updated = [...playerNames];
    updated.splice(index, 1);
    setPlayerNames(updated);
  };

  const handleResetQuestionsHistory = async () => {
    soundManager.playChipClick();
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('هل أنت متأكد من تصفير سجل كل الأسئلة اللي ظهرت قبل كده عشان تظهر من جديد؟') : true;
      if (confirmed) {
        await questionService.resetSeenQuestions();
        if (typeof window !== 'undefined') {
          window.alert('تمت العملية بنجاح: تم تصفير سجل الأسئلة وستظهر كل الأسئلة من جديد! ✓');
        }
      }
      return;
    }

    Alert.alert(
      'تصفير الأسئلة',
      'هل أنت متأكد من تصفير سجل كل الأسئلة اللي ظهرت قبل كده عشان تظهر من جديد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تصفير',
          style: 'destructive',
          onPress: async () => {
            await questionService.resetSeenQuestions();
            Alert.alert('تمت العملية', 'تم تصفير سجل الأسئلة بنجاح!');
          },
        },
      ]
    );
  };

  const handleSwitchMode = (nextMode: GameMode) => {
    setMode(nextMode);
    setPlayerNames((prev) =>
      prev.map((n, idx) => {
        const trimmed = n.trim();
        if (nextMode === 'teams' && /^اللاعب\s+\d+$/.test(trimmed)) {
          return `فريق ${idx + 1}`;
        }
        if (nextMode === 'individuals' && /^فريق\s+\d+$/.test(trimmed)) {
          return `اللاعب ${idx + 1}`;
        }
        return n;
      })
    );
  };

  const handleContinue = () => {
    // Validate names are not empty and deduplicate identical names
    const seenCounts: Record<string, number> = {};
    const cleanedNames = playerNames.map((n, idx) => {
      const trimmed = n.trim().slice(0, 14);
      const baseName = trimmed.length > 0 ? trimmed : (mode === 'teams' ? `فريق ${idx + 1}` : `اللاعب ${idx + 1}`);
      const key = baseName.toLowerCase();
      seenCounts[key] = (seenCounts[key] || 0) + 1;
      return seenCounts[key] > 1 ? `${baseName} (${seenCounts[key]})` : baseName;
    });

    if (cleanedNames.length < 2) {
      Alert.alert('تنبيه', 'يجب تحديد لاعبين على الأقل للبدء.');
      return;
    }

    const players: Player[] = cleanedNames.map((name, idx) => ({
      id: `p_${Date.now()}_${idx}`,
      name,
      score: 0,
    }));

    onNext({
      mode,
      targetScore,
      players,
    });
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
          <TouchableOpacity accessibilityRole="button"
            style={styles.resetButton}
            onPress={handleResetQuestionsHistory}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 15, marginLeft: 4 }}>🔄</Text>
            <Text style={styles.resetButtonText}>تصفير السجل</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={{ fontSize: 26, marginLeft: 6 }}>🃏</Text>
            <Text style={styles.title}>كازينو الألعاب</Text>
          </View>
        </View>

        {/* Sync Badge (shown only when online API sync succeeds) */}
        {syncStatus && syncStatus.isOnline && (
          <View style={styles.syncBadgeContainer}>
            <View style={[styles.syncBadge, styles.syncBadgeOnline]}>
              <Text style={{ fontSize: 13, marginLeft: 4 }}>☁️</Text>
              <Text style={[styles.syncBadgeText, styles.syncBadgeTextOnline]}>
                {syncStatus.text}
              </Text>
            </View>
          </View>
        )}

        {/* Live Buzzer Multiplayer Banner */}
        {onOpenBuzzerLobby && (
          <TouchableOpacity accessibilityRole="button"
            style={styles.buzzerEntryBanner}
            onPress={onOpenBuzzerLobby}
            activeOpacity={0.85}
          >
            <View style={styles.buzzerEntryLeft}>
              <Text style={{ color: theme.colors.gold, fontSize: 26, fontWeight: '900' }}>‹</Text>
            </View>
            <View style={styles.buzzerEntryTextWrap}>
              <View style={styles.buzzerEntryTitleRow}>
                <Text style={styles.buzzerEntryTitle}>غرفة الجرس المباشر</Text>
                <View style={styles.newPill}>
                  <Text style={styles.newPillText}>جديد 🔔</Text>
                </View>
              </View>
              <Text style={styles.buzzerEntrySub}>
                الحكم يعمل غرفة بكود والمتسابقين يدوسوا الجرس من موبايلاتهم لايف!
              </Text>
            </View>
            <View style={styles.buzzerEntryIconCircle}>
              <Text style={{ fontSize: 26, textAlign: 'center' }}>🔔</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Mode Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>طريقة اللعب</Text>
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity accessibilityRole="button"
              style={[
                styles.modeOption,
                mode === 'individuals' && styles.modeOptionActive,
              ]}
              onPress={() => handleSwitchMode('individuals')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18, marginLeft: 6 }}>👤</Text>
              <Text
                style={[
                  styles.modeOptionText,
                  mode === 'individuals' && styles.modeOptionTextActive,
                ]}
              >
                أفراد
              </Text>
            </TouchableOpacity>

            <TouchableOpacity accessibilityRole="button"
              style={[
                styles.modeOption,
                mode === 'teams' && styles.modeOptionActive,
              ]}
              onPress={() => handleSwitchMode('teams')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18, marginLeft: 6 }}>👥</Text>
              <Text
                style={[
                  styles.modeOptionText,
                  mode === 'teams' && styles.modeOptionTextActive,
                ]}
              >
                فرق
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Target Score Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>نقاط الفوز (التارجت)</Text>
          <View style={styles.scoreRow}>
            <TouchableOpacity accessibilityRole="button"
              style={[styles.scoreCounterBtn, styles.scoreCounterMinus]}
              onPress={() => {
                soundManager.playChipClick();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setTargetScore(Math.max(3, targetScore - 1));
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.counterSymbolMinus}>-</Text>
            </TouchableOpacity>

            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreValue}>{targetScore}</Text>
              <Text style={styles.scoreUnit}>نقاط</Text>
            </View>

            <TouchableOpacity accessibilityRole="button"
              style={[styles.scoreCounterBtn, styles.scoreCounterPlus]}
              onPress={() => {
                soundManager.playChipClick();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setTargetScore(Math.min(50, targetScore + 1));
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.counterSymbolPlus}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Players / Teams List with In-Place Editable Names & Delete */}
        <View style={styles.card}>
          <View style={styles.playersHeader}>
            <Text style={styles.sectionHint}>اضغط على الاسم واكتب اللي تحبه مباشرة ✏️</Text>
            <Text style={styles.sectionTitle}>
              {mode === 'teams' ? 'أسماء الفرق' : 'أسماء المتسابقين'} ({playerNames.length})
            </Text>
          </View>

          {playerNames.map((name, index) => (
            <View key={index} style={styles.playerItem}>
              {/* Delete button on left */}
              <TouchableOpacity accessibilityRole="button"
                onPress={() => handleRemovePlayer(index)}
                style={styles.removeBtn}
                activeOpacity={0.6}
              >
                <Text style={{ fontSize: 18, color: playerNames.length <= 2 ? theme.colors.textMuted : theme.colors.danger, fontWeight: 'bold' }}>
                  🗑️
                </Text>
              </TouchableOpacity>

              {/* Editable Name Input directly in place! */}
              <TextInput
                style={styles.editablePlayerInput}
                value={name}
                onChangeText={(text) => handleEditPlayerName(index, text)}
                placeholder={mode === 'teams' ? `فريق ${index + 1}` : `اللاعب ${index + 1}`}
                placeholderTextColor={theme.colors.textMuted}
                textAlign="right"
                maxLength={14}
                returnKeyType="done"
              />

              {/* Player Index Badge on right */}
              <View style={styles.playerBadge}>
                <Text style={styles.playerBadgeText}>#{index + 1}</Text>
              </View>
            </View>
          ))}

          {/* Add player row */}
          <View style={styles.addPlayerRow}>
            <TouchableOpacity accessibilityRole="button"
              style={styles.addPlayerBtn}
              onPress={handleAddPlayer}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18, color: theme.colors.background, fontWeight: 'bold', marginLeft: 4 }}>
                ➕
              </Text>
              <Text style={styles.addPlayerBtnText}>إضافة</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={mode === 'teams' ? 'اكتب اسم فريق جديد...' : 'اكتب اسم لاعب جديد...'}
              placeholderTextColor={theme.colors.textMuted}
              value={newPlayerInput}
              onChangeText={setNewPlayerInput}
              textAlign="right"
              maxLength={14}
              onSubmitEditing={handleAddPlayer}
              returnKeyType="done"
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(
              insets.bottom,
              Platform.OS === 'android' ? 28 : 16
            ) + 12,
          },
        ]}
      >
        <TouchableOpacity accessibilityRole="button"
          style={styles.primaryBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>التالي: اختيار الفئات</Text>
          <Text style={{ fontSize: 20, color: theme.colors.background, fontWeight: 'bold', marginRight: 6 }}>
            ←
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.gold,
    letterSpacing: 0.5,
    writingDirection: 'rtl',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  resetButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  syncBadgeContainer: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  syncBadgeOnline: {
    backgroundColor: theme.colors.successBg,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  syncBadgeOffline: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  syncBadgeTextOnline: {
    color: theme.colors.success,
  },
  syncBadgeTextOffline: {
    color: theme.colors.textMuted,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    writingDirection: 'rtl',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    gap: 6,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    gap: 8,
  },
  modeOptionActive: {
    backgroundColor: theme.colors.gold,
  },
  modeOptionText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  modeOptionTextActive: {
    color: theme.colors.background,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  scoreCounterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreCounterMinus: {
    backgroundColor: '#3B1822',
    borderColor: '#EF4444',
  },
  scoreCounterPlus: {
    backgroundColor: '#133526',
    borderColor: '#22C55E',
  },
  counterSymbolMinus: {
    color: '#EF4444',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  counterSymbolPlus: {
    color: '#22C55E',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  scoreDisplay: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 34,
    fontWeight: 'bold',
    color: theme.colors.gold,
  },
  scoreUnit: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    writingDirection: 'rtl',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  playerBadge: {
    backgroundColor: theme.colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  playerBadgeText: {
    color: theme.colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  editablePlayerInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 10,
    writingDirection: 'rtl',
  },
  removeBtn: {
    padding: 8,
    marginRight: 6,
  },
  addPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    writingDirection: 'rtl',
  },
  addPlayerBtn: {
    backgroundColor: theme.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    gap: 4,
  },
  addPlayerBtnText: {
    color: theme.colors.background,
    fontWeight: 'bold',
    fontSize: 14,
    writingDirection: 'rtl',
  },
  footer: {
    backgroundColor: 'rgba(11, 15, 25, 0.82)',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
  },
  primaryBtn: {
    backgroundColor: theme.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    gap: 8,
  },
  primaryBtnText: {
    color: theme.colors.background,
    fontSize: 17,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  buzzerEntryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1.5,
    borderColor: theme.colors.gold,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: theme.spacing.md,
    gap: 12,
  },
  buzzerEntryLeft: {
    justifyContent: 'center',
  },
  buzzerEntryTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  buzzerEntryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  buzzerEntryTitle: {
    color: theme.colors.gold,
    fontSize: 16,
    fontWeight: '900',
    writingDirection: 'rtl',
  },
  newPill: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  newPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  buzzerEntrySub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  buzzerEntryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
