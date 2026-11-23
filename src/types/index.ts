export interface Question {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // MaterialCommunityIcons or Ionicons name
  color: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export type GameMode = 'individuals' | 'teams';

export type ScreenType = 'setup' | 'categories' | 'game' | 'winner';

export interface GameSettings {
  mode: GameMode;
  targetScore: number;
  players: Player[];
  selectedCategoryIds: string[];
}
