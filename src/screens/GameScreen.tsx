import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { GameCanvas } from "../components/game/GameCanvas";
import { GameHUD } from "../components/game/GameHUD";
import { GameOverOverlay } from "../components/game/GameOverOverlay";
import { PauseOverlay } from "../components/game/PauseOverlay";
import { colors } from "../design/colors";
import { soundManager } from "../game/audio/soundManager";
import { LANE_COUNT, SWIPE_THRESHOLD_PX } from "../game/constants";
import { useRunnerEngine } from "../game/engine/useRunnerEngine";
import { api, ApiError } from "../services/api/client";
import { runLabel } from "../services/competition/format";
import { useAuthStore } from "../store/authStore";
import { useGameStore } from "../store/gameStore";
import { useProfileStore } from "../store/profileStore";

const SUBMIT_ATTEMPTS = 3;
const SUBMIT_RETRY_MS = 2000;
const SUBMIT_TIMEOUT_MS = 15_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Gives up on a request that hangs, so a dead connection becomes a retry rather than a frozen screen. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

interface RunResult {
  score: number;
  coins: number;
  elapsedSec: number;
}

/** Where a competition run's score is on its way to the server. */
type Submission = "idle" | "sending" | "done" | "failed";

export function GameScreen() {
  const navigation = useNavigation();
  /** Set when the run is one of the player's attempts in a competition. */
  const competition = useRoute<RouteProp<ReactNavigation.RootParamList, "Game">>().params;
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
  const resetToIdle = useGameStore((s) => s.resetToIdle);
  const loadBestScore = useGameStore((s) => s.loadBestScore);
  const [paused, setPaused] = useState(false);
  /** A competition run waits here until the server has issued its session. */
  const [starting, setStarting] = useState(!!competition);
  /** How a competition run was recorded, shown on the Run Complete card. */
  const [resultNote, setResultNote] = useState<string | null>(null);
  /** Which of the player's competition runs this is. */
  const [runInfo, setRunInfo] = useState<{ attempt: number; attemptsAllowed: number } | null>(null);
  const [submission, setSubmission] = useState<Submission>("idle");
  /** Whether the player has another run to play after this one. */
  const [moreRuns, setMoreRuns] = useState(false);

  /** Server session for the current run. `null` when signed out or (free run only) if creating it failed. */
  const backendSessionId = useRef<string | null>(null);
  /** A finished competition run that hasn't reached the server yet, kept so it can be sent again. */
  const unsentRun = useRef<{ sessionId: string; run: RunResult } | null>(null);

  const attemptsPerPlayer = competition?.attemptsPerPlayer ?? 3;
  const thisRunLabel = runInfo ? runLabel(runInfo.attempt, attemptsPerPlayer) : "RUN";

  /**
   * Free run: the session is best-effort and never delays the start — a run
   * without one simply isn't submitted.
   * Competition run: the session is what makes the run count, and issuing it
   * spends one of the player's attempts, so the run only begins once the
   * server has issued it.
   */
  const startAttempt = async () => {
    backendSessionId.current = null;
    unsentRun.current = null;
    setResultNote(null);
    setPaused(false);
    setSubmission("idle");
    setMoreRuns(false);

    if (!competition) {
      startRun();
      engine.start();
      if (useAuthStore.getState().status !== "authenticated") return;
      api
        .createSession()
        .then(({ sessionId }) => {
          backendSessionId.current = sessionId;
        })
        .catch(() => {
          // Server unreachable — local play continues regardless.
        });
      return;
    }

    resetToIdle();
    setStarting(true);
    try {
      const run = await api.createCompetitionSession(competition.competitionId);
      backendSessionId.current = run.sessionId;
      setRunInfo({ attempt: run.attempt, attemptsAllowed: run.attemptsAllowed });
      setStarting(false);
      startRun();
      engine.start();
    } catch (err) {
      Alert.alert(
        "Can't start this run",
        err instanceof ApiError ? err.message : "Can't reach the FAITH servers right now.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  };

  /**
   * Sends a competition run, retrying so one dropped request doesn't lose the
   * score. Until this settles the player is held on the result card: starting
   * the next run forfeits any run the server hasn't heard back from.
   */
  const submitCompetitionRun = async (sessionId: string, run: RunResult, label: string, allowed: number) => {
    unsentRun.current = { sessionId, run };
    setSubmission("sending");
    setResultNote("SENDING YOUR SCORE…");

    for (let attempt = 0; attempt < SUBMIT_ATTEMPTS; attempt += 1) {
      try {
        const result = await withTimeout(api.submitRun(sessionId, run), SUBMIT_TIMEOUT_MS);
        const recorded = result.competition;
        if (recorded?.counted) {
          setResultNote(`${label} COUNTED · YOUR TOTAL ${recorded.totalScore.toLocaleString()}`);
        } else if (result.accepted) {
          setResultNote("NOT COUNTED · TIME HAD ALREADY RUN OUT");
        } else {
          setResultNote(`${label} COULDN'T BE VERIFIED · IT SCORES 0`);
        }
        // Time running out is the one case where there is nothing left to play.
        setMoreRuns(!!recorded && (recorded.counted || !result.accepted) && recorded.attempt < allowed);
        unsentRun.current = null;
        setSubmission("done");
        return;
      } catch (err) {
        // A reply from the server is final; only retry when nothing came back.
        if (err instanceof ApiError && err.status < 500) {
          // "Already used" means an earlier try did land, even though its reply never arrived.
          setResultNote(
            /already used/i.test(err.message)
              ? `${label} RECORDED · CHECK THE SCOREBOARD`
              : `NOT COUNTED · ${err.message.toUpperCase()}`
          );
          unsentRun.current = null;
          setSubmission("done");
          return;
        }
        if (attempt < SUBMIT_ATTEMPTS - 1) await sleep(SUBMIT_RETRY_MS);
      }
    }
    setResultNote("NOT SENT YET · CHECK YOUR CONNECTION");
    setSubmission("failed");
  };

  const retrySubmit = () => {
    const pending = unsentRun.current;
    if (pending && runInfo) {
      submitCompetitionRun(pending.sessionId, pending.run, thisRunLabel, runInfo.attemptsAllowed);
    }
  };

  useEffect(() => {
    loadBestScore();
  }, [loadBestScore]);

  useEffect(() => {
    startAttempt();
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

      const sessionId = backendSessionId.current;
      if (sessionId && competition) {
        submitCompetitionRun(
          sessionId,
          { score, coins, elapsedSec },
          thisRunLabel,
          runInfo?.attemptsAllowed ?? attemptsPerPlayer
        );
      } else if (sessionId) {
        api.submitRun(sessionId, { score, coins, elapsedSec }).catch(() => {
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

  /** Leaving the result card. An unsent competition score would be lost, so that needs a yes. */
  const handleHome = () => {
    if (competition && submission === "failed") {
      Alert.alert(
        "Leave without sending?",
        "This run's score hasn't reached the server. If you leave now it will count as 0.",
        [
          { text: "Stay", style: "cancel" },
          { text: "Leave", style: "destructive", onPress: () => navigation.goBack() },
        ]
      );
      return;
    }
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

  const handleSettingsFromPause = () => {
    navigation.navigate("Settings");
  };

  /**
   * A free run is simply abandoned. A competition run has already used its
   * attempt, so leaving it ends it there and sends the score reached so far.
   */
  const handleExitFromPause = () => {
    if (!competition) {
      setPaused(false);
      navigation.goBack();
      return;
    }
    const { score, coins, elapsedSec } = useGameStore.getState();
    Alert.alert(
      "End this run now?",
      `Your score so far, ${score.toLocaleString()}, will be sent as this run's score. A run can't be replayed.`,
      [
        { text: "Keep playing", style: "cancel" },
        {
          text: "End run",
          style: "destructive",
          onPress: () => {
            setPaused(false);
            useGameStore.getState().endRun(score, coins, elapsedSec);
          },
        },
      ]
    );
  };

  // Hardware back pauses an in-progress run instead of immediately leaving it,
  // and can't skip past a competition score that is still being sent.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (status === "playing" && !paused) {
        handlePause();
        return true;
      }
      if (!competition) return false;
      if (starting || submission === "sending") return true;
      if (status === "playing" && paused) {
        handleExitFromPause();
        return true;
      }
      if (status === "gameOver" && submission === "failed") {
        handleHome();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paused, starting, submission]);

  const nextAttempt = (runInfo?.attempt ?? 0) + 1;
  const playAgain = !competition
    ? { onPress: startAttempt, label: "PLAY AGAIN", icon: "restart" as const }
    : submission === "failed"
      ? { onPress: retrySubmit, label: "SEND AGAIN", icon: "refresh" as const }
      : submission === "done" && moreRuns
        ? {
            onPress: startAttempt,
            label:
              nextAttempt > attemptsPerPlayer
                ? "START SUDDEN-DEATH RUN"
                : `START RUN ${nextAttempt} OF ${attemptsPerPlayer}`,
            icon: "play" as const,
          }
        : null;

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
        {competition && runInfo && status === "playing" && (
          <View style={styles.runPill} pointerEvents="none">
            <Text style={styles.runPillText}>
              {runInfo.attempt > attemptsPerPlayer
                ? thisRunLabel
                : `${thisRunLabel} OF ${attemptsPerPlayer}`}
            </Text>
          </View>
        )}
        {starting && (
          <View style={styles.starting}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.startingText}>GETTING YOUR RUN READY…</Text>
            {competition && <Text style={styles.startingName}>{competition.competitionName}</Text>}
          </View>
        )}
        {paused && status === "playing" && (
          <PauseOverlay
            onResume={handleResume}
            onRestart={competition ? undefined : startAttempt}
            onSettings={handleSettingsFromPause}
            onExit={handleExitFromPause}
            exitLabel={competition ? "END RUN" : "EXIT"}
            note={competition ? `${thisRunLabel} · THE CLOCK KEEPS RUNNING` : undefined}
          />
        )}
        {status === "gameOver" && !starting && (
          <GameOverOverlay
            onPlayAgain={playAgain?.onPress}
            playAgainLabel={playAgain?.label}
            playAgainIcon={playAgain?.icon}
            onHome={handleHome}
            note={resultNote ?? undefined}
            homeLabel={competition ? "BACK" : "HOME"}
            homeDisabled={!!competition && submission === "sending"}
          />
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
  // Sits in the empty floor below the runner, clear of the HUD and the lanes.
  runPill: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    backgroundColor: "rgba(3,22,27,0.85)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  runPillText: {
    color: colors.accentBright,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  starting: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,8,11,0.8)",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  startingText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  startingName: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
