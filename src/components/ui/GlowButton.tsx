import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Image, ImageBackground, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../../design/colors";
import { soundManager } from "../../game/audio/soundManager";

type IconName = React.ComponentProps<typeof MaterialCommunityIcon>["name"];

interface GlowButtonProps {
  label: string;
  onPress: () => void;
  /** Small spaced-out line under the label, e.g. "BEST 580". */
  sublabel?: string;
  icon?: IconName;
  /** "hero" is the big Home pill with a trailing arrow; "regular" is a standard button. */
  size?: "hero" | "regular";
  /** Dimmed and unpressable, with no halo. */
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * The glossy neon primary button. The gradient and the halo behind it are
 * pre-rendered PNGs (art-source/tools/make-ui-assets.js) — there is no
 * runtime gradient or blur, which is what keeps it visible on real devices.
 */
export function GlowButton({
  label,
  onPress,
  sublabel,
  icon,
  size = "regular",
  disabled = false,
  style,
}: GlowButtonProps) {
  const hero = size === "hero";

  const handlePress = () => {
    soundManager.playUiTap();
    onPress();
  };

  return (
    <View style={[hero ? styles.wrapHero : styles.wrapRegular, disabled && styles.disabled, style]}>
      {!disabled && (
        <Image
          source={require("../../../assets/ui/glow-accent.png")}
          style={styles.glow}
          resizeMode="stretch"
          fadeDuration={0}
        />
      )}
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          hero ? styles.buttonHero : styles.buttonRegular,
          pressed && styles.pressed,
        ]}
      >
        <ImageBackground
          source={require("../../../assets/ui/btn-primary.png")}
          resizeMode="stretch"
          fadeDuration={0}
          style={styles.fill}
        >
          <View style={[styles.labelRow, hero && styles.labelRowHero]}>
            {icon && (
              <MaterialCommunityIcon name={icon} size={hero ? 28 : 22} color={colors.accentInk} />
            )}
            <View style={styles.labelColumn}>
              <Text style={[styles.label, hero && styles.labelHero]}>{label}</Text>
              {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
            </View>
          </View>
          {hero && (
            <View style={styles.arrow}>
              <MaterialCommunityIcon name="chevron-right" size={28} color={colors.accentBright} />
            </View>
          )}
        </ImageBackground>
      </Pressable>
    </View>
  );
}

const HERO_HEIGHT = 88;
const REGULAR_HEIGHT = 56;

const styles = StyleSheet.create({
  wrapHero: {
    height: HERO_HEIGHT,
  },
  wrapRegular: {
    height: REGULAR_HEIGHT,
    alignSelf: "stretch",
  },
  disabled: {
    opacity: 0.4,
  },
  // The halo's bright core covers ~72% x 38% of the PNG, so the image is
  // oversized and offset to line that core up with the button itself.
  glow: {
    position: "absolute",
    left: "-19%",
    top: "-83%",
    width: "138%",
    height: "266%",
    opacity: 0.75,
  },
  button: {
    flex: 1,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.accentBright,
  },
  buttonHero: {
    borderRadius: HERO_HEIGHT / 2,
  },
  buttonRegular: {
    borderRadius: 16,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  fill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  // Nudged left so the label never runs under the trailing arrow on narrow phones.
  labelRowHero: {
    marginRight: 28,
  },
  labelColumn: {
    alignItems: "center",
  },
  label: {
    color: colors.accentInk,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1.5,
  },
  labelHero: {
    fontSize: 25,
    letterSpacing: 2,
  },
  sublabel: {
    color: colors.accentInk,
    opacity: 0.75,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 4,
    marginTop: 2,
  },
  arrow: {
    position: "absolute",
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accentDeep,
    alignItems: "center",
    justifyContent: "center",
  },
});
