import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InfoIcon = ({ size = 24, color = '#000', borderWidth = 2 }) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          borderWidth,
        },
      ]}
    >
      <Text
        style={{
          color,
          fontSize: size * 0.65,
          fontWeight: '600',
          lineHeight: size,
        }}
      >
        i
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InfoIcon;
