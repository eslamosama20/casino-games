import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, I18nManager } from 'react-native';
import { theme } from './src/constants/theme';
import { GameMode, Player, ScreenType } from './src/types';
import { SetupScreen } from './src/screens/SetupScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { GameScreen } from './src/screens/GameScreen';
import { WinnerScreen } from './src/screens/WinnerScreen';

// Ensure RTL layout support at app initialization
try {
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  }
} catch (e) {
  // Ignore in web preview if not supported
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('setup');
  const [mode, setMode] = useState<GameMode>('individuals');
  const [targetScore, setTargetScore] = useState<number>(10);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);

  // Transition from Setup to Category selection
  const handleSetupComplete = (settings: {
    mode: GameMode;
    targetScore: number;
    players: Player[];
  }) => {
    setMode(settings.mode);
    setTargetScore(settings.targetScore);
    setPlayers(settings.players);
    setCurrentScreen('categories');
  };

  // Start game with selected categories
  const handleStartGame = (categoryIds: string[]) => {
    setSelectedCategoryIds(categoryIds);
    // Reset all scores to 0
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    setCurrentScreen('game');
  };

  // When a player hits target score
  const handlePlayerWon = (winningPlayer: Player, finalPlayers: Player[]) => {
    setWinner(winningPlayer);
    setPlayers(finalPlayers);
    setCurrentScreen('winner');
  };

  // Play again with same players (resets score, goes to category selection)
  const handleNewGameSamePlayers = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    setCurrentScreen('categories');
  };

  // Change players (back to setup)
  const handleChangePlayers = () => {
    setCurrentScreen('setup');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {currentScreen === 'setup' && (
        <SetupScreen onNext={handleSetupComplete} />
      )}
      {currentScreen === 'categories' && (
        <CategoryScreen
          onBack={() => setCurrentScreen('setup')}
          onStartGame={handleStartGame}
        />
      )}
      {currentScreen === 'game' && (
        <GameScreen
          players={players}
          targetScore={targetScore}
          selectedCategoryIds={selectedCategoryIds}
          onPlayerWon={handlePlayerWon}
          onQuitGame={() => setCurrentScreen('setup')}
        />
      )}
      {currentScreen === 'winner' && winner && (
        <WinnerScreen
          winner={winner}
          allPlayers={players}
          targetScore={targetScore}
          onNewGameSamePlayers={handleNewGameSamePlayers}
          onChangePlayers={handleChangePlayers}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
