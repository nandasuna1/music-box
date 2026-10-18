import { DesignTokens } from "@/constants/theme";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "danger";

type Props = Omit<PressableProps, "children" | "style"> & {
  children: string;
  variant?: ButtonVariant;
  loading?: boolean;
  loadingText?: string;
  style?: StyleProp<ViewStyle>;
};

const variantStyles = {
  primary: {
    backgroundColor: DesignTokens.colors.accent,
    color: DesignTokens.colors.onAccent,
    indicatorColor: DesignTokens.colors.onAccent,
  },
  secondary: {
    backgroundColor: DesignTokens.colors.surfaceElevated,
    color: DesignTokens.colors.text,
    indicatorColor: DesignTokens.colors.text,
  },
  danger: {
    backgroundColor: DesignTokens.colors.dangerSurface,
    color: DesignTokens.colors.white,
    indicatorColor: DesignTokens.colors.white,
  },
} satisfies Record<
  ButtonVariant,
  { backgroundColor: string; color: string; indicatorColor: string }
>;

export function Button({
  children,
  variant = "primary",
  loading = false,
  loadingText,
  disabled = false,
  style,
  ...pressableProps
}: Props) {
  const isDisabled = disabled || loading;
  const colors = variantStyles[variant];

  return (
    <Pressable
      {...pressableProps}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isDisabled
            ? DesignTokens.colors.disabledBackground
            : pressed && variant === "primary"
              ? DesignTokens.colors.accentPressed
              : colors.backgroundColor,
        },
        pressed && !isDisabled ? styles.pressed : undefined,
        isDisabled ? styles.disabled : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            isDisabled
              ? DesignTokens.colors.disabledText
              : colors.indicatorColor
          }
        />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: isDisabled
                ? DesignTokens.colors.disabledText
                : colors.color,
            },
          ]}
        >
          {children}
        </Text>
      )}
      {loading && loadingText ? (
        <Text
          style={[
            styles.label,
            {
              color: isDisabled
                ? DesignTokens.colors.disabledText
                : colors.color,
            },
          ]}
        >
          {loadingText}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: DesignTokens.sizing.controlMinHeight,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radii.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: DesignTokens.spacing.sm,
  },
  label: {
    fontSize: DesignTokens.typography.body,
    fontWeight: DesignTokens.fontWeight.semibold,
    textAlign: "center",
  },
  pressed: {
    opacity: DesignTokens.interaction.pressedOpacity,
  },
  disabled: {
    opacity: DesignTokens.interaction.disabledOpacity,
  },
});
