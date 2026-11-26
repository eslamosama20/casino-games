export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  difficulty?: DifficultyLevel; // سهل، متوسط، صعب
  hint?: string;               // تلميح اختياري للـ Host
  options?: string[];          // اختيارات متعددة مساعدة للمتسابقين
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
}

export interface GameSettings {
  mode: GameMode;
  targetScore: number;
  players: Player[];
  selectedCategoryIds: string[];
  selectedDifficulty?: DifficultyLevel | 'all';
}
