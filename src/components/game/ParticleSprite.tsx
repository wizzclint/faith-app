import React from "react";
import { Circle } from "@shopify/react-native-skia";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { colors } from "../../design/colors";
import { ParticleSlot } from "../../game/types";

interface ParticleSpriteProps {
  particles: SharedValue<ParticleSlot[]>;
  index: number;
}

const PARTICLE_COLORS = [colors.textSecondary, colors.accentSecondary, colors.accent];
const PARTICLE_MAX_RADIUS = 5;

/**
 * One pooled particle. Fades and shrinks over its lifetime; world position is
 * computed directly in the worklet loop (it doesn't scroll with `distance`
 * like obstacles/coins — once emitted, a particle just flies on its own).
 */
export function ParticleSprite({ particles, index }: ParticleSpriteProps) {
  const cx = useDerivedValue(() => particles.value[index].x);
  const cy = useDerivedValue(() => particles.value[index].y);
  const opacity = useDerivedValue(() => {
    const p = particles.value[index];
    return p.active === 1 ? Math.max(0, p.life / p.maxLife) : 0;
  });
  const r = useDerivedValue(() => {
    const p = particles.value[index];
    return p.active === 1 ? PARTICLE_MAX_RADIUS * Math.max(0.2, p.life / p.maxLife) : 0;
  });
  // Color can't be reactive per-instance without extra shape layers (see
  // ObstacleSprite) — a fixed color per pool slot is a fine placeholder look.
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];

  return <Circle cx={cx} cy={cy} r={r} color={color} opacity={opacity} />;
}
