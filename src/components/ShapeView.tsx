import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShapeType } from '../game/types';

interface Props {
  shape: ShapeType;
  color: string;
  size: number;
}

export default function ShapeView({ shape, color, size }: Props) {
  if (shape === 'circle') {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    );
  }

  if (shape === 'square') {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.14,
          backgroundColor: color,
        }}
      />
    );
  }

  if (shape === 'diamond') {
    const inner = size * 0.72;
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: inner,
            height: inner,
            borderRadius: size * 0.1,
            backgroundColor: color,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    );
  }

  // triangle
  return (
    <View
      style={[
        styles.triangle,
        {
          borderLeftWidth: size / 2,
          borderRightWidth: size / 2,
          borderBottomWidth: size * 0.87,
          borderBottomColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
