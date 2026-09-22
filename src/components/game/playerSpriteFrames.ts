import { useImage } from "@shopify/react-native-skia";

/**
 * Metro/Expo needs static `require()` calls to bundle images — the paths
 * can't be built dynamically from a loop. This is the one file that knows
 * about the real asset paths; PlayerSprite.tsx just consumes SkImage arrays.
 * See assets/sprites/player/ATTRIBUTION.md for where these came from.
 */

// eslint-disable-next-line react-hooks/rules-of-hooks
export function useRunFrames() {
  return [
    useImage(require("../../../assets/sprites/player/run/frame_00.png")),
    useImage(require("../../../assets/sprites/player/run/frame_01.png")),
    useImage(require("../../../assets/sprites/player/run/frame_02.png")),
    useImage(require("../../../assets/sprites/player/run/frame_03.png")),
    useImage(require("../../../assets/sprites/player/run/frame_04.png")),
    useImage(require("../../../assets/sprites/player/run/frame_05.png")),
    useImage(require("../../../assets/sprites/player/run/frame_06.png")),
    useImage(require("../../../assets/sprites/player/run/frame_07.png")),
    useImage(require("../../../assets/sprites/player/run/frame_08.png")),
    useImage(require("../../../assets/sprites/player/run/frame_09.png")),
  ];
}

export function useJumpFrames() {
  return [
    useImage(require("../../../assets/sprites/player/jump/frame_00.png")),
    useImage(require("../../../assets/sprites/player/jump/frame_01.png")),
    useImage(require("../../../assets/sprites/player/jump/frame_02.png")),
    useImage(require("../../../assets/sprites/player/jump/frame_03.png")),
    useImage(require("../../../assets/sprites/player/jump/frame_04.png")),
    useImage(require("../../../assets/sprites/player/jump/frame_05.png")),
    useImage(require("../../../assets/sprites/player/jump/frame_06.png")),
    useImage(require("../../../assets/sprites/player/jump/frame_07.png")),
    useImage(require("../../../assets/sprites/player/jump/frame_08.png")),
    useImage(require("../../../assets/sprites/player/jump/frame_09.png")),
  ];
}

export function useSlideFrames() {
  return [
    useImage(require("../../../assets/sprites/player/slide/frame_00.png")),
    useImage(require("../../../assets/sprites/player/slide/frame_01.png")),
    useImage(require("../../../assets/sprites/player/slide/frame_02.png")),
    useImage(require("../../../assets/sprites/player/slide/frame_03.png")),
    useImage(require("../../../assets/sprites/player/slide/frame_04.png")),
    useImage(require("../../../assets/sprites/player/slide/frame_05.png")),
    useImage(require("../../../assets/sprites/player/slide/frame_06.png")),
    useImage(require("../../../assets/sprites/player/slide/frame_07.png")),
    useImage(require("../../../assets/sprites/player/slide/frame_08.png")),
    useImage(require("../../../assets/sprites/player/slide/frame_09.png")),
  ];
}

export function useDeadFrame() {
  return useImage(require("../../../assets/sprites/player/dead/frame_00.png"));
}

export const PLAYER_FRAME_COUNT = 10;
