import React from "react";
import { Canvas, Fill, Group, Image, Rect, useImage } from "@shopify/react-native-skia";
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
import { FloorGrid } from "./FloorGrid";
import { ObstacleSprite } from "./ObstacleSprite";
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

const LANE_LINE = "rgba(64,251,201,0.45)";
const GROUND_LINE = "rgba(64,251,201,0.7)";

export function GameCanvas({ engine, width, height, laneX, topY, groundY }: GameCanvasProps) {
  // Skyline, lane glows and floor haze are baked into this image (see
  // art-source/tools/make-ui-assets.js); it's laid out for a road starting at
  // 14% of the height with lanes split in thirds, matching GameScreen.
  const backdrop = useImage(require("../../../assets/ui/game-bg.png"));

  const shakeTransform = useDerivedValue(() => [
    { translateX: engine.shakeX.value },
    { translateY: engine.shakeY.value },
  ]);

  return (
    <Canvas style={{ width, height }}>
      <Fill color={colors.background} />
      {backdrop && <Image image={backdrop} x={0} y={0} width={width} height={height} fit="fill" />}

      <FloorGrid distance={engine.distance} width={width} height={height} topY={topY} />

      {/* Crisp cores for the lane dividers; their glow is in the backdrop. */}
      {[1, 2].map((i) => (
        <Rect
          key={i}
          x={(width / 3) * i - 0.75}
          y={topY}
          width={1.5}
          height={height - topY}
          color={LANE_LINE}
        />
      ))}

      {/* ground line anchors the lane row */}
      <Rect x={0} y={groundY} width={width} height={2} color={GROUND_LINE} />

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
