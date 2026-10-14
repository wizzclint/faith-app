import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TextStyle, View } from "react-native";
import { colors } from "../../design/colors";
import { shortAddress } from "../../services/competition/format";

const GRID = 5;

/** FNV-1a: a small, stable hash so the same wallet always gets the same avatar. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

interface PlayerAvatarProps {
  pubkey: string;
  size?: number;
  /** The house gets its own unmistakable mark instead of a generated pattern. */
  isHouse?: boolean;
}

/**
 * There are no profiles yet, so each wallet gets a generated avatar: a
 * mirrored 5x5 pattern and a color, both derived from the address.
 */
export function PlayerAvatar({ pubkey, size = 40, isHouse = false }: PlayerAvatarProps) {
  const { cells, ink, ground } = useMemo(() => {
    const seed = hash(pubkey);
    const hue = seed % 360;
    const filled: boolean[] = [];
    for (let row = 0; row < GRID; row += 1) {
      for (let column = 0; column < GRID; column += 1) {
        // Columns 3 and 4 mirror 1 and 0, which is what makes it read as a face.
        const mirrored = column < 3 ? column : GRID - 1 - column;
        filled.push(((seed >>> (row * 3 + mirrored)) & 1) === 1);
      }
    }
    return { cells: filled, ink: `hsl(${hue}, 78%, 62%)`, ground: `hsl(${hue}, 42%, 13%)` };
  }, [pubkey]);

  const radius = Math.round(size * 0.28);

  if (isHouse) {
    return (
      <View style={[styles.avatar, styles.houseAvatar, { width: size, height: size, borderRadius: radius }]}>
        <MaterialCommunityIcon name="robot" size={Math.round(size * 0.6)} color={colors.warning} />
      </View>
    );
  }

  // Whole pixels, and a grid exactly five cells wide: a fractional cell can
  // round up and push the fifth cell of each row onto the next line.
  const cell = Math.max(2, Math.floor((size * 0.68) / GRID));

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: radius, backgroundColor: ground },
      ]}
    >
      <View style={[styles.grid, { width: cell * GRID, height: cell * GRID }]}>
        {cells.map((on, index) => (
          <View
            key={index}
            style={{ width: cell, height: cell, backgroundColor: on ? ink : "transparent" }}
          />
        ))}
      </View>
    </View>
  );
}

/** Marks FAITH's own automated opponent. Shown wherever the house appears, never optional. */
export function HouseBadge() {
  return (
    <View style={styles.houseBadge}>
      <Text style={styles.houseBadgeText}>HOUSE</Text>
    </View>
  );
}

interface PlayerNameProps {
  pubkey: string;
  isMe?: boolean;
  isHouse?: boolean;
  style?: TextStyle;
}

/** A short wallet address, with YOU or the HOUSE badge alongside. */
export function PlayerName({ pubkey, isMe = false, isHouse = false, style }: PlayerNameProps) {
  return (
    <View style={styles.nameRow}>
      <Text style={[styles.name, style]} numberOfLines={1}>
        {isHouse ? "FAITH" : shortAddress(pubkey)}
      </Text>
      {isHouse && <HouseBadge />}
      {isMe && <Text style={styles.you}>YOU</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  houseAvatar: {
    backgroundColor: "#2B2006",
    borderWidth: 1,
    borderColor: colors.warning,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  houseBadge: {
    backgroundColor: "#2B2006",
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  houseBadgeText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  you: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});
