/**
 * Universal Emoji Mappings for Categories, Power Cards, and UI Icons
 * Completely eliminates broken font squares `[]` on web and mobile browsers.
 */

export const CATEGORY_EMOJIS: Record<string, string> = {
  football: '⚽',
  movies: '🎬',
  general: '💡',
  riddles: '🧠',
  music_proverbs: '🎵',
  reversed_words: '🔄',
  emoji_movies: '🎭',
  challenges: '⚡',
  description_guess: '🕵️',
  history: '🏛️',
  geography: '🌍',
  egyptian_singers: '🎤',
  image_blur: '🔍',
  audio_mystery: '🎧',
};

export const POWER_CARD_EMOJIS: Record<string, string> = {
  double_down: '🎯',
  sniper_penalty: '💣',
  immunity_shield: '🛡️',
  category_boss: '👑',
  robin_hood: '🦹‍♂️',
  freeze_rival: '❄️',
  skip_question: '🔄',
  duel_1v1: '⚔️',
  fifty_fifty: '✂️',
  wild_joker: '🎰',
};

export function getCategoryEmoji(categoryId?: string | null): string {
  if (!categoryId) return '🎲';
  return CATEGORY_EMOJIS[categoryId] || '❓';
}

export function getPowerCardEmoji(cardId?: string | null): string {
  if (!cardId) return '🃏';
  return POWER_CARD_EMOJIS[cardId] || '🃏';
}
