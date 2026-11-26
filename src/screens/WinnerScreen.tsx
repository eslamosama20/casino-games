import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { Player } from '../types';
import { ConfettiEffect } from '../components/ConfettiEffect';
import { soundManager } from '../services/soundService';

interface WinnerScreenProps {
  winner: Player;
  allPlayers: Player[];
  targetScore: number;
  onNewGameSamePlayers: () => void;
  onChangePlayers: () => void;
}

export const WinnerScreen: React.FC<WinnerScreenProps> = ({
  winner,
  allPlayers,
  targetScore,
  onNewGameSamePlayers,
  onChangePlayers,
}) => {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    soundManager.playWinner();
  }, []);

  // Sort leaderboard descending
  const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      {/* Celebratory animated confetti */}
      <ConfettiEffect />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy & Celebration Badge */}
        <View style={styles.trophyContainer}>
          <View style={styles.trophyCircle}>
            <Text style={{ fontSize: 60, textAlign: 'center' }}>🏆</Text>
          </View>
          <Text style={styles.congratsText}>ألف مبروك الفوز!</Text>
          <Text style={styles.winnerName}>{winner.name}</Text>
          <View style={styles.scorePill}>
            <Text style={styles.scorePillText}>
              وصل لـ {winner.score} نقطة (الهدف: {targetScore})
            </Text>
          </View>
        </View>

        {/* Leaderboard Table */}
        <View style={styles.leaderboardCard}>
          <View style={styles.leaderboardHeader}>
            <Text style={{ fontSize: 20, marginRight: 6 }}>🥇</Text>
            <Text style={styles.leaderboardTitle}>لوحة شرف المنافسين</Text>
          </View>

          {sortedPlayers.map((player, index) => {
            const isWinner = player.id === winner.id;
            return (
              <View
                key={player.id}
                style={[
                  styles.leaderboardRow,
                  isWinner && styles.leaderboardRowWinner,
                ]}
              >
                <View style={styles.rankContainer}>
                  {index === 0 ? (
                    <Text style={{ fontSize: 18 }}>👑</Text>
                  ) : (
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  )}
                </View>

                <Text style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </Text>

                <View style={styles.scoreContainer}>
                  <Text style={styles.playerScore}>{player.score}</Text>
                  <Text style={styles.scoreLabel}>نقاط</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action Buttons */}
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
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onNewGameSamePlayers}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 18, marginRight: 6 }}>🔄</Text>
          <Text style={styles.primaryBtnText}>جيم جديد بنفس الأسماء</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onChangePlayers}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18, marginRight: 6 }}>⚙️</Text>
          <Text style={styles.secondaryBtnText}>تغيير اللاعبين</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: 24,
    alignItems: 'center',
  },
  trophyContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.amberGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gold,
    marginBottom: theme.spacing.md,
  },
  congratsText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  winnerName: {
    color: theme.colors.gold,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    writingDirection: 'rtl',
  },
  scorePill: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  scorePillText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  leaderboardCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
    paddingBottom: 10,
    justifyContent: 'center',
  },
  leaderboardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  leaderboardRowWinner: {
    borderColor: theme.colors.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  playerName: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    marginHorizontal: 10,
    writingDirection: 'rtl',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  playerScore: {
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    writingDirection: 'rtl',
  },
  footer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    gap: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  secondaryBtn: {
    backgroundColor: theme.colors.surfaceElevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  secondaryBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
});
