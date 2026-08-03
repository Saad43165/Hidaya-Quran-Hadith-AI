import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

// ─── Reusable decorative Islamic geometric pattern (drawn with plain Views) ───
export function IslamicPattern({
  accentColor,
  size = 320,
  style,
}: {
  accentColor: string;
  size?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  const baseColor = accentColor + '12';
  const midColor  = accentColor + '1E';

  const ringOuter  = size * (300 / 320);
  const ringMid    = size * (240 / 320);
  const ringInner  = size * (180 / 320);
  const lineWidth  = size * (300 / 320);
  const diamondOff = size * (110 / 320);
  const diamondSz  = size * (20 / 320);
  const octSz      = size * (80 / 320);

  return (
    <View
      style={[geo.wrap, { width: size, height: size }, style]}
      pointerEvents="none"
    >
      {/* Outer ring */}
      <View style={[geo.ring, { width: ringOuter, height: ringOuter, borderColor: baseColor }]} />
      <View style={[geo.ring, { width: ringMid, height: ringMid, borderColor: midColor }]} />
      <View style={[geo.ring, { width: ringInner, height: ringInner, borderColor: baseColor }]} />
      {/* Diagonal cross lines */}
      <View style={[geo.line, { width: lineWidth, backgroundColor: baseColor }]} />
      <View style={[geo.line, { width: lineWidth, backgroundColor: baseColor, transform: [{ rotate: '90deg' }] }]} />
      <View style={[geo.line, { width: lineWidth, backgroundColor: baseColor, transform: [{ rotate: '45deg' }] }]} />
      <View style={[geo.line, { width: lineWidth, backgroundColor: baseColor, transform: [{ rotate: '-45deg' }] }]} />
      {/* Corner diamonds */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => (
        <View
          key={i}
          style={[
            geo.diamond,
            {
              width: diamondSz,
              height: diamondSz,
              borderColor: midColor,
              transform: [
                { translateX: dx * diamondOff },
                { translateY: dy * diamondOff },
                { rotate: '45deg' },
              ],
            },
          ]}
        />
      ))}
      {/* Center octagon */}
      <View style={[geo.oct, { width: octSz, height: octSz, borderColor: accentColor + '28' }]} />
    </View>
  );
}

const geo = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { position: 'absolute', borderWidth: 1, borderRadius: 999 },
  line: { position: 'absolute', height: 1 },
  diamond: { position: 'absolute', borderWidth: 1 },
  oct: { position: 'absolute', borderWidth: 1.5, borderRadius: 8, transform: [{ rotate: '22.5deg' }] },
});
