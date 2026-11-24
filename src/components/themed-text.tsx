import { StyleSheet, Text, type TextProps } from "react-native";

import { DesignTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/styling/use-theme-color";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: DesignTokens.typography.body,
    lineHeight: DesignTokens.typography.lineHeight.body,
  },
  defaultSemiBold: {
    fontSize: DesignTokens.typography.body,
    lineHeight: DesignTokens.typography.lineHeight.body,
    fontWeight: DesignTokens.fontWeight.semibold,
  },
  title: {
    fontSize: DesignTokens.typography.heading,
    fontWeight: DesignTokens.fontWeight.bold,
    lineHeight: DesignTokens.typography.lineHeight.heading,
  },
  subtitle: {
    fontSize: DesignTokens.typography.section,
    fontWeight: DesignTokens.fontWeight.bold,
  },
  link: {
    lineHeight: DesignTokens.typography.lineHeight.title,
    fontSize: DesignTokens.typography.body,
    color: "#0a7ea4",
  },
});
