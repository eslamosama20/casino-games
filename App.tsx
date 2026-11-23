import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  I18nManager,
  Platform,
  ImageBackground,
  View,
  Image,
  Text,
  Animated,
} from 'react-native';
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

const BG_STAGE = require('./assets/bg-stage.jpg');
const BG_NEON = require('./assets/bg-neon.jpg');
const BG_SPLASH = require('./assets/bg-splash.jpg');
const APP_LOGO = require('./assets/icon.png');

// Safe RTL configuration
try {
  if (Platform.OS !== 'web') {
    I18nManager.allowRTL(true);
  }
} catch (e) {
  // Ignore
}

export default function App() {
  const [showIntroSplash, setShowIntroSplash] = useState<boolean>(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;

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

  // Smooth Casino Intro Splash animation (replaces any plain white launch flash)
  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 5,
      tension: 65,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }).start(() => setShowIntroSplash(false));
    }, 1250);

    return () => clearTimeout(timer);
  }, [logoScale, splashOpacity]);

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

  const activeBg =
    currentScreen === 'game' ||
    currentScreen === 'buzzer_player' ||
    currentScreen === 'buzzer_lobby'
      ? BG_SPLASH
      : BG_NEON;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ImageBackground source={activeBg} style={styles.bgImage} resizeMode="cover">
          <View style={styles.bgOverlayLight}>
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
          </View>

          {/* Animated Casino Launch Splash Screen */}
          {showIntroSplash && (
            <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]}>
              <ImageBackground source={BG_SPLASH} style={styles.splashBg} resizeMode="cover">
                <View style={styles.splashDim}>
                  <Animated.View
                    style={[styles.splashLogoWrap, { transform: [{ scale: logoScale }] }]}
                  >
                    <Image source={APP_LOGO} style={styles.splashLogo} />
                    <Text style={styles.splashTitle}>كازينو الألعاب</Text>
                    <Text style={styles.splashSubtitle}>استعد للتحدي والسرعة ⚡</Text>
                  </Animated.View>
                </View>
              </ImageBackground>
            </Animated.View>
          )}
        </ImageBackground>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bgOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 24, 0.56)',
  },
  bgOverlayLight: {
    backgroundColor: 'rgba(8, 11, 24, 0.30)',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  splashBg: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  splashDim: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 24, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoWrap: {
    alignItems: 'center',
    gap: 14,
  },
  splashLogo: {
    width: 146,
    height: 146,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: theme.colors.gold,
  },
  splashTitle: {
    color: theme.colors.gold,
    fontSize: 32,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  splashSubtitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.92,
  },
});
