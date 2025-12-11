import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
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
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Reset animation values to ensure clean start
    dot1.setValue(0);
    dot2.setValue(0);
    dot3.setValue(0);

    if (!visible) {
      return;
    }

    const createBounceAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
    };

    animationRef.current = Animated.parallel([
      createBounceAnimation(dot1, 0),
      createBounceAnimation(dot2, 150),
      createBounceAnimation(dot3, 300),
    ]);

    animationRef.current.start();

    return () => {
      animationRef.current?.stop();
      // Reset values on cleanup
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    };
  }, [visible, dot1, dot2, dot3]);

  if (!visible) return null;

  const dotStyle = {
    backgroundColor: theme.colors.onSurfaceVariant,
  };

  // Bounce height of -6 pixels (upward)
  const BOUNCE_HEIGHT = -6;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}
      testID="typing-indicator"
    >
      <Animated.View
        testID="typing-dot"
        style={[
          styles.dot,
          dotStyle,
          {
            transform: [
              {
                translateY: dot1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, BOUNCE_HEIGHT],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        testID="typing-dot"
        style={[
          styles.dot,
          dotStyle,
          {
            transform: [
              {
                translateY: dot2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, BOUNCE_HEIGHT],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        testID="typing-dot"
        style={[
          styles.dot,
          dotStyle,
          {
            transform: [
              {
                translateY: dot3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, BOUNCE_HEIGHT],
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
