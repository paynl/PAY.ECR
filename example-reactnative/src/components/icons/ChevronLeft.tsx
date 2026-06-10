import React from 'react';
import { View, StyleSheet } from 'react-native';

const ChevronLeft = ({ size = 24, color = '#000', strokeWidth = 2 }) => {
  const armLength = size * 0.7;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <View
        style={{
          position: 'absolute',
          width: armLength,
          height: strokeWidth,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
          left: size * 0.15,
          top: size * 0.3,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: armLength,
          height: strokeWidth,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
          left: size * 0.15,
          top: size * 0.7,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChevronLeft;
