import AsyncStorage from '@react-native-async-storage/async-storage';
import bundledData from '../data/questions.json';
import { Category, Question } from '../types';
import { config } from '../constants/config';

const SEEN_QUESTIONS_KEY = '@casino_games:seen_questions';
const QUESTIONS_CACHE_KEY = '@casino_games:questions_cache';
const CATEGORIES_CACHE_KEY = '@casino_games:categories_cache';
const DATASET_VERSION_KEY = '@casino_games:dataset_version';

export interface SyncResult {
  success: boolean;
  message: string;
  isOnline: boolean;
  updated: boolean;
  version: number;
}

export const questionService = {
  // Get cached version
  async getDatasetVersion(): Promise<number> {
    try {
      const v = await AsyncStorage.getItem(DATASET_VERSION_KEY);
      return v ? parseInt(v, 10) : bundledData.version || 1;
    } catch {
      return bundledData.version || 1;
    }
  },

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

  // Synchronize questions from API with timeout
  async syncQuestionsFromApi(): Promise<SyncResult> {
    const cachedVersion = await this.getDatasetVersion();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.API_TIMEOUT_MS);

    try {
      const url = `${config.API_BASE_URL}/api/sync?version=${cachedVersion}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          message: 'فشل الاتصال بالخادم',
          isOnline: false,
          updated: false,
          version: cachedVersion,
        };
      }

      const data = await response.json();

      if (data.upToDate) {
        return {
          success: true,
          message: 'الأسئلة محدثة لآخر إصدار',
          isOnline: true,
          updated: false,
          version: cachedVersion,
        };
      }

      // We have new questions & categories to cache
      if (data.categories && data.questions) {
        await AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(data.categories));
        await AsyncStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(data.questions));
        await AsyncStorage.setItem(DATASET_VERSION_KEY, String(data.version || cachedVersion + 1));

        return {
          success: true,
          message: 'تم تحديث الأسئلة بنجاح ✓',
          isOnline: true,
          updated: true,
          version: data.version,
        };
      }

      return {
        success: false,
        message: 'استجابة غير صالحة',
        isOnline: true,
        updated: false,
        version: cachedVersion,
      };
    } catch (e) {
      clearTimeout(timeoutId);
      return {
        success: false,
        message: 'وضع أوفلاين',
        isOnline: false,
        updated: false,
        version: cachedVersion,
      };
    }
  },
};
