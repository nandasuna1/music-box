/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const DesignTokens = {
  colors: {
    background: "#0E0E10",
    surface: "#18181B",
    surfaceElevated: "#222226",
    text: "#F5F5F5",
    textMuted: "#A1A1AA",
    textSubtle: "#8A8A8A",
    accent: "#FFD700",
    accentPressed: "#E6C200",
    onAccent: "#17140A",
    border: "#3F3F46",
    danger: "#FF8A8A",
    dangerSurface: "#B42318",
    disabledBackground: "#3F3F46",
    disabledText: "#D4D4D8",
    white: "#FFFFFF",
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  typography: {
    caption: 12,
    body: 16,
    subtitle: 18,
    section: 20,
    title: 24,
    heading: 32,
    display: 48,
    lineHeight: {
      caption: 18,
      body: 24,
      section: 24,
      title: 30,
      heading: 32,
    },
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extraBold: "800",
  },
  sizing: {
    controlMinHeight: 48,
    commentFieldMinHeight: 80,
    avatar: 56,
    albumArtwork: 120,
    ratingStar: 28,
    compactRatingStar: 12,
    icon: 28,
    trackIndexWidth: 24,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
    avatar: 28,
  },
  elevation: {
    card: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 3,
    },
  },
  interaction: {
    pressedOpacity: 0.82,
    disabledOpacity: 0.6,
    focusBorderWidth: 2,
    defaultBorderWidth: 1,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
