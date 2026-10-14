import React, { PropsWithChildren } from "react";
import { Image, StyleSheet, View, ViewStyle } from "react-native";

interface FramedCardProps {
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

/**
 * Content inside the glowing cut-corner frame (Run Complete, Pause).
 *
 * The frame is an absolutely filled Image in an unpadded wrapper, with the
 * padding on a separate inner View. As an ImageBackground with padding, the
 * frame was sized to the padded content box and drew narrower than the card.
 */
export function FramedCard({ children, style, contentStyle }: PropsWithChildren<FramedCardProps>) {
  return (
    <View style={style}>
      <Image
        source={require("../../../assets/ui/panel-frame.png")}
        style={styles.frame}
        resizeMode="stretch"
        fadeDuration={0}
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  // The frame PNG has a transparent glow margin (~5% each side), so padding
  // is larger than it looks: content has to clear the drawn border.
  content: {
    paddingVertical: 44,
    paddingHorizontal: 44,
    alignItems: "center",
  },
});
