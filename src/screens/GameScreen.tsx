import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { GameCanvas } from "../components/game/GameCanvas";
import { GameHUD } from "../components/game/GameHUD";
import { GameOverOverlay } from "../components/game/GameOverOverlay";
import { PauseOverlay } from "../components/game/PauseOverlay";
import { colors } from "../design/colors";
import { soundManager } from "../game/audio/soundManager";
import { LANE_COUNT, SWIPE_THRESHOLD_PX } from "../game/constants";
import { useRunnerEngine } from "../game/engine/useRunnerEngine";
import { api } from "../services/api/client";
import { useAuthStore } from "../store/authStore";
import { useGameStore } from "../store/gameStore";
import { useProfileStore } from "../store/profileStore";

export function GameScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const topY = height * 0.14;
  const groundY = height * 0.74;
  const laneX = useMemo(
    () => Array.from({ length: LANE_COUNT }, (_, i) => (width / LANE_COUNT) * (i + 0.5)),
    [width]
  );

  const engine = useRunnerEngine({ laneX, topY, groundY });
  const status = useGameStore((s) => s.status);
  const startRun = useGameStore((s) => s.startRun);
  const loadBestScore = useGameStore((s) => s.loadBestScore);
  const [paused, setPaused] = useState(false);

  /**
   * Real backend session, best-effort. `null` while unauthenticated, still
   * creating, or if creation failed — submission at game-over is skipped in
   * that case. Never blocks or delays the actual run starting.
   */
  const backendSessionId = useRef<string | null>(null);

  const startBackendSession = () => {
    backendSessionId.current = null;
    if (useAuthStore.getState().status !== "authenticated") return;
    api
      .createSession()
      .then(({ sessionId }) => {
        backendSessionId.current = sessionId;
      })
      .catch(() => {
        // No backend reachable, or not deployed yet — local play continues regardless.
      });
  };

  useEffect(() => {
    loadBestScore();
  }, [loadBestScore]);

  useEffect(() => {
    startRun();
    engine.start();
    startBackendSession();
    return () => engine.stop();
    // Mount-only: restarts are triggered explicitly via "Play Again".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "gameOver") {
      engine.stop();
      soundManager.playGameOver();
      const { score, coins, combo, elapsedSec } = useGameStore.getState();
      useProfileStore.getState().awardRunResult({ score, coins, combo, elapsedSec });

      if (backendSessionId.current) {
        api.submitRun(backendSessionId.current, { score, coins, elapsedSec }).catch(() => {
          // Best-effort — the local run result and progression already stand regardless.
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const swipe = useMemo(() => {
    const { moveLane } = engine;
    return Gesture.Pan()
      .enabled(!paused)
      .onEnd((e) => {
        "worklet";
        const absX = Math.abs(e.translationX);
        const absY = Math.abs(e.translationY);
        if (Math.max(absX, absY) < SWIPE_THRESHOLD_PX) return;

        if (absX > absY) {
          if (e.translationX > 0) moveLane.right();
          else moveLane.left();
        } else {
          if (e.translationY < 0) moveLane.jump();
          else moveLane.slide();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.moveLane, paused]);

  const handlePlayAgain = () => {
    setPaused(false);
    startRun();
    engine.start();
    startBackendSession();
  };

  const handleHome = () => {
    navigation.goBack();
  };

  const handlePause = () => {
    if (status !== "playing") return;
    engine.stop();
    setPaused(true);
  };

  const handleResume = () => {
    setPaused(false);
    engine.resume();
  };

  const handleRestartFromPause = () => {
    handlePlayAgain();
  };

  const handleSettingsFromPause = () => {
    navigation.navigate("Settings");
  };

  const handleExitFromPause = () => {
    setPaused(false);
    navigation.goBack();
  };

  // Hardware back pauses an in-progress run instead of immediately leaving it.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (status === "playing" && !paused) {
        handlePause();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paused]);

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.container}>
        <GameCanvas
          engine={engine}
          width={width}
          height={height}
          laneX={laneX}
          topY={topY}
          groundY={groundY}
        />
        <GameHUD onPause={handlePause} />
        {paused && status === "playing" && (
          <PauseOverlay
            onResume={handleResume}
            onRestart={handleRestartFromPause}
            onSettings={handleSettingsFromPause}
            onExit={handleExitFromPause}
          />
        )}
        {status === "gameOver" && (
          <GameOverOverlay onPlayAgain={handlePlayAgain} onHome={handleHome} />
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
