import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from 'react-native-paper';
import { spacing } from '@/theme';

interface TypingIndicatorProps {
  visible?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ visible = true }) => {
  const theme = useTheme();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(600),
          ])
        ),
      ]);
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [visible, dot1, dot2, dot3]);

  if (!visible) return null;

  const dotStyle = {
    backgroundColor: theme.colors.onSurfaceVariant,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Animated.View
        style={[
          styles.dot,
          dotStyle,
          {
            opacity: dot1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: dot1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          dotStyle,
          {
            opacity: dot2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: dot2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          dotStyle,
          {
            opacity: dot3.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: dot3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
