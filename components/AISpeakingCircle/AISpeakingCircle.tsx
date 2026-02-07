import { Colors } from '@/utils/palette';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  amplitude: number;
  isSpeaking: boolean;
}

const GLOW_LAYERS = [
  { scale: 1.15, opacity: 0.25, size: 100 },
  { scale: 1.25, opacity: 0.12, size: 120 },
  { scale: 1.35, opacity: 0.06, size: 140 },
];

const CIRCLE_BASE_SIZE = Dimensions.get('window').width * 0.15;

const AISpeakingCircle: React.FC<Props> = ({ amplitude, isSpeaking }) => {
  const scale = useSharedValue(1);

  // SPEAKING → audio driven
  useEffect(() => {
    if (!isSpeaking) return;

    // cancelAnimation(scale);

    scale.value = withTiming(1 + amplitude * 0.4, {
      duration: 80,
      easing: Easing.inOut(Easing.ease),
    });
  }, [amplitude, isSpeaking]);

  // IDLE → soft breathing loop
  useEffect(() => {
    if (isSpeaking) {
      // cancelAnimation(scale);
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, [isSpeaking]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = (multiplier: number) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: scale.value * multiplier }],
      opacity: isSpeaking
        ? 0.15 + amplitude * 0.25
        : 0.12 + (scale.value - 1) * 2,
    }));

  return (
    <View style={styles.container}>
      {GLOW_LAYERS.map((layer, index) => (
        <Animated.View
          key={index}
          style={[
            styles.glow,
            glowStyle(layer.scale),
            {
              opacity: layer.opacity,
              width: layer.size,
              height: layer.size,
              borderRadius: layer.size / 2,
            },
          ]}
        />
      ))}

      <Animated.View style={[styles.circle, coreStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: -20,
  },
  glow: {
    position: 'absolute',
    backgroundColor: Colors.primary,
  },
  circle: {
    width: CIRCLE_BASE_SIZE,
    height: CIRCLE_BASE_SIZE,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default AISpeakingCircle;
