import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Category } from '../types';
import { questionService } from '../services/questionService';

interface CategoryScreenProps {
  onBack: () => void;
  onStartGame: (selectedCategoryIds: string[]) => void;
}

export const CategoryScreen: React.FC<CategoryScreenProps> = ({
  onBack,
  onStartGame,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [remainingCounts, setRemainingCounts] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await questionService.getCategories();
      const counts = await questionService.getRemainingCountsByCategory();
      setCategories(cats);
      setRemainingCounts(counts);
      // Select all by default
      setSelectedIds(cats.map((c) => c.id));
    } catch (e) {
      console.error(e);
      Alert.alert('خطأ', 'فشل تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleCategory = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === categories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(categories.map((c) => c.id));
    }
  };

  const isAllSelected = categories.length > 0 && selectedIds.length === categories.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-right" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>اختيار الفئات</Text>
        <TouchableOpacity
          style={styles.selectAllBtn}
          onPress={handleToggleSelectAll}
          activeOpacity={0.7}
        >
          <Text style={styles.selectAllText}>
            {isAllSelected ? 'إلغاء الكل' : 'تحديد الكل'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
          <Text style={styles.loadingText}>جاري تجهيز الأسئلة والفئات...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subTitle}>
            اختر الفئات اللي حابب تسأل منها في الجيم ده:
          </Text>

          <View style={styles.grid}>
            {categories.map((cat) => {
              const isSelected = selectedIds.includes(cat.id);
              const remaining = remainingCounts[cat.id] ?? 0;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                  onPress={() => toggleCategory(cat.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: cat.color ? `${cat.color}25` : theme.colors.amberGlow },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={(cat.icon as any) || 'help-circle-outline'}
                        size={28}
                        color={cat.color || theme.colors.gold}
                      />
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxActive,
                      ]}
                    >
                      {isSelected && (
                        <MaterialCommunityIcons name="check" size={16} color={theme.colors.background} />
                      )}
                    </View>
                  </View>

                  <Text style={styles.categoryName}>{cat.name}</Text>

                  <View style={styles.badge}>
                    <MaterialCommunityIcons
                      name="file-question-outline"
                      size={13}
                      color={remaining > 0 ? theme.colors.gold : theme.colors.danger}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        remaining === 0 && styles.badgeTextEmpty,
                      ]}
                    >
                      {remaining > 0 ? `متبقي ${remaining} سؤال` : 'خلصت الأسئلة'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            selectedIds.length === 0 && styles.primaryBtnDisabled,
          ]}
          disabled={selectedIds.length === 0}
          onPress={() => onStartGame(selectedIds)}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.primaryBtnText,
              selectedIds.length === 0 && styles.primaryBtnTextDisabled,
            ]}
          >
            ابدأ اللعب ({selectedIds.length} فئات مختارة)
          </Text>
          <MaterialCommunityIcons
            name="play-circle-outline"
            size={24}
            color={selectedIds.length === 0 ? theme.colors.textMuted : theme.colors.background}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  selectAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  selectAllText: {
    color: theme.colors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 110,
  },
  subTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.surfaceBorder,
    alignItems: 'flex-end',
  },
  cardSelected: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.surfaceElevated,
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'right',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  badgeText: {
    color: theme.colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextEmpty: {
    color: theme.colors.danger,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
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
  primaryBtnDisabled: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  primaryBtnText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryBtnTextDisabled: {
    color: theme.colors.textMuted,
  },
});
