import AsyncStorage from '@react-native-async-storage/async-storage';
import bundledData from '../data/questions.json';
import { Category, Question } from '../types';

const SEEN_QUESTIONS_KEY = '@casino_games:seen_questions';
const QUESTIONS_CACHE_KEY = '@casino_games:questions_cache';
const CATEGORIES_CACHE_KEY = '@casino_games:categories_cache';

export const questionService = {
  // Load categories (cached or bundled fallback)
  async getCategories(): Promise<Category[]> {
    try {
      const cached = await AsyncStorage.getItem(CATEGORIES_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to read cached categories:', e);
    }
    return bundledData.categories as Category[];
  },

  // Load all questions (cached or bundled fallback)
  async getAllQuestions(): Promise<Question[]> {
    try {
      const cached = await AsyncStorage.getItem(QUESTIONS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to read cached questions:', e);
    }
    return bundledData.questions as Question[];
  },

  // Get set of seen question IDs
  async getSeenQuestionIds(): Promise<string[]> {
    try {
      const seen = await AsyncStorage.getItem(SEEN_QUESTIONS_KEY);
      return seen ? JSON.parse(seen) : [];
    } catch {
      return [];
    }
  },

  // Mark a question as seen
  async markQuestionAsSeen(questionId: string): Promise<void> {
    try {
      const currentSeen = await this.getSeenQuestionIds();
      if (!currentSeen.includes(questionId)) {
        currentSeen.push(questionId);
        await AsyncStorage.setItem(SEEN_QUESTIONS_KEY, JSON.stringify(currentSeen));
      }
    } catch (e) {
      console.error('Failed to mark question as seen', e);
    }
  },

  // Reset seen questions for specific categories or all
  async resetSeenQuestions(categoryIds?: string[]): Promise<void> {
    try {
      if (!categoryIds || categoryIds.length === 0) {
        await AsyncStorage.removeItem(SEEN_QUESTIONS_KEY);
        return;
      }

      const allQuestions = await this.getAllQuestions();
      const currentSeen = await this.getSeenQuestionIds();
      
      const categoryQuestionIds = new Set(
        allQuestions
          .filter((q) => categoryIds.includes(q.categoryId))
          .map((q) => q.id)
      );

      // Keep only seen IDs that do NOT belong to the specified categories
      const updatedSeen = currentSeen.filter((id) => !categoryQuestionIds.has(id));
      await AsyncStorage.setItem(SEEN_QUESTIONS_KEY, JSON.stringify(updatedSeen));
    } catch (e) {
      console.error('Failed to reset seen questions', e);
    }
  },

  // Count remaining unseen questions per category
  async getRemainingCountsByCategory(): Promise<Record<string, number>> {
    const allQuestions = await this.getAllQuestions();
    const seenIds = new Set(await this.getSeenQuestionIds());

    const counts: Record<string, number> = {};
    for (const q of allQuestions) {
      if (!counts[q.categoryId]) {
        counts[q.categoryId] = 0;
      }
      if (!seenIds.has(q.id)) {
        counts[q.categoryId] += 1;
      }
    }
    return counts;
  },

  // Get eligible shuffled questions for selected categories
  async getGameQuestions(selectedCategoryIds: string[]): Promise<Question[]> {
    const allQuestions = await this.getAllQuestions();
    const seenIds = new Set(await this.getSeenQuestionIds());

    const eligible = allQuestions.filter(
      (q) => selectedCategoryIds.includes(q.categoryId) && !seenIds.has(q.id)
    );

    // Fisher-Yates shuffle
    const shuffled = [...eligible];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  },

  // Placeholder for future backend API sync
  async syncQuestionsFromApi(apiUrl: string): Promise<boolean> {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      if (data.categories && data.questions) {
        await AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(data.categories));
        await AsyncStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(data.questions));
        return true;
      }
      return false;
    } catch (e) {
      console.warn('syncQuestionsFromApi error:', e);
      return false;
    }
  },
};
