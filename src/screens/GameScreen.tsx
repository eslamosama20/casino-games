import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { Category, Player, Question, DifficultyLevel, BuzzerState, ActiveCardEvent, RoomMediaState } from '../types';
import { questionService } from '../services/questionService';
import { soundManager } from '../services/soundService';
import { buzzerService } from '../services/buzzerService';
import { PowerCardModal } from '../components/PowerCardModal';
import { ImageBlurWidget } from '../components/ImageBlurWidget';
import { getPowerCardById, POWER_CARDS } from '../data/powerCards';
import { getCategoryEmoji, getPowerCardEmoji } from '../constants/emojis';

interface GameScreenProps {
  players: Player[];
  targetScore: number;
  selectedCategoryIds: string[];
  liveRoomCode?: string;
  onPlayerWon: (winner: Player, allPlayers: Player[]) => void;
  onQuitGame: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  players: initialPlayers,
  targetScore,
  selectedCategoryIds,
  liveRoomCode,
  onPlayerWon,
  onQuitGame,
}) => {
  const insets = useSafeAreaInsets();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [buzzerState, setBuzzerState] = useState<BuzzerState>('locked');
  const [buzzedBy, setBuzzedBy] = useState<{ playerId: string; name: string } | null>(null);
  const [scoreBadge, setScoreBadge] = useState<{
    playerId: string;
    text: string;
    color: string;
  } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [customReactionMsg, setCustomReactionMsg] = useState<string>('');
  const [activeCardEvent, setActiveCardEvent] = useState<ActiveCardEvent | null>(null);
  const [inspectCardData, setInspectCardData] = useState<{ cardId: string; playerName: string } | null>(null);
  const [showPowerCardModal, setShowPowerCardModal] = useState<boolean>(false);
  const [showContestantCardsModal, setShowContestantCardsModal] = useState<boolean>(false);
  const [showExhaustedModal, setShowExhaustedModal] = useState<boolean>(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);
  const [chosenCategoryFilter, setChosenCategoryFilter] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [roomMedia, setRoomMedia] = useState<RoomMediaState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());

  // Timer states (customizable)
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const timerIntervalRef = useRef<any>(null);

  // Creative animations for questions and scoring
  const cardAnim = useRef(new Animated.Value(1)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;

  const triggerCardAnimation = () => {
    cardAnim.setValue(0);
    soundManager.playCardFlip();
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  // Track questions already shown in this session so skipping doesn't immediately repeat them
  const sessionShownRef = useRef<Set<string>>(new Set());

  // Load questions and categories
  const initializeQuestions = async () => {
    setLoading(true);
    const cats = await questionService.getCategories();
    setCategories(cats);

    const counts = await questionService.getRemainingCountsByCategory();
    setCategoryCounts(counts);

    const eligibleQuestions = await questionService.getGameQuestions(selectedCategoryIds);
    if (eligibleQuestions.length === 0) {
      setShowExhaustedModal(true);
      setLoading(false);
      return;
    }

    setQuestions(eligibleQuestions);
    setCurrentIndex(0);
    setCurrentQuestion(eligibleQuestions[0]);
    sessionShownRef.current.add(eligibleQuestions[0].id);
    setIsAnswerVisible(false);
    setShowHint(false);
    setShowOptions(false);

    // Broadcast or setup interactive media state if question is image_blur or audio_clip
    if (eligibleQuestions[0]?.mediaType) {
      const initMedia: RoomMediaState = {
        type: eligibleQuestions[0].mediaType,
        url: eligibleQuestions[0].mediaUrl || '',
        title: eligibleQuestions[0].mediaTitle || eligibleQuestions[0].question,
        revealDuration: eligibleQuestions[0].revealDuration || 10,
        startedAt: Date.now(),
        frozenAt: null,
        revealed: false,
        buzzedSecond: null,
        pointsValue: null,
      };
      if (liveRoomCode) {
        buzzerService.setRoomMedia(liveRoomCode, initMedia);
      }
      setRoomMedia(initMedia);
    } else {
      if (liveRoomCode) {
        buzzerService.setRoomMedia(liveRoomCode, null);
      }
      setRoomMedia(null);
    }

    setLoading(false);
    triggerCardAnimation();
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

  // Live Buzzer room synchronization for Host
  useEffect(() => {
    if (!liveRoomCode) return;

    const unsubRoom = buzzerService.onRoomUpdate((room) => {
      if (room.code !== liveRoomCode) return;
      setBuzzerState(room.buzzerState);
      setBuzzedBy(room.buzzedBy ? { playerId: room.buzzedBy.playerId, name: room.buzzedBy.name } : null);
      setRoomMedia(room.currentMedia || null);
      if (room.players && room.players.length > 0) {
        setPlayers(room.players);
      }
    });

    const unsubWinner = buzzerService.onBuzzerWinner((data) => {
      if (data.room.code !== liveRoomCode) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      soundManager.playReveal();
    });

    const unsubCard = buzzerService.onPowerCardPlayed((event) => {
      setInspectCardData(null);
      setActiveCardEvent(event);
      setShowPowerCardModal(true);
    });

    return () => {
      unsubRoom();
      unsubWinner();
      unsubCard();
    };
  }, [liveRoomCode]);

  const handleInspectPlayerCard = (pName: string, cardId: string) => {
    soundManager.playChipClick();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setInspectCardData({ cardId, playerName: pName });
    setShowPowerCardModal(true);
  };

  // Adjust score (supports negative scores / التسليب!)
  const updateScore = (
    playerId: string,
    delta: number,
    reopenOnWrong = false,
    customMsg?: string
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (delta > 0) {
      soundManager.playPoint();
    } else {
      // Play buzzer or negative feedback when losing points
      soundManager.playBuzzer();
    }

    if (liveRoomCode) {
      buzzerService.updateScore(liveRoomCode, playerId, delta, reopenOnWrong, customMsg);
    }

    // Trigger visual floating badge on player card
    setScoreBadge({
      playerId,
      text: delta > 0 ? '+1 🔥' : '-1 ⚠️',
      color: delta > 0 ? theme.colors.success : theme.colors.danger,
    });
    badgeAnim.setValue(0);
    Animated.spring(badgeAnim, {
      toValue: 1,
      friction: 4,
      tension: 75,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      setScoreBadge(null);
    }, 1400);

    const updated = players.map((p) => {
      if (p.id === playerId) {
        // Allow negative scores freely (e.g. -1, -2, -5)
        const newScore = p.score + delta;
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

  // Move to next question with auto-advancing turn & category support
  const handleNextQuestion = async (specificCatId?: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleResetTimer();
    setIsAnswerVisible(false);
    setShowHint(false);
    setShowOptions(false);
    if (liveRoomCode) {
      buzzerService.openBuzzer(liveRoomCode, true);
    }

    const filterToUse = specificCatId !== undefined ? specificCatId : chosenCategoryFilter;
    const catsToFetch = filterToUse ? [filterToUse] : selectedCategoryIds;

    const available = await questionService.getGameQuestions(catsToFetch);
    // Prefer a question not yet shown in this session (if skipped without revealing answer)
    const fresh = available.filter((q) => !sessionShownRef.current.has(q.id));
    const nextQ = fresh.length > 0 ? fresh[0] : available[0];

    if (nextQ) {
      setCurrentQuestion(nextQ);
      sessionShownRef.current.add(nextQ.id);
      setCurrentIndex((prev) => prev + 1);

      // Broadcast or setup interactive media state if question is image_blur or audio_clip
      if (nextQ.mediaType) {
        const newMedia: RoomMediaState = {
          type: nextQ.mediaType,
          url: nextQ.mediaUrl || '',
          title: nextQ.mediaTitle || nextQ.question,
          revealDuration: nextQ.revealDuration || 10,
          startedAt: Date.now(),
          frozenAt: null,
          revealed: false,
          buzzedSecond: null,
          pointsValue: null,
        };
        if (liveRoomCode) {
          buzzerService.setRoomMedia(liveRoomCode, newMedia);
        }
        setRoomMedia(newMedia);
      } else {
        if (liveRoomCode) {
          buzzerService.setRoomMedia(liveRoomCode, null);
        }
        setRoomMedia(null);
      }

      triggerCardAnimation();

      // Refresh counts
      const counts = await questionService.getRemainingCountsByCategory();
      setCategoryCounts(counts);
    } else {
      if (filterToUse) {
        Alert.alert(
          'فئة مكتملة',
          'تم استهلاك كل أسئلة هذه الفئة! تم الرجوع للوضع العشوائي.',
          [
            {
              text: 'حسناً',
              onPress: () => {
                setChosenCategoryFilter(null);
                handleNextQuestion(null);
              },
            },
          ]
        );
      } else {
        setShowExhaustedModal(true);
      }
    }
  };

  // Host picks a specific category from inside the game
  const handleSelectCategoryFromModal = async (catId: string | null) => {
    setChosenCategoryFilter(catId);
    setShowCategoryPicker(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await handleNextQuestion(catId);
  };

  // Handle exhausted questions modal confirm
  const handleResetPoolAndContinue = async () => {
    setShowExhaustedModal(false);
    await questionService.resetSeenQuestions(selectedCategoryIds);
    await initializeQuestions();
  };

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

  // Safe quit prompt (supports Web window.confirm + Native Alert.alert)
  const handleQuitRequest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('هل تريد إنهاء الجولة والرجوع للقائمة الرئيسية؟')) {
        onQuitGame();
      }
    } else {
      Alert.alert('إنهاء الجولة', 'هل تريد الرجوع للقائمة الرئيسية؟', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'خروج', style: 'destructive', onPress: onQuitGame },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarIconsLeft}>
          <TouchableOpacity
            style={[styles.topBarBtn, styles.topBarExitBtn]}
            onPress={handleQuitRequest}
            activeOpacity={0.75}
          >
            <Text style={styles.topBarExitText}>✕ خروج</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.topBarBtn, isMuted ? styles.topBarMutedBtn : styles.topBarSoundBtn]}
            onPress={handleToggleMute}
            activeOpacity={0.75}
          >
            <Text style={[styles.topBarSoundText, isMuted && { color: '#94A3B8' }]}>
              {isMuted ? '🔇 مكتوم' : '🔊 صوت'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.topBarTitle}>لوحة إدارة اللعبة</Text>

        <View style={styles.topBarLeftArea}>
          <TouchableOpacity
            style={styles.contestantCardsTopBtn}
            onPress={() => {
              soundManager.playChipClick();
              setShowContestantCardsModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.contestantCardsTopBtnText}>🃏 الكروت</Text>
            {players.some((p) => !!p.usedCardId) && (
              <View style={styles.cardsActiveDot} />
            )}
          </TouchableOpacity>

          <View style={styles.targetBadge}>
            <Text style={styles.targetBadgeText}>الهدف: {targetScore}</Text>
          </View>
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
                style={[
                  styles.scoreCard,
                  isLeading && styles.scoreCardLeading,
                ]}
              >
                {/* Floating Score Badge Animation */}
                {scoreBadge?.playerId === p.id && (
                  <Animated.View
                    style={[
                      styles.floatingScoreBadge,
                      {
                        backgroundColor: scoreBadge.color,
                        transform: [
                          {
                            scale: badgeAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0.3, 1.25, 1],
                            }),
                          },
                          {
                            translateY: badgeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [6, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.floatingScoreText}>{scoreBadge.text}</Text>
                  </Animated.View>
                )}

                <View style={styles.playerNameContainer}>
                  {isLeading && (
                    <Text style={{ fontSize: 13, marginRight: 4 }}>👑</Text>
                  )}
                  <Text
                    style={styles.playerCardName}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </View>

                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreMain, p.score < 0 && styles.scoreNegative]}>
                    {p.score}
                  </Text>
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

                {/* Referee Card Review Badge */}
                {(() => {
                  const cId = p.usedCardId;
                  const pCard = cId ? getPowerCardById(cId) : undefined;
                  if (!pCard || !cId) return null;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.playerPowerCardBadge,
                        { borderColor: pCard.color, backgroundColor: `${pCard.color}18` },
                      ]}
                      onPress={() => handleInspectPlayerCard(p.name, cId)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.playerPowerCardText, { color: pCard.color }]} numberOfLines={1}>
                        {pCard.title} 👁️
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Live Buzzer Host Control Bar */}
      {liveRoomCode && (
        <View style={styles.liveBuzzerBar}>
          <View style={styles.liveBuzzerHeader}>
            <View style={styles.liveRoomPill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveRoomPillText}>غرفة الجرس {'\u2066'}#{liveRoomCode}{'\u2069'}</Text>
            </View>
            <Text style={styles.liveBuzzerHintText}>
              {buzzerState === 'locked'
                ? 'اقرأ السؤال ثم افتح الجرس'
                : buzzerState === 'open'
                ? 'الجرس مفتوح! في انتظار أسرع ضغطة...'
                : 'تم الضغط على الجرس!'}
            </Text>
          </View>

          {buzzerState === 'locked' && (
            <TouchableOpacity
              style={styles.openBuzzerBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                soundManager.playCardFlip();
                buzzerService.openBuzzer(liveRoomCode, false);
              }}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 18, marginLeft: 6 }}>🔔</Text>
              <Text style={styles.openBuzzerBtnText}>افتح الجرس للمتسابقين 🟢 (دوسوا!)</Text>
            </TouchableOpacity>
          )}

          {buzzerState === 'open' && (
            <View style={styles.buzzerOpenRow}>
              <TouchableOpacity
                style={styles.lockBuzzerSmallBtn}
                onPress={() => buzzerService.lockBuzzer(liveRoomCode, false)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14, marginLeft: 4 }}>🔒</Text>
                <Text style={styles.lockBuzzerSmallText}>قفل</Text>
              </TouchableOpacity>
              <View style={styles.buzzerOpenIndicator}>
                <Text style={{ fontSize: 16, marginLeft: 6 }}>📡</Text>
                <Text style={styles.buzzerOpenIndicatorText}>
                  الجرس مفتوح الآن — منتظر أول واحد يدوس 🚨
                </Text>
              </View>
            </View>
          )}

          {buzzerState === 'buzzed' && buzzedBy && (
            <View style={styles.buzzerWinnerBox}>
              <View style={styles.buzzerWinnerTop}>
                <Text style={{ fontSize: 18, marginLeft: 6 }}>🚨</Text>
                <Text style={styles.buzzerWinnerText}>
                  🥇 {buzzedBy.name} داس الأول! الإجابة عنده الآن 🎤
                </Text>
              </View>

              {/* Optional custom reaction message in floating bubble */}
              <View style={styles.customMsgContainer}>
                <TextInput
                  style={styles.customMsgInput}
                  placeholder={`رسالة لـ ${buzzedBy.name} في البالونة (اختياري)... 💬`}
                  placeholderTextColor="#94A3B8"
                  value={customReactionMsg}
                  onChangeText={setCustomReactionMsg}
                  maxLength={40}
                  returnKeyType="done"
                />
                {customReactionMsg.length > 0 && (
                  <TouchableOpacity
                    style={styles.customMsgClearBtn}
                    onPress={() => setCustomReactionMsg('')}
                  >
                    <Text style={{ fontSize: 14, color: '#94A3B8' }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.buzzerWinnerActions}>
                {(() => {
                  const awardPoints = (roomMedia?.pointsValue && roomMedia.pointsValue > 0) ? roomMedia.pointsValue : 1;
                  return (
                    <>
                      <TouchableOpacity
                        style={styles.buzzerCorrectBtn}
                        onPress={() => {
                          updateScore(buzzedBy.playerId, awardPoints, false, customReactionMsg);
                          setCustomReactionMsg('');
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={{ fontSize: 16, marginLeft: 4 }}>✓</Text>
                        <Text style={styles.buzzerCorrectBtnText}>صح (+{awardPoints}) وافتح 🔔</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.buzzerWrongReopenBtn}
                        onPress={() => {
                          updateScore(buzzedBy.playerId, -awardPoints, true, customReactionMsg);
                          setCustomReactionMsg('');
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={{ fontSize: 16, marginLeft: 4 }}>✕</Text>
                        <Text style={styles.buzzerWrongReopenText}>غلط (-{awardPoints}) وافتح 🔄</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}

                <TouchableOpacity
                  style={styles.buzzerReopenAllBtn}
                  onPress={() => {
                    setCustomReactionMsg('');
                    buzzerService.openBuzzer(liveRoomCode, true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 16, textAlign: 'center' }}>🔄</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Main Question Section */}
      <ScrollView
        style={styles.centerSectionScroll}
        contentContainerStyle={styles.centerSectionContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.centerCard}>
            <Text style={styles.loadingText}>جاري تحضير السؤال...</Text>
          </View>
        ) : currentQuestion ? (
          <Animated.View
            style={[
              styles.questionCard,
              {
                opacity: cardAnim,
                transform: [
                  {
                    scale: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.93, 1],
                    }),
                  },
                  {
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Category tag & Switcher Button */}
            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={[
                  styles.categoryTag,
                  { backgroundColor: currentCategory?.color ? `${currentCategory.color}25` : theme.colors.amberGlow },
                ]}
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 16 }}>{getCategoryEmoji(currentCategory?.id)}</Text>
                <Text style={[styles.categoryTagText, { color: currentCategory?.color || theme.colors.gold }]}>
                  {currentCategory?.name || 'سؤال'}
                </Text>
                <Text style={{ fontSize: 11, color: currentCategory?.color || theme.colors.gold }}>▼</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chooseCatBtn}
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 13, marginRight: 4 }}>🔄</Text>
                <Text style={styles.chooseCatBtnText}>اختر الفئة</Text>
              </TouchableOpacity>

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

            {/* Interactive Image Blur Widget */}
            {currentQuestion.mediaType === 'image_blur' && (
              <ImageBlurWidget
                imageUrl={currentQuestion.mediaUrl || ''}
                mediaTitle={currentQuestion.mediaTitle || 'صورة مشوشة'}
                revealDuration={currentQuestion.revealDuration || 10}
                startedAt={roomMedia?.startedAt}
                frozenAt={roomMedia?.frozenAt}
                revealed={roomMedia?.revealed || isAnswerVisible}
                buzzedSecond={roomMedia?.buzzedSecond}
                pointsValue={roomMedia?.pointsValue}
                buzzedByName={buzzedBy?.name}
                isHost={true}
                onManualReveal={() => {
                  setIsAnswerVisible(true);
                  if (liveRoomCode) {
                    buzzerService.setRoomMediaRevealed(liveRoomCode, true);
                  }
                  setRoomMedia((prev) => (prev ? { ...prev, revealed: true } : null));
                }}
              />
            )}

            {/* Hint Box (if exists) */}
            {currentQuestion.hint && (
              <View style={styles.hintWrapper}>
                <TouchableOpacity
                  style={styles.hintToggleBtn}
                  onPress={() => setShowHint(!showHint)}
                >
                  <Text style={{ fontSize: 15, marginRight: 4 }}>💡</Text>
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

            {/* Multiple Choice Options Lifeline for Contestants */}
            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <View style={styles.optionsWrapper}>
                <TouchableOpacity
                  style={styles.optionsToggleBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    soundManager.playChipClick();
                    const nextShow = !showOptions;
                    setShowOptions(nextShow);
                    if (liveRoomCode && currentQuestion?.options) {
                      buzzerService.setLiveOptions(
                        liveRoomCode,
                        nextShow ? currentQuestion.options : null
                      );
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 15, marginRight: 4 }}>🔠</Text>
                  <Text style={styles.optionsToggleText}>
                    {showOptions ? 'إخفاء الاختيارات' : 'خيارات للمتسابقين لو مش عارفين؟ 🔠'}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.colors.gold }}>{showOptions ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showOptions && (
                  <View style={styles.optionsGrid}>
                    {currentQuestion.options.map((opt, oIdx) => {
                      const letter = ['أ', 'ب', 'ج', 'د'][oIdx] || `${oIdx + 1}`;
                      const isCorrect =
                        opt.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase() ||
                        currentQuestion.answer.toLowerCase().includes(opt.toLowerCase());
                      return (
                        <View
                          key={oIdx}
                          style={[
                            styles.optionCard,
                            isCorrect && styles.optionCardCorrect,
                          ]}
                        >
                          <View
                            style={[
                              styles.optionLetterBadge,
                              isCorrect && styles.optionLetterBadgeCorrect,
                            ]}
                          >
                            <Text
                              style={[
                                styles.optionLetterText,
                                isCorrect && styles.optionLetterTextCorrect,
                              ]}
                            >
                              {letter}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.optionText,
                              isCorrect && styles.optionTextCorrect,
                            ]}
                            numberOfLines={2}
                          >
                            {opt}
                          </Text>
                          {isCorrect && (
                            <Text style={{ fontSize: 14, color: theme.colors.gold, marginRight: 6 }}>✓</Text>
                          )}
                        </View>
                      );
                    })}
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
                  <Text style={{ fontSize: 24, textAlign: 'center' }}>🔒</Text>
                  <Text style={styles.answerHiddenText}>الإجابة مخفية لتجنب التلصص</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.toggleAnswerBtn, isAnswerVisible && styles.toggleAnswerBtnActive]}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const willReveal = !isAnswerVisible;
                  setIsAnswerVisible(willReveal);
                  if (willReveal && currentQuestion) {
                    soundManager.playReveal();
                    // Mark question as seen for Host AND broadcast to all contestants in Live Buzzer Room!
                    await questionService.markQuestionAsSeen(currentQuestion.id);
                    if (liveRoomCode) {
                      buzzerService.markSeenForRoom(liveRoomCode, currentQuestion.id);
                      buzzerService.setRoomMediaRevealed(liveRoomCode, true);
                    }
                    setRoomMedia((prev) => (prev ? { ...prev, revealed: true } : null));
                    const counts = await questionService.getRemainingCountsByCategory();
                    setCategoryCounts(counts);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16, marginRight: 6 }}>{isAnswerVisible ? '🔒' : '👁️'}</Text>
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
                    <Text style={{ fontSize: 16 }}>🔄</Text>
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
                  <Text style={{ fontSize: 16, marginRight: 6 }}>{timerRunning ? '⏸️' : '⏱️'}</Text>
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
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Bottom Controls */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(
              insets.bottom,
              Platform.OS === 'android' ? 28 : 16
            ) + 12,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => handleNextQuestion()}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>السؤال التالي / تخطي</Text>
          <Text style={{ fontSize: 20, color: theme.colors.background, marginLeft: 6 }}>⏭</Text>
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
            <Text style={{ fontSize: 44, textAlign: 'center' }}>⚠️</Text>
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

      {/* In-Game Category Switcher Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.catPickerCard}>
            <View style={styles.catPickerHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowCategoryPicker(false)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 20, color: theme.colors.textMuted }}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.catPickerTitle}>اختيار فئة السؤال 🎯</Text>
            </View>

            <Text style={styles.catPickerSubtitle}>
              اختر الفئة اللي حابب تسأل منها فوراً:
            </Text>

            <ScrollView style={styles.catListScroll} showsVerticalScrollIndicator={false}>
              {/* Option: Random / All Categories */}
              <TouchableOpacity
                style={[
                  styles.catOptionItem,
                  chosenCategoryFilter === null && styles.catOptionItemActive,
                ]}
                onPress={() => handleSelectCategoryFromModal(null)}
                activeOpacity={0.8}
              >
                <View style={[styles.catOptionIcon, { backgroundColor: theme.colors.amberGlow }]}>
                  <Text style={{ fontSize: 20 }}>🎲</Text>
                </View>
                <View style={styles.catOptionInfo}>
                  <Text style={styles.catOptionName}>🎲 عشوائي (من كل الفئات)</Text>
                  <Text style={styles.catOptionDesc}>يختار تلقائياً من الفئات المفعلة</Text>
                </View>
                {chosenCategoryFilter === null && (
                  <Text style={{ fontSize: 16, color: theme.colors.gold }}>✓</Text>
                )}
              </TouchableOpacity>

              {/* All categories */}
              {categories.map((cat) => {
                const isSelected = chosenCategoryFilter === cat.id;
                const remaining = categoryCounts[cat.id] ?? 0;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catOptionItem,
                      isSelected && styles.catOptionItemActive,
                    ]}
                    onPress={() => handleSelectCategoryFromModal(cat.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.catOptionIcon,
                        { backgroundColor: cat.color ? `${cat.color}25` : theme.colors.amberGlow },
                      ]}
                    >
                      <Text style={{ fontSize: 20 }}>{getCategoryEmoji(cat.id)}</Text>
                    </View>

                    <View style={styles.catOptionInfo}>
                      <Text style={styles.catOptionName}>{cat.name}</Text>
                      <Text style={styles.catOptionDesc}>
                        {remaining > 0 ? `${remaining} سؤال جاهز` : 'خلصت الأسئلة'}
                      </Text>
                    </View>

                    {isSelected && (
                      <Text style={{ fontSize: 16, color: theme.colors.gold }}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Contestant Cards Overview Modal for Host */}
      <Modal
        visible={showContestantCardsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContestantCardsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cardsOverviewCard}>
            <View style={styles.catPickerHeader}>
              <TouchableOpacity
                onPress={() => setShowContestantCardsModal(false)}
                style={styles.closeBtn}
              >
                <Text style={{ fontSize: 20, color: theme.colors.textMuted }}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.catPickerTitle}>كروت المتسابقين 🃏</Text>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.cardsSectionTitle}>حالة كروت المتسابقين في الجيم:</Text>

              {players.map((p) => {
                const cId = p.usedCardId;
                const pCard = cId ? getPowerCardById(cId) : undefined;
                return (
                  <View key={p.id} style={styles.playerCardRowItem}>
                    <View style={styles.playerCardRowInfo}>
                      <Text style={styles.playerCardRowName}>{p.name}</Text>
                      {pCard ? (
                        <View style={[styles.cardTagSmall, { backgroundColor: `${pCard.color}25`, borderColor: pCard.color }]}>
                          <Text style={{ fontSize: 12, marginRight: 4 }}>{getPowerCardEmoji(pCard.id)}</Text>
                          <Text style={[styles.cardTagSmallText, { color: pCard.color }]}>
                            {pCard.title}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.noCardText}>لم يسحب كارت بعد ⏳</Text>
                      )}
                    </View>

                    {pCard ? (
                      <TouchableOpacity
                        style={[styles.inspectBtn, { backgroundColor: pCard.color }]}
                        onPress={() => {
                          setShowContestantCardsModal(false);
                          handleInspectPlayerCard(p.name, cId!);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 12, marginLeft: 4 }}>👁️</Text>
                        <Text style={styles.inspectBtnText}>فتح الكارت</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.disabledBtnPlaceholder}>
                        <Text style={styles.disabledBtnText}>كارت متاح</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              <View style={styles.cardsDivider} />
              <Text style={styles.cardsSectionTitle}>دليل كروت اللعبة (10 كروت):</Text>
              <Text style={styles.cardsSectionSubtitle}>اضغط على أي كارت لمعاينة تأثيره وشرحه ومثاله العملي</Text>

              <View style={styles.allCardsGrid}>
                {POWER_CARDS.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.miniCardPreview, { borderColor: c.color }]}
                    onPress={() => {
                      setShowContestantCardsModal(false);
                      handleInspectPlayerCard('دليل الكروت', c.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 20, textAlign: 'center' }}>{getPowerCardEmoji(c.id)}</Text>
                    <Text style={[styles.miniCardPreviewTitle, { color: c.color }]} numberOfLines={1}>
                      {c.title}
                    </Text>
                    <Text style={styles.miniCardPreviewSubtitle} numberOfLines={1}>
                      {c.badge}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full-screen 3D Flipping Power Card Modal for Host */}
      <PowerCardModal
        visible={showPowerCardModal}
        cardId={inspectCardData ? inspectCardData.cardId : activeCardEvent?.cardId}
        playerName={inspectCardData ? inspectCardData.playerName : activeCardEvent?.playedBy.name}
        isSelf={false}
        isInspect={!!inspectCardData}
        initialFlipped={!!inspectCardData}
        onDismiss={() => {
          setShowPowerCardModal(false);
          setInspectCardData(null);
        }}
      />
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
  topBarBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarExitBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  topBarExitText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  topBarSoundBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  topBarMutedBtn: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: 'rgba(100, 116, 139, 0.4)',
  },
  topBarSoundText: {
    color: '#F59E0B',
    fontSize: 11.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  topBarTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  topBarLeftArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contestantCardsTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    position: 'relative',
  },
  contestantCardsTopBtnText: {
    color: '#F59E0B',
    fontSize: 11.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  cardsActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    position: 'absolute',
    top: 2,
    right: 2,
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
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
    overflow: 'visible',
  },
  scoreboardContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
    overflow: 'visible',
  },
  scoreCard: {
    width: 126,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceBorder,
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  playerPowerCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 5,
    width: '100%',
  },
  playerPowerCardText: {
    fontSize: 10,
    fontWeight: 'bold',
    maxWidth: 78,
    writingDirection: 'rtl',
  },
  scoreCardLeading: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.surfaceElevated,
    shadowColor: theme.colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  playerCardName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  floatingScoreBadge: {
    position: 'absolute',
    top: -14,
    zIndex: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 12,
  },
  floatingScoreText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
  },
  turnBannerText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  turnBannerPlayerName: {
    color: theme.colors.gold,
    fontWeight: 'bold',
    fontSize: 13,
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
  scoreNegative: {
    color: theme.colors.danger,
    textShadowColor: 'rgba(239, 68, 68, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
  centerSectionScroll: {
    flex: 1,
  },
  centerSectionContent: {
    flexGrow: 1,
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
  chooseCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  chooseCatBtnText: {
    color: theme.colors.gold,
    fontSize: 11,
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
  optionsWrapper: {
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  optionsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  optionsToggleText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  optionsGrid: {
    width: '100%',
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  optionCard: {
    width: '48.8%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    gap: 6,
  },
  optionCardCorrect: {
    borderColor: theme.colors.gold,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  optionLetterBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterBadgeCorrect: {
    backgroundColor: theme.colors.gold,
  },
  optionLetterText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  optionLetterTextCorrect: {
    color: theme.colors.background,
  },
  optionText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  optionTextCorrect: {
    color: theme.colors.gold,
    fontWeight: 'bold',
  },
  correctCheckIcon: {
    marginLeft: 4,
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.OS === 'android' ? 36 : theme.spacing.lg,
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
  catPickerCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.gold,
  },
  catPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  closeBtn: {
    padding: 4,
  },
  catPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.gold,
    writingDirection: 'rtl',
  },
  catPickerSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  catListScroll: {
    maxHeight: 380,
  },
  catOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    gap: 10,
  },
  catOptionItemActive: {
    borderColor: theme.colors.gold,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  catOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catOptionInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  catOptionName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  catOptionDesc: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    writingDirection: 'rtl',
  },
  liveBuzzerBar: {
    marginHorizontal: theme.spacing.md,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.gold,
  },
  liveBuzzerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveRoomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveRoomPillText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '900',
  },
  liveBuzzerHintText: {
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  openBuzzerBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openBuzzerBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  buzzerOpenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockBuzzerSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  lockBuzzerSmallText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  buzzerOpenIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderWidth: 1,
    borderColor: '#4ADE80',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  buzzerOpenIndicatorText: {
    color: '#4ADE80',
    fontSize: 12.5,
    fontWeight: '800',
  },
  buzzerWinnerBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    gap: 10,
  },
  buzzerWinnerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  customMsgContainer: {
    width: '100%',
    position: 'relative',
    marginVertical: 2,
  },
  customMsgInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    paddingLeft: 30,
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  customMsgClearBtn: {
    position: 'absolute',
    left: 8,
    top: 7,
    padding: 2,
  },
  buzzerWinnerText: {
    color: theme.colors.gold,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  buzzerWinnerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  buzzerCorrectBtn: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  buzzerCorrectBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  buzzerWrongReopenBtn: {
    flex: 1.5,
    backgroundColor: theme.colors.danger,
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  buzzerWrongReopenText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  buzzerReopenAllBtn: {
    width: 40,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  // Contestant Cards Overview & Inspector Modal
  cardsOverviewCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  cardsSectionTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardsSectionSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  playerCardRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 6,
  },
  playerCardRowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  playerCardRowName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  cardTagSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardTagSmallText: {
    fontSize: 11,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  noCardText: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
    writingDirection: 'rtl',
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inspectBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  disabledBtnPlaceholder: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  disabledBtnText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  cardsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  allCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  miniCardPreview: {
    width: '48%',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  miniCardPreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  miniCardPreviewSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
});
