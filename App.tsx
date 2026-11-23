import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, I18nManager, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { theme } from './src/constants/theme';
import { GameMode, LiveBuzzerRoom, Player, ScreenType } from './src/types';
import { SetupScreen } from './src/screens/SetupScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { GameScreen } from './src/screens/GameScreen';
import { WinnerScreen } from './src/screens/WinnerScreen';
import { BuzzerLobbyScreen } from './src/screens/BuzzerLobbyScreen';
import { BuzzerPlayerScreen } from './src/screens/BuzzerPlayerScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { buzzerService } from './src/services/buzzerService';

// Safe RTL configuration
try {
  if (Platform.OS !== 'web') {
    I18nManager.allowRTL(true);
  }
} catch (e) {
  // Ignore
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('setup');
  const [mode, setMode] = useState<GameMode>('individuals');
  const [targetScore, setTargetScore] = useState<number>(10);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);

  // Live Buzzer Room state
  const [liveRoom, setLiveRoom] = useState<LiveBuzzerRoom | null>(null);
  const [livePlayerId, setLivePlayerId] = useState<string | null>(null);
  const [livePlayerName, setLivePlayerName] = useState<string>('');

  // Transition from Setup to Category selection (standard offline mode)
  const handleSetupComplete = (settings: {
    mode: GameMode;
    targetScore: number;
    players: Player[];
  }) => {
    setLiveRoom(null);
    setMode(settings.mode);
    setTargetScore(settings.targetScore);
    setPlayers(settings.players);
    setCurrentScreen('categories');
  };

  // Host finished waiting in Buzzer Lobby -> pick categories
  const handleHostProceedToCategories = (room: LiveBuzzerRoom) => {
    setLiveRoom(room);
    setTargetScore(room.targetScore);
    setPlayers(room.players.map((p) => ({ ...p, score: 0 })));
    setCurrentScreen('categories');
  };

  // Contestant joined a Live Buzzer Room
  const handlePlayerJoined = (room: LiveBuzzerRoom, playerId: string, playerName: string) => {
    setLiveRoom(room);
    setLivePlayerId(playerId);
    setLivePlayerName(playerName);
    setCurrentScreen('buzzer_player');
  };

  // Start game with selected categories
  const handleStartGame = (categoryIds: string[]) => {
    setSelectedCategoryIds(categoryIds);
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    if (liveRoom) {
      buzzerService.startGame(liveRoom.code, targetScore);
    }
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

  // Change players (back to setup & close any hosted room)
  const handleChangePlayers = () => {
    if (liveRoom) {
      buzzerService.closeRoom(liveRoom.code);
      setLiveRoom(null);
    }
    setCurrentScreen('setup');
  };

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar style="light" />
          {currentScreen === 'setup' && (
            <SetupScreen
              onNext={handleSetupComplete}
              onOpenBuzzerLobby={() => setCurrentScreen('buzzer_lobby')}
            />
          )}
          {currentScreen === 'buzzer_lobby' && (
            <BuzzerLobbyScreen
              onBack={() => setCurrentScreen('setup')}
              onHostProceedToCategories={handleHostProceedToCategories}
              onPlayerJoined={handlePlayerJoined}
            />
          )}
          {currentScreen === 'buzzer_player' && liveRoom && livePlayerId && (
            <BuzzerPlayerScreen
              initialRoom={liveRoom}
              playerId={livePlayerId}
              playerName={livePlayerName}
              onExit={() => {
                setLiveRoom(null);
                setLivePlayerId(null);
                setCurrentScreen('setup');
              }}
            />
          )}
          {currentScreen === 'categories' && (
            <CategoryScreen
              onBack={() => setCurrentScreen(liveRoom ? 'buzzer_lobby' : 'setup')}
              onStartGame={handleStartGame}
            />
          )}
          {currentScreen === 'game' && (
            <GameScreen
              players={players}
              targetScore={targetScore}
              selectedCategoryIds={selectedCategoryIds}
              liveRoomCode={liveRoom?.code}
              onPlayerWon={handlePlayerWon}
              onQuitGame={handleChangePlayers}
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
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
