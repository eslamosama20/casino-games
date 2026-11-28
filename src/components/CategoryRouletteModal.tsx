import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { Category } from '../types';
import { getCategoryEmoji } from '../constants/emojis';

interface RouletteModalProps {
  visible: boolean;
  categories: Category[];
  onSelectCategory: (category: Category) => void;
  onClose: () => void;
}

export const CategoryRouletteModal: React.FC<RouletteModalProps> = ({
  visible,
  categories,
  onSelectCategory,
  onClose,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Always reset previous result when reopening modal
  useEffect(() => {
    if (visible) {
      setSelectedCat(null);
      setSpinning(false);
      spinValue.setValue(0);
    }
  }, [visible, spinValue]);

  const startSpin = () => {
    if (spinning || categories.length === 0) return;
    setSpinning(true);
    setSelectedCat(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    spinValue.setValue(0);
    const randomRounds = Math.floor(Math.random() * 5) + 6; // 6 to 10 full spins
    const randomIndex = Math.floor(Math.random() * categories.length);
    const targetDeg = randomRounds * 360 + (randomIndex * (360 / categories.length));

    Animated.timing(spinValue, {
      toValue: targetDeg,
      duration: 3200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      const winner = categories[randomIndex];
      setSelectedCat(winner);
      setSpinning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  const spinInterpolation = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={spinning}>
            <Text style={{ fontSize: 20, color: theme.colors.textMuted }}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>عجلة الحظ للفئات 🎡</Text>
          <Text style={styles.subtitle}>سيب الحظ يختارلك الفئة اللي هتتسألوا فيها!</Text>

          {/* Animated Wheel representation */}
          <View style={styles.wheelContainer}>
            {/* Pointer */}
            <View style={styles.pointer}>
              <Text style={{ fontSize: 28, textAlign: 'center', color: theme.colors.gold }}>▼</Text>
            </View>

            <Animated.View
              style={[
                styles.wheel,
                { transform: [{ rotate: spinInterpolation }] },
              ]}
            >
              {categories.slice(0, 12).map((cat, idx, arr) => {
                const angleDeg = (360 / arr.length) * idx;
                const rad = (angleDeg * Math.PI) / 180;
                const radius = 56;
                const x = Math.sin(rad) * radius;
                const y = -Math.cos(rad) * radius;
                return (
                  <View
                    key={cat.id}
                    style={{
                      position: 'absolute',
                      transform: [{ translateX: x }, { translateY: y }],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{getCategoryEmoji(cat.id)}</Text>
                  </View>
                );
              })}
              <View style={styles.wheelInner}>
                <Text style={{ fontSize: 22, textAlign: 'center' }}>🎡</Text>
              </View>
            </Animated.View>
          </View>

          {/* Result announcement */}
          {selectedCat && (
            <View style={styles.resultBadge}>
              <Text style={styles.resultLabel}>الفئة المختارة:</Text>
              <Text style={styles.resultName}>{selectedCat.name}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            {selectedCat ? (
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  onSelectCategory(selectedCat);
                  onClose();
                }}
              >
                <Text style={styles.confirmBtnText}>العب بالفئة دي الآن 🎯</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.spinBtn, spinning && styles.spinBtnDisabled]}
                onPress={startSpin}
                disabled={spinning}
              >
                <Text style={styles.spinBtnText}>
                  {spinning ? 'جاري اللف...' : 'لِف العجلة! 🎲'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.gold,
  },
  closeBtn: {
    alignSelf: 'flex-start',
    padding: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.gold,
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  pointer: {
    position: 'absolute',
    top: -26,
    zIndex: 10,
  },
  wheel: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 5,
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  wheelInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.surfaceBorder,
  },
  resultBadge: {
    backgroundColor: theme.colors.amberGlow,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  resultLabel: {
    color: theme.colors.goldLight,
    fontSize: 12,
    writingDirection: 'rtl',
  },
  resultName: {
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
    writingDirection: 'rtl',
  },
  actionsRow: {
    width: '100%',
    marginTop: 10,
  },
  spinBtn: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  spinBtnDisabled: {
    opacity: 0.6,
  },
  spinBtnText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: theme.colors.success,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
