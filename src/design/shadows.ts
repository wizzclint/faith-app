import { Platform } from "react-native";

/** FAITH design tokens — a single restrained elevation, used sparingly on dark surfaces. */
export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),
};
