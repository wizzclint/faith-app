import React from "react";
import { Canvas, Fill, Group, Rect } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import { colors } from "../../design/colors";
import {
  COIN_POOL_SIZE,
  OBSTACLE_POOL_SIZE,
  PARTICLE_POOL_SIZE,
  POWER_UP_POOL_SIZE,
} from "../../game/constants";
import { RunnerEngine } from "../../game/engine/useRunnerEngine";
import { CoinSprite } from "./CoinSprite";
import { ObstacleSprite } from "./ObstacleSprite";
import { ParallaxBackground } from "./ParallaxBackground";
import { ParticleSprite } from "./ParticleSprite";
import { PlayerSprite } from "./PlayerSprite";
import { PowerUpSprite } from "./PowerUpSprite";

interface GameCanvasProps {
  engine: RunnerEngine;
  width: number;
  height: number;
  laneX: number[];
  topY: number;
  groundY: number;
}

const OBSTACLE_INDICES = Array.from({ length: OBSTACLE_POOL_SIZE }, (_, i) => i);
const COIN_INDICES = Array.from({ length: COIN_POOL_SIZE }, (_, i) => i);
const POWER_UP_INDICES = Array.from({ length: POWER_UP_POOL_SIZE }, (_, i) => i);
const PARTICLE_INDICES = Array.from({ length: PARTICLE_POOL_SIZE }, (_, i) => i);

export function GameCanvas({ engine, width, height, laneX, topY, groundY }: GameCanvasProps) {
  const shakeTransform = useDerivedValue(() => [
    { translateX: engine.shakeX.value },
    { translateY: engine.shakeY.value },
  ]);

  return (
    <Canvas style={{ width, height }}>
      <Fill color={colors.background} />

      <ParallaxBackground distance={engine.distance} width={width} topY={topY} groundY={groundY} />

      {/* ground line anchors the lane row */}
      <Rect x={0} y={groundY} width={width} height={2} color={colors.border} />

      {/* faint lane dividers */}
      {[1, 2].map((i) => (
        <Rect
          key={i}
          x={(width / 3) * i}
          y={topY}
          width={1}
          height={groundY - topY}
          color={colors.border}
        />
      ))}

      {/* Everything that should punch with a crash shake lives in this group. */}
      <Group transform={shakeTransform}>
        {OBSTACLE_INDICES.map((i) => (
          <ObstacleSprite
            key={i}
            index={i}
            obstacles={engine.obstacles}
            distance={engine.distance}
            laneX={laneX}
            topY={topY}
            groundY={groundY}
          />
        ))}

        {COIN_INDICES.map((i) => (
          <CoinSprite
            key={i}
            index={i}
            coins={engine.coins}
            distance={engine.distance}
            laneX={laneX}
            topY={topY}
          />
        ))}

        {POWER_UP_INDICES.map((i) => (
          <PowerUpSprite
            key={i}
            index={i}
            powerUps={engine.powerUpSlots}
            distance={engine.distance}
            laneX={laneX}
            topY={topY}
          />
        ))}

        {PARTICLE_INDICES.map((i) => (
          <ParticleSprite key={i} index={i} particles={engine.particles} />
        ))}

        <PlayerSprite
          playerX={engine.playerX}
          jumpOffset={engine.jumpOffset}
          slideProgress={engine.slideProgress}
          groundY={groundY}
        />
      </Group>
    </Canvas>
  );
}
