import React from 'react';
import Svg, { Circle, Path, Rect, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 64 }: LogoProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s / 2;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1565C0" />
          <Stop offset="100%" stopColor="#42A5F5" />
        </LinearGradient>
      </Defs>

      {/* Background circle */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#grad)" />

      {/* Wallet body */}
      <Rect
        x={s * 0.18}
        y={s * 0.3}
        width={s * 0.58}
        height={s * 0.38}
        rx={s * 0.07}
        fill="white"
        opacity={0.95}
      />

      {/* Wallet flap */}
      <Rect
        x={s * 0.18}
        y={s * 0.22}
        width={s * 0.42}
        height={s * 0.14}
        rx={s * 0.05}
        fill="white"
        opacity={0.7}
      />

      {/* Coin slot */}
      <Circle
        cx={s * 0.64}
        cy={s * 0.49}
        r={s * 0.1}
        fill="#1976D2"
        opacity={0.85}
      />

      {/* ৳ symbol in coin */}
      <SvgText
        x={s * 0.64}
        y={s * 0.535}
        textAnchor="middle"
        fill="white"
        fontSize={s * 0.13}
        fontWeight="bold"
      >
        ৳
      </SvgText>
    </Svg>
  );
}
