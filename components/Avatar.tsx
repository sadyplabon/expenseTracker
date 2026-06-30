import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const COLORS = [
  '#1976D2', '#388E3C', '#7B1FA2', '#E64A19',
  '#00838F', '#5D4037', '#C2185B', '#0288D1',
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  photoUri?: string | null;
  size?: number;
}

export default function Avatar({ name, photoUri, size = 56 }: AvatarProps) {
  const bg = colorForName(name || '?');
  const fontSize = size * 0.38;

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.initials, { fontSize }]}>{initials(name || '?')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: 'bold' },
});
