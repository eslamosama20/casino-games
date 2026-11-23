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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { GameMode, Player } from '../types';
import { questionService } from '../services/questionService';

interface SetupScreenProps {
  onNext: (settings: { mode: GameMode; targetScore: number; players: Player[] }) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onNext }) => {
  const [mode, setMode] = useState<GameMode>('individuals');
  const [targetScore, setTargetScore] = useState<number>(10);
  const [playerNames, setPlayerNames] = useState<string[]>([
    'اللاعب 1',
    'اللاعب 2',
  ]);
  const [newPlayerInput, setNewPlayerInput] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<{ text: string; isOnline: boolean } | null>(null);

  useEffect(() => {
    // Non-blocking auto sync on load
    const doSync = async () => {
      const result = await questionService.syncQuestionsFromApi();
      setSyncStatus({
        text: result.isOnline ? (result.updated ? 'تم تحديث الأسئلة ✓' : 'الأسئلة محدثة ✓') : 'وضع أوفلاين',
        isOnline: result.isOnline,
      });
    };
    doSync();
  }, []);

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
      Alert.alert('تنبيه', 'لازم على الأقل اتنين للمنافسة!');
      return;
    }
    const updated = [...playerNames];
    updated.splice(index, 1);
    setPlayerNames(updated);
  };

  const handleResetQuestionsHistory = () => {
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

  const handleContinue = () => {
    if (playerNames.length < 2) {
      Alert.alert('تنبيه', 'يجب تحديد لاعبين على الأقل للبدء.');
      return;
    }

    const players: Player[] = playerNames.map((name, idx) => ({
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
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetQuestionsHistory}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="refresh" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.resetButtonText}>تصفير السجل</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="cards-playing-outline" size={28} color={theme.colors.gold} />
            <Text style={styles.title}>كازينو الألعاب</Text>
          </View>
        </View>

        {/* Sync Badge */}
        {syncStatus && (
          <View style={styles.syncBadgeContainer}>
            <View
              style={[
                styles.syncBadge,
                syncStatus.isOnline ? styles.syncBadgeOnline : styles.syncBadgeOffline,
              ]}
            >
              <MaterialCommunityIcons
                name={syncStatus.isOnline ? 'cloud-check' : 'cloud-off-outline'}
                size={14}
                color={syncStatus.isOnline ? theme.colors.success : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.syncBadgeText,
                  syncStatus.isOnline ? styles.syncBadgeTextOnline : styles.syncBadgeTextOffline,
                ]}
              >
                {syncStatus.text}
              </Text>
            </View>
          </View>
        )}

        {/* Mode Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>طريقة اللعب</Text>
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                mode === 'individuals' && styles.modeOptionActive,
              ]}
              onPress={() => setMode('individuals')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="account-group-outline"
                size={22}
                color={mode === 'individuals' ? theme.colors.background : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.modeOptionText,
                  mode === 'individuals' && styles.modeOptionTextActive,
                ]}
              >
                أفراد
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeOption,
                mode === 'teams' && styles.modeOptionActive,
              ]}
              onPress={() => setMode('teams')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="shield-account-outline"
                size={22}
                color={mode === 'teams' ? theme.colors.background : theme.colors.textSecondary}
              />
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
            <TouchableOpacity
              style={styles.scoreCounterBtn}
              onPress={() => setTargetScore(Math.max(3, targetScore - 1))}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="minus" size={24} color={theme.colors.gold} />
            </TouchableOpacity>

            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreValue}>{targetScore}</Text>
              <Text style={styles.scoreUnit}>نقاط</Text>
            </View>

            <TouchableOpacity
              style={styles.scoreCounterBtn}
              onPress={() => setTargetScore(targetScore + 1)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="plus" size={24} color={theme.colors.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Players / Teams List */}
        <View style={styles.card}>
          <View style={styles.playersHeader}>
            <Text style={styles.sectionTitle}>
              {mode === 'teams' ? 'أسماء الفرق' : 'أسماء المتسابقين'} ({playerNames.length})
            </Text>
          </View>

          {playerNames.map((name, index) => (
            <View key={index} style={styles.playerItem}>
              <TouchableOpacity
                onPress={() => handleRemovePlayer(index)}
                style={styles.removeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.danger} />
              </TouchableOpacity>
              <View style={styles.playerNameContainer}>
                <Text style={styles.playerName}>{name}</Text>
                <View style={styles.playerBadge}>
                  <Text style={styles.playerBadgeText}>#{index + 1}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Add input */}
          <View style={styles.addPlayerRow}>
            <TouchableOpacity
              style={styles.addPlayerBtn}
              onPress={handleAddPlayer}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={22} color={theme.colors.background} />
              <Text style={styles.addPlayerBtnText}>إضافة</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={mode === 'teams' ? 'اسم الفريق...' : 'اسم اللاعب...'}
              placeholderTextColor={theme.colors.textMuted}
              value={newPlayerInput}
              onChangeText={setNewPlayerInput}
              textAlign="right"
              onSubmitEditing={handleAddPlayer}
              returnKeyType="done"
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>التالي: اختيار الفئات</Text>
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.background} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 110,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
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
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerBadge: {
    backgroundColor: theme.colors.surfaceBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  playerBadgeText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  playerName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  removeBtn: {
    padding: 4,
  },
  addPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
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
});
