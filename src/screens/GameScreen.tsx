import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Category, Player, Question, DifficultyLevel } from '../types';
import { questionService } from '../services/questionService';
import { soundManager } from '../services/soundService';

interface GameScreenProps {
  players: Player[];
  targetScore: number;
  selectedCategoryIds: string[];
  onPlayerWon: (winner: Player, allPlayers: Player[]) => void;
  onQuitGame: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  players: initialPlayers,
  targetScore,
  selectedCategoryIds,
  onPlayerWon,
  onQuitGame,
}) => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showExhaustedModal, setShowExhaustedModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());

  // Timer states (customizable)
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const timerIntervalRef = useRef<any>(null);

  // Load questions and categories
  const initializeQuestions = async () => {
    setLoading(true);
    const cats = await questionService.getCategories();
    setCategories(cats);

    const eligibleQuestions = await questionService.getGameQuestions(selectedCategoryIds);
    if (eligibleQuestions.length === 0) {
      setShowExhaustedModal(true);
      setLoading(false);
      return;
    }

    setQuestions(eligibleQuestions);
    setCurrentIndex(0);
    setIsAnswerVisible(false);
    setShowHint(false);

    // Immediately mark the first question as seen
    await questionService.markQuestionAsSeen(eligibleQuestions[0].id);
    setLoading(false);
  };

  useEffect(() => {
    initializeQuestions();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setTimerRunning(false);
            // Buzzer sound & Haptic notification when timer ends
            soundManager.playBuzzer();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  const handleToggleTimer = () => {
    if (timerRunning) {
      setTimerRunning(false);
    } else {
      if (timeLeft === 0) setTimeLeft(timerDuration);
      setTimerRunning(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleResetTimer = (newDuration?: number) => {
    setTimerRunning(false);
    const duration = newDuration ?? timerDuration;
    setTimeLeft(duration);
  };

  const handleCycleTimerDuration = () => {
    const next = timerDuration === 15 ? 30 : timerDuration === 30 ? 60 : 15;
    setTimerDuration(next);
    handleResetTimer(next);
  };

  const handleToggleMute = () => {
    const updated = soundManager.toggleMute();
    setIsMuted(updated);
  };

  // Adjust score
  const updateScore = (playerId: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (delta > 0) {
      soundManager.playPoint();
    }

    const updated = players.map((p) => {
      if (p.id === playerId) {
        const newScore = Math.max(0, p.score + delta);
        return { ...p, score: newScore };
      }
      return p;
    });

    setPlayers(updated);

    // Check if any player hit targetScore
    const winner = updated.find((p) => p.score >= targetScore);
    if (winner) {
      soundManager.playWinner();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPlayerWon(winner, updated);
    }
  };

  // Move to next question
  const handleNextQuestion = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleResetTimer();
    setIsAnswerVisible(false);
    setShowHint(false);

    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      await questionService.markQuestionAsSeen(questions[nextIndex].id);
    } else {
      // Reached the end of fetched pool -> check if more are available or exhausted
      const moreQuestions = await questionService.getGameQuestions(selectedCategoryIds);
      if (moreQuestions.length > 0) {
        setQuestions(moreQuestions);
        setCurrentIndex(0);
        await questionService.markQuestionAsSeen(moreQuestions[0].id);
      } else {
        setShowExhaustedModal(true);
      }
    }
  };

  // Handle exhausted questions modal confirm
  const handleResetPoolAndContinue = async () => {
    setShowExhaustedModal(false);
    await questionService.resetSeenQuestions(selectedCategoryIds);
    await initializeQuestions();
  };

  const currentQuestion = questions[currentIndex];
  const currentCategory = categories.find((c) => c.id === currentQuestion?.categoryId);

  // Difficulty label helper
  const getDifficultyBadge = (diff?: DifficultyLevel) => {
    switch (diff) {
      case 'easy':
        return { label: 'سهل ⭐', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'medium':
        return { label: 'متوسط ⭐⭐', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'hard':
        return { label: 'صعب 🔥', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      default:
        return { label: 'عادي', color: theme.colors.gold, bg: theme.colors.amberGlow };
    }
  };

  const diffBadge = getDifficultyBadge(currentQuestion?.difficulty);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarIconsLeft}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => {
              Alert.alert('إنهاء الجولة', 'هل تريد الرجوع للقائمة الرئيسية؟', [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'خروج', style: 'destructive', onPress: onQuitGame },
              ]);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={handleToggleMute}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isMuted ? 'volume-off' : 'volume-high'}
              size={20}
              color={isMuted ? theme.colors.textMuted : theme.colors.gold}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.topBarTitle}>لوحة إدارة اللعبة</Text>

        <View style={styles.targetBadge}>
          <Text style={styles.targetBadgeText}>الهدف: {targetScore}</Text>
        </View>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboardWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scoreboardContent}
        >
          {players.map((p) => {
            const isLeading = p.score === Math.max(...players.map((x) => x.score)) && p.score > 0;
            return (
              <View
                key={p.id}
                style={[styles.scoreCard, isLeading && styles.scoreCardLeading]}
              >
                <Text style={styles.playerCardName} numberOfLines={1}>
                  {p.name}
                </Text>

                <View style={styles.scoreRow}>
                  <Text style={styles.scoreMain}>{p.score}</Text>
                  <Text style={styles.scoreTarget}>/{targetScore}</Text>
                </View>

                {/* Score Controls */}
                <View style={styles.scoreButtonsRow}>
                  <TouchableOpacity
                    style={[styles.miniBtn, styles.miniMinus]}
                    onPress={() => updateScore(p.id, -1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.miniBtnText}>-1</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.miniBtn, styles.miniPlus]}
                    onPress={() => updateScore(p.id, 1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.miniBtnText}>+1</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Question Section */}
      <View style={styles.centerSection}>
        {loading ? (
          <View style={styles.centerCard}>
            <Text style={styles.loadingText}>جاري تحضير السؤال...</Text>
          </View>
        ) : currentQuestion ? (
          <View style={styles.questionCard}>
            {/* Category tag & Difficulty badge */}
            <View style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryTag,
                  { backgroundColor: currentCategory?.color ? `${currentCategory.color}25` : theme.colors.amberGlow },
                ]}
              >
                <MaterialCommunityIcons
                  name={(currentCategory?.icon as any) || 'help-circle-outline'}
                  size={16}
                  color={currentCategory?.color || theme.colors.gold}
                />
                <Text style={[styles.categoryTagText, { color: currentCategory?.color || theme.colors.gold }]}>
                  {currentCategory?.name || 'سؤال'}
                </Text>
              </View>

              <View style={[styles.diffBadge, { backgroundColor: diffBadge.bg }]}>
                <Text style={[styles.diffBadgeText, { color: diffBadge.color }]}>
                  {diffBadge.label}
                </Text>
              </View>

              <Text style={styles.questionCounter}>
                #{currentIndex + 1}
              </Text>
            </View>

            {/* Question Text */}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Hint Box (if exists) */}
            {currentQuestion.hint && (
              <View style={styles.hintWrapper}>
                <TouchableOpacity
                  style={styles.hintToggleBtn}
                  onPress={() => setShowHint(!showHint)}
                >
                  <MaterialCommunityIcons name="lightbulb-outline" size={16} color={theme.colors.gold} />
                  <Text style={styles.hintToggleText}>
                    {showHint ? 'إخفاء التلميح' : 'تلميح للمتسابق؟ 💡'}
                  </Text>
                </TouchableOpacity>
                {showHint && (
                  <View style={styles.hintContentBox}>
                    <Text style={styles.hintContentText}>{currentQuestion.hint}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Hidden Answer Box */}
            <View style={styles.answerContainer}>
              {isAnswerVisible ? (
                <View style={styles.answerRevealedBox}>
                  <Text style={styles.answerLabel}>الإجابة الصحيحة:</Text>
                  <Text style={styles.answerText}>{currentQuestion.answer}</Text>
                </View>
              ) : (
                <View style={styles.answerHiddenBox}>
                  <MaterialCommunityIcons name="eye-off-outline" size={24} color={theme.colors.textMuted} />
                  <Text style={styles.answerHiddenText}>الإجابة مخفية لتجنب التلصص</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.toggleAnswerBtn, isAnswerVisible && styles.toggleAnswerBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsAnswerVisible(!isAnswerVisible);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isAnswerVisible ? 'eye-off' : 'eye'}
                  size={18}
                  color={isAnswerVisible ? theme.colors.gold : theme.colors.background}
                />
                <Text
                  style={[
                    styles.toggleAnswerBtnText,
                    isAnswerVisible && styles.toggleAnswerBtnTextActive,
                  ]}
                >
                  {isAnswerVisible ? 'إخفاء الإجابة' : 'إظهار الإجابة للمقدم'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Timer Widget with cycle 15s / 30s / 60s */}
            <View style={styles.timerWidget}>
              <View style={styles.timerHeader}>
                <View style={styles.timerControlsLeft}>
                  <TouchableOpacity onPress={() => handleResetTimer()} style={styles.timerResetBtn}>
                    <MaterialCommunityIcons name="restart" size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleCycleTimerDuration} style={styles.timerDurationBtn}>
                    <Text style={styles.timerDurationText}>{timerDuration}ث</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.timerButton, timerRunning && styles.timerButtonActive]}
                  onPress={handleToggleTimer}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={timerRunning ? 'pause' : 'timer-outline'}
                    size={20}
                    color={timerRunning ? theme.colors.danger : theme.colors.gold}
                  />
                  <Text style={[styles.timerButtonText, timerRunning && styles.timerButtonTextActive]}>
                    {timerRunning ? `متبقي ${timeLeft} ث` : timeLeft === 0 ? 'انتهى الوقت!' : `تايمر ${timerDuration} ثانية`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Timer Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${(timeLeft / timerDuration) * 100}%`,
                      backgroundColor: timeLeft <= 5 ? theme.colors.danger : theme.colors.gold,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNextQuestion}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>السؤال التالي / تخطي</Text>
          <MaterialCommunityIcons name="skip-next" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      {/* Exhausted Questions Modal */}
      <Modal
        visible={showExhaustedModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="alert-decagram" size={48} color={theme.colors.gold} />
            <Text style={styles.modalTitle}>خلصت الأسئلة!</Text>
            <Text style={styles.modalMessage}>
              خلصت كل الأسئلة في الفئات المختارة! تحب نعيد الأسئلة من الأول لنفس الفئات؟
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={onQuitGame}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>الرجوع للإعدادات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleResetPoolAndContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>إعادة الأسئلة والمتابعة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  topBarIconsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    padding: 8,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  topBarTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  targetBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  targetBadgeText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  scoreboardWrapper: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  scoreboardContent: {
    paddingHorizontal: theme.spacing.md,
    gap: 10,
  },
  scoreCard: {
    width: 120,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    alignItems: 'center',
  },
  scoreCardLeading: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.surfaceElevated,
  },
  playerCardName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreMain: {
    color: theme.colors.gold,
    fontSize: 22,
    fontWeight: 'bold',
  },
  scoreTarget: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  scoreButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  miniBtn: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMinus: {
    backgroundColor: theme.colors.dangerBg,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  miniPlus: {
    backgroundColor: theme.colors.successBg,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  miniBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  centerSection: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  centerCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    writingDirection: 'rtl',
  },
  questionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceBorder,
    shadowColor: theme.colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  questionCounter: {
    color: theme.colors.textMuted,
    fontSize: 12,
    writingDirection: 'rtl',
  },
  questionText: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    minHeight: 70,
    marginVertical: theme.spacing.sm,
    writingDirection: 'rtl',
  },
  hintWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  hintToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  hintToggleText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  hintContentBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  hintContentText: {
    color: theme.colors.goldLight,
    fontSize: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  answerContainer: {
    marginTop: theme.spacing.xs,
    gap: 8,
  },
  answerRevealedBox: {
    backgroundColor: theme.colors.successBg,
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  answerLabel: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  answerText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  answerHiddenBox: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.surfaceBorder,
  },
  answerHiddenText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    writingDirection: 'rtl',
  },
  toggleAnswerBtn: {
    backgroundColor: theme.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  toggleAnswerBtnActive: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  toggleAnswerBtnText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  toggleAnswerBtnTextActive: {
    color: theme.colors.gold,
  },
  timerWidget: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timerControlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerResetBtn: {
    padding: 6,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 8,
  },
  timerDurationBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  timerDurationText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: theme.colors.amberGlow,
  },
  timerButtonActive: {
    backgroundColor: theme.colors.dangerBg,
  },
  timerButtonText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  timerButtonTextActive: {
    color: theme.colors.danger,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  bottomBar: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
  },
  nextBtn: {
    backgroundColor: theme.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    gap: 8,
  },
  nextBtnText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  modalTitle: {
    color: theme.colors.gold,
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    writingDirection: 'rtl',
  },
  modalMessage: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    writingDirection: 'rtl',
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  modalConfirmBtn: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: theme.colors.background,
    fontWeight: 'bold',
    fontSize: 15,
    writingDirection: 'rtl',
  },
  modalCancelBtn: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
    writingDirection: 'rtl',
  },
});
