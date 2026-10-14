import React from "react";
import { Text, TextStyle } from "react-native";
import { formatCountdown } from "../../services/competition/format";
import { useSecondClock } from "../../services/competition/hooks";

interface CountdownProps {
  /** ISO time being counted down to. */
  to: string;
  prefix?: string;
  suffix?: string;
  style?: TextStyle | TextStyle[];
}

/** A live "9:42" that re-renders only itself each second. */
export function Countdown({ to, prefix = "", suffix = "", style }: CountdownProps) {
  const now = useSecondClock();
  const remaining = new Date(to).getTime() - now;
  return (
    <Text style={style}>
      {prefix}
      {formatCountdown(remaining).toUpperCase()}
      {suffix}
    </Text>
  );
}
