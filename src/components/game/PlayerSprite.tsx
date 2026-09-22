import { Image } from "@shopify/react-native-skia";
import React, { useEffect, useState } from "react";
import {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
} from "react-native-reanimated";
import { useGameStore } from "../../store/gameStore";
import {
  PLAYER_FRAME_COUNT,
  useDeadFrame,
  useJumpFrames,
  useRunFrames,
  useSlideFrames,
} from "./playerSpriteFrames";

const DISPLAY_HEIGHT = 78;

type Phase = "run" | "jump" | "slide" | "dead";

/** How long each frame is held, per phase (ms) — jump/slide are tuned close to the engine's own timings. */
const FRAME_DURATION_MS: Record<Phase, number> = {
  run: 80,
  jump: 52,
  slide: 48,
  dead: 1000,
};

interface PlayerSpriteProps {
  playerX: SharedValue<number>;
  jumpOffset: SharedValue<number>;
  slideProgress: SharedValue<number>;
  groundY: number;
}

/**
 * Real animated sprite (placeholder character art — see ATTRIBUTION.md),
 * swapped in for what was a plain Skia circle. Position/jump-arc still come
 * straight from the worklet-driven shared values for smooth 60fps motion;
 * only *which frame* is displayed is plain React state updated at ~12-20fps,
 * which is all a sprite-flip animation needs.
 */
export function PlayerSprite({
  playerX,
  jumpOffset,
  slideProgress,
  groundY,
}: PlayerSpriteProps) {
  const runFrames = useRunFrames();
  const jumpFrames = useJumpFrames();
  const slideFrames = useSlideFrames();
  const deadFrame = useDeadFrame();
  const status = useGameStore((s) => s.status);

  const [phase, setPhase] = useState<Phase>("run");
  const [frameIndex, setFrameIndex] = useState(0);

  useAnimatedReaction(
    () => {
      "worklet";
      if (jumpOffset.value > 0) return "jump";
      if (slideProgress.value > 0.05) return "slide";
      return "run";
    },
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setPhase)(current as Phase);
      }
    },
    [jumpOffset, slideProgress]
  );

  const effectivePhase: Phase = status === "gameOver" ? "dead" : phase;

  useEffect(() => {
    setFrameIndex(0);
    if (effectivePhase === "dead") return;

    const duration = FRAME_DURATION_MS[effectivePhase];
    const loop = effectivePhase === "run";

    const id = setInterval(() => {
      setFrameIndex((prev) => {
        const next = prev + 1;
        if (next >= PLAYER_FRAME_COUNT) {
          if (loop) return 0;
          clearInterval(id);
          return prev;
        }
        return next;
      });
    }, duration);

    return () => clearInterval(id);
  }, [effectivePhase]);

  const image =
    effectivePhase === "dead"
      ? deadFrame
      : effectivePhase === "jump"
        ? jumpFrames[frameIndex]
        : effectivePhase === "slide"
          ? slideFrames[frameIndex]
          : runFrames[frameIndex];

  const naturalWidth = image?.width() ?? DISPLAY_HEIGHT;
  const naturalHeight = image?.height() ?? DISPLAY_HEIGHT;
  const displayWidth = naturalWidth * (DISPLAY_HEIGHT / naturalHeight);

  const x = useDerivedValue(() => playerX.value - displayWidth / 2, [displayWidth]);
  const y = useDerivedValue(() => groundY - DISPLAY_HEIGHT - jumpOffset.value, [groundY]);

  if (!image) return null;

  return (
    <Image image={image} x={x} y={y} width={displayWidth} height={DISPLAY_HEIGHT} fit="contain" />
  );
}
