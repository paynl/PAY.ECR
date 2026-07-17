import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';


interface SegmentControlProps {
  segments: string[];
  selectedIndex?: number;
  onChange?: (index: number) => void;
  animated?: boolean;
  activeBackgroundColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  style?: ViewStyle;
  segmentStyle?: ViewStyle;
  textStyle?: TextStyle;
  selectedTextStyle?: TextStyle;
}

export const SegmentControl = ({
  segments,
  selectedIndex = 0,
  onChange,
  animated = true,
  style,
  segmentStyle,
  textStyle,
  selectedTextStyle,
  activeBackgroundColor = '#585FFF',
  activeTextColor = '#FFFFFF',
  inactiveTextColor = '#8E8E93',
}: SegmentControlProps) => {
  const [selected, setSelected] = useState(selectedIndex);

  // Self-contained animated values - no stale closure issues
  const selectedAnim = useRef(new Animated.Value(selectedIndex)).current;
  const widthAnim = useRef(new Animated.Value(0)).current;

  const handleSelect = useCallback(
    (index: number) => {
      if (index === selected) return;

      if (animated) {
        Animated.spring(selectedAnim, {
          toValue: index,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      }

      setSelected(index);

      if (LayoutAnimation.configureNext) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }

      onChange?.(index);
    },
    [selected, onChange, animated, selectedAnim],
  );

  const handleLayout = (e: any) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) {
      widthAnim.setValue(width);
    }
  };

  // Interpolated position and width from animated values
  const sliderLeft = selectedAnim.interpolate({
    inputRange: segments.map((_, i) => i),
    outputRange: segments.map((_, i) => i),
  });

  const containerWidth = widthAnim;

  const sliderTranslateX = animated
    ? Animated.divide(
        Animated.multiply(containerWidth, sliderLeft),
        new Animated.Value(segments.length),
      )
    : (selected / segments.length) * 100; // percentage for static

  return (
    <View style={[styles.outerWrapper, style]}>
      <View style={styles.container}>
        {/* Animated Slider */}
        {animated ? (
          <Animated.View
            style={[
              styles.slider,
              {
                backgroundColor: activeBackgroundColor,
                transform: [{ translateX: sliderTranslateX }],
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.staticSlider,
              {
                left: `${(selected / segments.length) * 100}%`,
                width: `${100 / segments.length}%`,
                backgroundColor: activeBackgroundColor,
              },
            ]}
          />
        )}

        {/* Segments */}
        <View style={styles.segmentsContainer} onLayout={handleLayout}>
          {segments.map((segment, index) => {
            const isSelected = selected === index;

            return (
              <TouchableOpacity
                key={index}
                style={styles.segment}
                onPress={() => handleSelect(index)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentText,
                    textStyle,
                    isSelected && styles.selectedText,
                    { color: isSelected ? activeTextColor : inactiveTextColor },
                    isSelected && selectedTextStyle,
                  ]}
                >
                  {segment}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    paddingHorizontal: 20,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  slider: {
    position: 'absolute',
    top: 2,
    left: 2,
    bottom: 2,
    borderRadius: 8,
    width: '31%', // Will be computed - 2px padding / 3 segments approx
  },
  staticSlider: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: 8,
  },
  segmentsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    fontWeight: '700',
  },
});
