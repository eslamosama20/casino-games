import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COLORS = ['#FFD700', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#8B5CF6', '#FFFFFF'];
const PARTICLE_COUNT = 36;

export const ConfettiEffect: React.FC = () => {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }).map(() => ({
      animY: new Animated.Value(0),
      animX: new Animated.Value(0),
      animRotate: new Animated.Value(0),
      animScale: new Animated.Value(1),
      startX: Math.random() * SCREEN_WIDTH,
      driftX: (Math.random() - 0.5) * 120,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.floor(Math.random() * 8) + 6,
      duration: Math.floor(Math.random() * 1800) + 2200,
      delay: Math.floor(Math.random() * 800),
      isCircle: Math.random() > 0.5,
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((p) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.animY, {
              toValue: SCREEN_HEIGHT + 40,
              duration: p.duration,
              useNativeDriver: true,
            }),
            Animated.timing(p.animX, {
              toValue: p.driftX,
              duration: p.duration,
              useNativeDriver: true,
            }),
            Animated.timing(p.animRotate, {
              toValue: 1,
              duration: p.duration,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    });

    Animated.stagger(60, animations).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, idx) => {
        const spin = p.animRotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={idx}
            style={[
              styles.particle,
              {
                left: p.startX,
                width: p.size,
                height: p.isCircle ? p.size : p.size * 1.5,
                borderRadius: p.isCircle ? p.size / 2 : 2,
                backgroundColor: p.color,
                transform: [
                  { translateY: p.animY },
                  { translateX: p.animX },
                  { rotate: spin },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: -20,
  },
});
