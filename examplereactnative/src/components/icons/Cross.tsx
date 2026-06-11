import React from 'react';
import { View } from 'react-native';

const RedCrossIcon = ({ size = 64, color = '#FF0000', strokeWidth = 2 }) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: size * 0.75,
          height: strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.75,
          height: strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
};

export default RedCrossIcon;
