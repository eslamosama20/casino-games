export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type QuestionMediaType = 'image_blur' | 'audio_clip';

export interface RoomMediaState {
  type: QuestionMediaType;
  url: string;
  title?: string;
  revealDuration: number; // Duration in seconds (default 10)
  startedAt: number;     // Timestamp when blur/timer began
  frozenAt?: number | null; // Timestamp when buzzed (freezes blur)
  revealed?: boolean;    // When correct answer is revealed
  buzzedSecond?: number | null; // Exact second number (1-10) when player buzzed
  pointsValue?: number | null;  // 3, 2, or 1 based on speed
}

export interface Question {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  difficulty?: DifficultyLevel; // سهل، متوسط، صعب
  hint?: string;               // تلميح اختياري للـ Host
  options?: string[];          // اختيارات متعددة مساعدة للمتسابقين
  mediaType?: QuestionMediaType;
  mediaUrl?: string;
  mediaTitle?: string;
  revealDuration?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  connected?: boolean;
  usedCardId?: string;
}

export type GameMode = 'individuals' | 'teams';

export type ScreenType =
  | 'setup'
  | 'categories'
  | 'game'
  | 'winner'
  | 'buzzer_lobby'
  | 'buzzer_player';

export type BuzzerState = 'locked' | 'open' | 'buzzed';

export interface LiveBuzzerRoom {
  code: string;
  targetScore: number;
  status: 'lobby' | 'playing' | 'finished';
  players: Player[];
  buzzerState: BuzzerState;
  buzzedBy: {
    playerId: string;
    name: string;
    timestamp: number;
  } | null;
  lockedOutPlayerIds: string[];
  currentOptions: string[] | null;
  winner: Player | null;
  lastScoreEvent?: {
    playerId: string;
    delta: number;
    newScore: number;
    timestamp: number;
    customMessage?: string | null;
  } | null;
  seenQuestionIds?: string[];
  usedCardPlayerIds?: Record<string, string>;
  usedCardIds?: Record<string, boolean>;
  activeCardEvent?: ActiveCardEvent | null;
  currentMedia?: RoomMediaState | null;
}

export interface PowerCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  example: string;
  icon: string;
  color: string;
  badge: string;
}

export interface ActiveCardEvent {
  cardId: string;
  playedBy: {
    id: string;
    name: string;
  };
  timestamp: number;
}

export interface GameSettings {
  mode: GameMode;
  targetScore: number;
  players: Player[];
  selectedCategoryIds: string[];
  selectedDifficulty?: DifficultyLevel | 'all';
}
